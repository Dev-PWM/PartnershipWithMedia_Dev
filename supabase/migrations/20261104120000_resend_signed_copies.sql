-- A signature is stored before its two emails go out. If Resend fails then, the buyer's copy and the owner's
-- "ready to start" notice were lost: a second click only answered already_signed. That answer now carries what the
-- sign route needs to send them again (the stored signer, fingerprint and version, never the new request's).
create or replace function public.sign_client_agreement(
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
  if found then
    return jsonb_build_object('result', 'already_signed', 'code', o.code, 'offer', o.offer, 'buyer_name', o.buyer_name,
      'buyer_email', o.buyer_email, 'amount_cents', o.amount_cents, 'currency', o.currency, 'signed_at', a.signed_at,
      'signer_name', a.signer_name, 'agreement_sha256', a.agreement_sha256, 'agreement_version', a.agreement_version);
  end if;
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
