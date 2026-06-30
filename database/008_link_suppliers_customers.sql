-- =====================================================================
-- Lets the same business be both a supplier and a customer. Adds a
-- self-link between the two tables: when a supplier is also a customer
-- (or vice versa), they're linked here so you don't have to re-enter
-- the same contact details twice, and both records stay easy to find
-- from one another. Run once in Supabase SQL Editor.
-- =====================================================================

alter table suppliers add column if not exists linked_customer_id uuid references customers (id) on delete set null;
alter table customers add column if not exists linked_supplier_id uuid references suppliers (id) on delete set null;
