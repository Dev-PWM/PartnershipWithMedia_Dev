-- Durable progress for sale emails. Existing orders are treated as already notified on rollout; automatically
-- replaying them would send historical buyers a second welcome. New orders get pending receipts in the same
-- transaction as the order insert, including inserts made by the old webhook during a rolling deploy.
create table public.client_sale_deliveries (
  order_id uuid not null references public.client_orders(id),
  recipient text not null check (recipient in ('owner', 'buyer')),
  payload jsonb,
  sent_at timestamptz,
  lease_token uuid,
  lease_until timestamptz,
  primary key (order_id, recipient)
);
alter table public.client_sale_deliveries enable row level security;
revoke all on public.client_sale_deliveries from public, anon, authenticated;

create function public.queue_client_sale() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.client_sale_deliveries (order_id, recipient, sent_at)
  values (new.id, 'owner', null), (new.id, 'buyer', case when new.buyer_email is null then now() end);
  return new;
end $$;
create trigger client_sale_queue after insert on public.client_orders
  for each row execute function public.queue_client_sale();

-- Installing the trigger acquires the order-table lock before this rollout snapshot.
insert into public.client_sale_deliveries (order_id, recipient, sent_at)
  select o.id, r, now() from public.client_orders o cross join unnest(array['owner', 'buyer']) r;

create function public.client_sale_state(p_session_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('status', o.status, 'token_hash', o.access_token_hash,
    'complete', not exists (select 1 from public.client_sale_deliveries d where d.order_id = o.id and d.sent_at is null))
  from public.client_orders o where o.stripe_session_id = p_session_id;
$$;

-- Freeze the full request on its first attempt: Resend rejects a reused key with different content. A short lease
-- serializes webhook/cron races. A process that dies is retried after the lease expires.
create function public.claim_client_sale_email(p_session_id text, p_recipient text, p_payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d public.client_sale_deliveries;
begin
  select e.* into d from public.client_sale_deliveries e join public.client_orders o on o.id = e.order_id
    where o.stripe_session_id = p_session_id and e.recipient = p_recipient for update of e;
  if not found then raise exception 'Sale email receipt missing'; end if;
  if d.sent_at is not null then return jsonb_build_object('result', 'sent'); end if;
  if d.lease_until > now() then return jsonb_build_object('result', 'busy'); end if;
  update public.client_sale_deliveries set payload = coalesce(payload, p_payload),
    lease_token = gen_random_uuid(), lease_until = now() + interval '2 minutes'
    where order_id = d.order_id and recipient = d.recipient returning * into d;
  return jsonb_build_object('result', 'send', 'token', d.lease_token, 'payload', d.payload);
end $$;

create function public.finish_client_sale_email(p_session_id text, p_recipient text, p_token uuid, p_sent boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.client_sale_deliveries d set sent_at = case when p_sent then now() else d.sent_at end,
    payload = case when p_sent then null else d.payload end,
    lease_token = null, lease_until = null from public.client_orders o
    where d.order_id = o.id and o.stripe_session_id = p_session_id and d.recipient = p_recipient and d.lease_token = p_token;
  return found;
end $$;

-- A resumable sweep, keyed by account/mode/cutoff. It fixes a bounded number of sessions per invocation without
-- forgetting older sessions. Completing a sweep resets its cursor so delayed bank payments are checked again.
create table public.client_reconcile_runs (
  scope text primary key,
  cursor text,
  through_second bigint,
  lease_token uuid,
  lease_until timestamptz
);
alter table public.client_reconcile_runs enable row level security;
revoke all on public.client_reconcile_runs from public, anon, authenticated;
create function public.claim_client_reconcile(p_scope text, p_through bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.client_reconcile_runs;
begin
  insert into public.client_reconcile_runs (scope) values (p_scope) on conflict do nothing;
  select * into r from public.client_reconcile_runs where scope = p_scope for update;
  if r.lease_until > now() then return jsonb_build_object('result', 'busy'); end if;
  update public.client_reconcile_runs set lease_token = gen_random_uuid(), lease_until = now() + interval '6 minutes',
    through_second = coalesce(through_second, p_through)
    where scope = p_scope returning * into r;
  return jsonb_build_object('result', 'claimed', 'token', r.lease_token, 'cursor', r.cursor, 'through', r.through_second);
end $$;
create function public.checkpoint_client_reconcile(p_scope text, p_token uuid, p_cursor text, p_release boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.client_reconcile_runs set cursor = p_cursor,
    through_second = case when p_cursor is null then null else through_second end,
    lease_token = case when p_release then null else lease_token end,
    lease_until = case when p_release then null else now() + interval '6 minutes' end
    where scope = p_scope and lease_token = p_token;
  return found;
end $$;

revoke all on function public.queue_client_sale(), public.client_sale_state(text),
  public.claim_client_sale_email(text,text,jsonb), public.finish_client_sale_email(text,text,uuid,boolean),
  public.claim_client_reconcile(text,bigint), public.checkpoint_client_reconcile(text,uuid,text,boolean)
  from public, anon, authenticated;
grant execute on function public.client_sale_state(text), public.claim_client_sale_email(text,text,jsonb),
  public.finish_client_sale_email(text,text,uuid,boolean), public.claim_client_reconcile(text,bigint),
  public.checkpoint_client_reconcile(text,uuid,text,boolean) to service_role;

-- Ambiguous/refunded sales remain visible for owner review, without promising work or resurrecting a cancelled plan.
create table public.client_sale_reviews (
  stripe_session_id text primary key,
  reason text not null,
  observed_at timestamptz not null default now()
);
alter table public.client_sale_reviews enable row level security;
revoke all on public.client_sale_reviews from public, anon, authenticated;
create function public.review_client_sale(p_session_id text, p_reason text) returns void
language sql security definer set search_path = '' as $$
  insert into public.client_sale_reviews (stripe_session_id, reason) values (p_session_id, p_reason)
    on conflict (stripe_session_id) do update set reason = excluded.reason, observed_at = now();
$$;
revoke all on function public.review_client_sale(text,text) from public, anon, authenticated;
grant execute on function public.review_client_sale(text,text) to service_role;
create function public.clear_client_sale_review(p_session_id text) returns void
language sql security definer set search_path = '' as $$
  delete from public.client_sale_reviews where stripe_session_id = p_session_id;
$$;
revoke all on function public.clear_client_sale_review(text) from public, anon, authenticated;
grant execute on function public.clear_client_sale_review(text) to service_role;
