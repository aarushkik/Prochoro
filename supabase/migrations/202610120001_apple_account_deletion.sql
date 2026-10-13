-- Apply after deploying delete-apple-account; before enabling Apple sign-in.
create or replace function public.delete_account()
returns void
language plpgsql
security definer set search_path = auth, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  -- Apple grants must be revoked by the authenticated Edge Function first.
  -- This also covers an Apple-linked account currently signed in with Google.
  if exists (select 1 from auth.identities where user_id = auth.uid() and provider = 'apple') then
    raise exception 'APPLE_REVOCATION_REQUIRED';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- Signed-in callers only. Without this revoke, the anonymous role could call it
-- too — it would fail on the uid check, but the smaller surface is worth having.
revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
