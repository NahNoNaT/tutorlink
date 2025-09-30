-- Align bookings.payment_status allowed values with the app
-- Error seen: "violates check constraint 'bookings_payment_status_check'"
-- Fix: extend the CHECK list to include pending_review and paid (and common others)

alter table if exists public.bookings
  drop constraint if exists bookings_payment_status_check;

alter table if exists public.bookings
  add constraint bookings_payment_status_check
  check (payment_status in (
    'unpaid',
    'pending_review',
    'paid',
    'failed',
    'canceled'
  ));

-- Optional: set default to 'unpaid' if not already
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='bookings'
      and column_name='payment_status' and column_default like '%unpaid%'
  ) then
    alter table public.bookings alter column payment_status set default 'unpaid';
  end if;
end $$;

