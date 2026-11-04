-- Reminders for build orders that are paid but not yet signed. A daily cron (app/api/cron/signing-reminders) asks which
-- orders are waiting, sends what is due, and records each step here so no reminder goes out twice.
-- Same access model as the order tables: service role only, through the functions below.

create table public.client_order_reminders (
  order_id uuid not null references public.client_orders(id) on delete restrict,
  step text not null check (step in ('buyer_1', 'buyer_2', 'owner')),
  sent_at timestamptz not null default now(),
  primary key (order_id, step)
);
create trigger client_order_reminders_append_only before update or delete on public.client_order_reminders
  for each row execute function public.client_records_append_only();
alter table public.client_order_reminders enable row level security;
revoke all on public.client_order_reminders from public, anon, authenticated;

-- Orders still waiting for a signature, with the reminder steps already sent. The Stripe session id is returned so the
-- server can re-derive the buyer's private link (only its hash is stored).
create function public.orders_awaiting_signature() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'code', o.code, 'offer', o.offer, 'stripe_session_id', o.stripe_session_id, 'buyer_name', o.buyer_name,
    'buyer_email', o.buyer_email, 'amount_cents', o.amount_cents, 'currency', o.currency, 'created_at', o.created_at,
    'sent', coalesce((select jsonb_agg(r.step) from public.client_order_reminders r where r.order_id = o.id), '[]'::jsonb)
  ) order by o.created_at), '[]'::jsonb)
  from public.client_orders o
  where o.requires_agreement and o.status = 'paid'
    and not exists (select 1 from public.client_agreements a where a.order_id = o.id);
$$;

-- Records a sent step. Returns false when it was already recorded (a second cron run raced this one).
create function public.record_order_reminder(p_code text, p_step text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  select id into v_id from public.client_orders where code = p_code;
  if v_id is null then return false; end if;
  insert into public.client_order_reminders (order_id, step) values (v_id, p_step) on conflict do nothing;
  if not found then return false; end if;
  insert into public.client_order_events (order_id, kind, title, client_visible)
  values (v_id, 'note', case when p_step = 'owner' then 'Owner alerted: still unsigned' else 'Signing reminder sent' end, false);
  return true;
end $$;

revoke all on function public.orders_awaiting_signature(), public.record_order_reminder(text, text) from public, anon, authenticated;
grant execute on function public.orders_awaiting_signature(), public.record_order_reminder(text, text) to service_role;
