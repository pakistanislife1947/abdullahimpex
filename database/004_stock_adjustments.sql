-- =====================================================================
-- Logs two kinds of stock-quantity changes that aren't purchases or
-- sales: the initial quantity when an item is first created, and any
-- manual +/- adjustment made later while editing an item. Both now show
-- up in that item's history alongside purchase-in / sale-out entries.
-- Run once in Supabase SQL Editor.
-- =====================================================================

create table if not exists stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid not null references stock (id) on delete cascade,
  change_type text not null check (change_type in ('initial', 'adjustment')),
  delta numeric(14,2) not null,
  resulting_quantity numeric(14,2) not null,
  note text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_adjustments_stock on stock_adjustments (stock_id);

alter table stock_adjustments enable row level security;
-- No policies defined on purpose — locked to the backend's service role only,
-- consistent with every other table in this schema.
