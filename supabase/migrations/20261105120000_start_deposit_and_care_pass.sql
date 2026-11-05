-- Two $150 products instead of one:
--   project_deposit (shown as "Start Deposit"): work starts on it, so it now needs a signed agreement like a package.
--   care_pass (new, "24-Hour Care Pass"): Maintenance Plan work for non-members for 24 hours. No agreement step.
-- Orders already recorded keep their requires_agreement value; only new deposits are affected.

alter table public.client_orders drop constraint client_orders_offer_check;
alter table public.client_orders add constraint client_orders_offer_check
  check (offer in ('origin', 'nexus', 'aura', 'matrix', 'project_deposit', 'maintenance_monthly', 'care_pass'));

create or replace function public.record_client_order(
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
  values (p_code, p_token_hash, p_session_id, p_offer, p_offer in ('origin', 'nexus', 'aura', 'matrix', 'project_deposit'),
    p_amount_cents, left(lower(p_currency), 3), left(p_buyer_name, 200), left(p_buyer_email, 320), left(p_client_site, 253))
  on conflict (stripe_session_id) do nothing
  returning client_orders.id, client_orders.code into v_id, v_code;
  if v_id is not null then
    insert into public.client_order_events (order_id, kind, title) values (v_id, 'status', 'Payment received');
    return query select v_id, v_code, true;
  else
    return query select o.id, o.code, false from public.client_orders o where o.stripe_session_id = p_session_id;
  end if;
end $$;
