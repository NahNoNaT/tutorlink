-- Create payments table to log gateway transactions
create table if not exists public.payments (
  id bigserial primary key,
  booking_id bigint references public.bookings(id) on delete set null,
  gateway text not null,
  order_id text not null,
  transaction_ref text,
  amount bigint not null,
  currency text not null default 'VND',
  status text not null,
  raw_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_payments_booking_id on public.payments(booking_id);
create index if not exists idx_payments_order_id on public.payments(order_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- Optional: add stripe_account_id to profiles if not exists (for future Stripe payouts)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'stripe_account_id'
  ) then
    alter table public.profiles add column stripe_account_id text;
  end if;
end $$;

-- Note: RLS policies are not added here. If you enable RLS, restrict to service-role for writes.

