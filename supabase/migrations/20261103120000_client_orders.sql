-- Client orders for PWM_DEV packages: one row per paid Stripe Checkout session, a private status page per buyer,
-- and a separately signed service agreement before build work starts.
--
-- Access model: nothing here is readable or writable by the anon or authenticated roles. The site's server calls the
-- security-definer functions below with the service-role key; every rule (one order per session, one signature per
-- order, legal status changes) is enforced here so it holds no matter which caller retries or races.
--
-- Values Stripe supplies (names, emails, amounts, currency) carry no CHECK constraints on purpose: a rejected row
-- would make the webhook fail and Stripe retry for days. They are length-capped on insert instead.

create table public.client_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^PWM-[A-Z2-7]{8}$'),
  access_token_hash text not null unique check (access_token_hash ~ '^[0-9a-f]{64}$'),
  stripe_session_id text not null unique,
  offer text not null check (offer in ('origin', 'nexus', 'aura', 'matrix', 'project_deposit', 'maintenance_monthly')),
  -- Build packages need a signed agreement before work starts; deposits and the maintenance plan do not.
  requires_agreement boolean not null,
  amount_cents integer,
  currency text,
  buyer_name text,
  buyer_email text,
  client_site text,
  status text not null default 'paid' check (status in
    ('paid', 'agreement_signed', 'kickoff', 'in_build', 'in_review', 'live', 'on_hold', 'cancelled', 'refunded')),
  live_url text check (live_url is null or live_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.client_orders(id) on delete restrict,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('status', 'agreement', 'note')),
  title text not null,
  detail text,
  client_visible boolean not null default true
);
create index client_order_events_order_idx on public.client_order_events (order_id, id);

-- One signature per order. The sha256 covers the agreement text of that version plus the order's code, package and
-- amount, so the record proves exactly what was agreed to.
create table public.client_agreements (
  order_id uuid primary key references public.client_orders(id) on delete restrict,
  agreement_version text not null,
  agreement_sha256 text not null check (agreement_sha256 ~ '^[0-9a-f]{64}$'),
  signer_name text not null check (char_length(signer_name) between 2 and 120),
  signer_email text,
  signed_at timestamptz not null default now(),
  ip_hash text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  user_agent text check (user_agent is null or char_length(user_agent) <= 400)
);

-- The timeline and signatures are records: they can be added to, never edited or removed.
create function public.client_records_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception '% is append-only.', tg_table_name;
end $$;
create trigger client_order_events_append_only before update or delete on public.client_order_events
  for each row execute function public.client_records_append_only();
create trigger client_agreements_append_only before update or delete on public.client_agreements
  for each row execute function public.client_records_append_only();

create function public.client_orders_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger client_orders_touch before update on public.client_orders
  for each row execute function public.client_orders_touch();

alter table public.client_orders enable row level security;
alter table public.client_order_events enable row level security;
alter table public.client_agreements enable row level security;
revoke all on public.client_orders, public.client_order_events, public.client_agreements from public, anon, authenticated;

-- Status shown to the buyer, kept beside the transition rules so both change together.
create function public.client_order_status_label(p_status text) returns text
language sql immutable set search_path = '' as $$
  select case p_status
    when 'paid' then 'Payment received'
    when 'agreement_signed' then 'Agreement signed'
    when 'kickoff' then 'Kickoff'
    when 'in_build' then 'In build'
    when 'in_review' then 'Ready for your review'
    when 'live' then 'Live'
    when 'on_hold' then 'On hold'
    when 'cancelled' then 'Cancelled'
    when 'refunded' then 'Refunded'
  end;
$$;

-- Called by the Stripe webhook. Stripe retries and may deliver twice at once: the unique session id gives one row and
-- one "Payment received" entry however many deliveries arrive. `created` tells the caller whether this call made it.
create function public.record_client_order(
  p_code text, p_token_hash text, p_session_id text, p_offer text, p_amount_cents integer, p_currency text,
  p_buyer_name text, p_buyer_email text, p_client_site text
) returns table(order_id uuid, code text, created boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_id uuid;
  v_code text;
begin
  insert into public.client_orders (code, access_token_hash, stripe_session_id, offer, requires_agreement, amount_cents,
    currency, buyer_name, buyer_email, client_site)
  values (p_code, p_token_hash, p_session_id, p_offer, p_offer in ('origin', 'nexus', 'aura', 'matrix'), p_amount_cents,
    left(lower(p_currency), 3), left(p_buyer_name, 200), left(p_buyer_email, 320), left(p_client_site, 253))
  on conflict (stripe_session_id) do nothing
  returning client_orders.id, client_orders.code into v_id, v_code;
  if v_id is not null then
    insert into public.client_order_events (order_id, kind, title) values (v_id, 'status', 'Payment received');
    return query select v_id, v_code, true;
  else
    return query select o.id, o.code, false from public.client_orders o where o.stripe_session_id = p_session_id;
  end if;
end $$;

-- What the buyer's private page shows. No Stripe ids, token hash, email or internal notes.
create function public.client_order_by_token(p_token_hash text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', o.code, 'offer', o.offer, 'status', o.status, 'status_label', public.client_order_status_label(o.status),
    'requires_agreement', o.requires_agreement, 'amount_cents', o.amount_cents, 'currency', o.currency,
    'buyer_name', o.buyer_name, 'client_site', o.client_site, 'live_url', o.live_url, 'created_at', o.created_at,
    'agreement', (select jsonb_build_object('version', a.agreement_version, 'sha256', a.agreement_sha256,
        'signer_name', a.signer_name, 'signed_at', a.signed_at)
      from public.client_agreements a where a.order_id = o.id),
    'events', coalesce((select jsonb_agg(jsonb_build_object('title', e.title, 'detail', e.detail, 'created_at', e.created_at) order by e.id)
      from public.client_order_events e where e.order_id = o.id and e.client_visible), '[]'::jsonb))
  from public.client_orders o where o.access_token_hash = p_token_hash;
$$;

-- The buyer signs from their private page. The row lock makes concurrent submissions wait, so exactly one signs.
create function public.sign_client_agreement(
  p_token_hash text, p_version text, p_sha256 text, p_signer_name text, p_ip_hash text, p_user_agent text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  o public.client_orders;
  a public.client_agreements;
begin
  select * into o from public.client_orders where access_token_hash = p_token_hash for update;
  if not found then return jsonb_build_object('result', 'not_found'); end if;
  select * into a from public.client_agreements where order_id = o.id;
  if found then return jsonb_build_object('result', 'already_signed', 'code', o.code, 'signed_at', a.signed_at); end if;
  if not o.requires_agreement or o.status <> 'paid' then
    return jsonb_build_object('result', 'not_signable', 'code', o.code, 'status', o.status);
  end if;
  insert into public.client_agreements (order_id, agreement_version, agreement_sha256, signer_name, signer_email, ip_hash, user_agent)
  values (o.id, p_version, p_sha256, p_signer_name, o.buyer_email, p_ip_hash, left(p_user_agent, 400))
  returning * into a;
  update public.client_orders set status = 'agreement_signed' where id = o.id;
  insert into public.client_order_events (order_id, kind, title, detail)
  values (o.id, 'agreement', 'Agreement signed', format('Signed by %s (agreement version %s)', p_signer_name, p_version));
  return jsonb_build_object('result', 'signed', 'code', o.code, 'offer', o.offer, 'buyer_name', o.buyer_name,
    'buyer_email', o.buyer_email, 'amount_cents', o.amount_cents, 'currency', o.currency, 'signed_at', a.signed_at);
end $$;

-- Owner-only, from scripts/orders.mjs. Refuses impossible moves, and never lets build work start on a package that
-- needs an agreement until one is signed.
create function public.set_client_order_status(p_code text, p_status text, p_note text, p_live_url text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  o public.client_orders;
  allowed text[];
begin
  select * into o from public.client_orders where code = p_code for update;
  if not found then return jsonb_build_object('result', 'not_found'); end if;
  allowed := case o.status
    when 'paid' then array['on_hold', 'cancelled', 'refunded', 'kickoff', 'live']
    when 'agreement_signed' then array['kickoff', 'on_hold', 'cancelled', 'refunded']
    when 'kickoff' then array['in_build', 'on_hold', 'cancelled', 'refunded']
    when 'in_build' then array['in_review', 'on_hold', 'cancelled', 'refunded']
    when 'in_review' then array['in_build', 'live', 'on_hold', 'cancelled', 'refunded']
    when 'live' then array['in_review', 'refunded']
    when 'on_hold' then array['paid', 'kickoff', 'in_build', 'in_review', 'cancelled', 'refunded']
    when 'cancelled' then array['refunded']
    else array[]::text[]
  end;
  if not (p_status = any(allowed)) then
    return jsonb_build_object('result', 'invalid_transition', 'from', o.status, 'to', p_status);
  end if;
  -- Back to "paid" reopens signing, so it is only for an order paused before its agreement was signed.
  if p_status = 'paid' and exists (select 1 from public.client_agreements where order_id = o.id) then
    return jsonb_build_object('result', 'invalid_transition', 'from', o.status, 'to', p_status);
  end if;
  if p_status in ('kickoff', 'in_build', 'in_review', 'live') and o.requires_agreement
     and not exists (select 1 from public.client_agreements where order_id = o.id) then
    return jsonb_build_object('result', 'agreement_required', 'from', o.status, 'to', p_status);
  end if;
  update public.client_orders set status = p_status, live_url = coalesce(p_live_url, live_url) where id = o.id;
  insert into public.client_order_events (order_id, kind, title, detail)
  values (o.id, 'status', public.client_order_status_label(p_status), nullif(trim(p_note), ''));
  return jsonb_build_object('result', 'updated', 'code', o.code, 'from', o.status, 'to', p_status);
end $$;

-- Owner-only overview for scripts/orders.mjs.
create function public.list_client_orders() returns table(
  code text, offer text, status text, buyer_name text, buyer_email text, amount_cents integer, currency text,
  signed boolean, created_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select o.code, o.offer, o.status, o.buyer_name, o.buyer_email, o.amount_cents, o.currency,
    exists (select 1 from public.client_agreements a where a.order_id = o.id), o.created_at
  from public.client_orders o order by o.created_at desc limit 200;
$$;

revoke all on function public.record_client_order(text, text, text, text, integer, text, text, text, text),
  public.client_order_by_token(text), public.sign_client_agreement(text, text, text, text, text, text),
  public.set_client_order_status(text, text, text, text), public.list_client_orders(),
  public.client_order_status_label(text), public.client_records_append_only(), public.client_orders_touch()
  from public, anon, authenticated;
grant execute on function public.record_client_order(text, text, text, text, integer, text, text, text, text),
  public.client_order_by_token(text), public.sign_client_agreement(text, text, text, text, text, text),
  public.set_client_order_status(text, text, text, text), public.list_client_orders()
  to service_role;
