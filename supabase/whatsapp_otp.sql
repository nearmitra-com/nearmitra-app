-- WhatsApp OTP verification table
-- Run this in your Supabase SQL Editor

create table if not exists phone_otps (
  id          uuid        default gen_random_uuid() primary key,
  phone       text        not null,
  otp         text        not null,
  expires_at  timestamptz not null default (now() + interval '10 minutes'),
  verified    boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists phone_otps_phone_idx on phone_otps (phone);

-- RLS: allow anonymous access because the user is not logged in yet during signup
alter table phone_otps enable row level security;

drop policy if exists "anon_insert" on phone_otps;
create policy "anon_insert" on phone_otps for insert with check (true);

drop policy if exists "anon_select" on phone_otps;
create policy "anon_select" on phone_otps for select using (true);

drop policy if exists "anon_update" on phone_otps;
create policy "anon_update" on phone_otps for update using (true);

drop policy if exists "anon_delete" on phone_otps;
create policy "anon_delete" on phone_otps for delete using (true);
