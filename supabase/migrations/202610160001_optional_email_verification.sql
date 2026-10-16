-- Supabase auto-confirms password signups when Confirm Email is off. Keep
-- evidence of actual mailbox verification separately; clients cannot forge it.
create table if not exists public.email_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  verified_at timestamptz not null default now()
);
alter table public.email_verifications enable row level security;
revoke all on public.email_verifications from public, anon, authenticated;
grant select, insert, update on public.email_verifications to service_role;
-- No client policies. Only the authenticated verify-email function writes
-- after Supabase has validated a single-use email OTP for that same account.
