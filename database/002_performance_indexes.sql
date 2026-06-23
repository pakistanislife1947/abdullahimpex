-- =====================================================================
-- Performance indexes — run this once in Supabase SQL Editor.
-- Speeds up: date-range filters (purchases/sales/invoices), and joins
-- to suppliers/customers, which are used on nearly every list/dashboard
-- query in the app.
-- =====================================================================

create index if not exists idx_purchases_date on purchases (purchase_date desc);
create index if not exists idx_purchases_supplier on purchases (supplier_id);

create index if not exists idx_sales_date on sales (sale_date desc);
create index if not exists idx_sales_customer on sales (customer_id);
create index if not exists idx_sales_invoiced on sales (invoiced) where invoiced = false;

create index if not exists idx_invoices_date on invoices (invoice_date desc);
create index if not exists idx_invoices_customer on invoices (customer_id);
create index if not exists idx_invoices_company on invoices (company_id);

create index if not exists idx_purchase_items_purchase on purchase_items (purchase_id);
create index if not exists idx_purchase_items_stock on purchase_items (stock_id);

create index if not exists idx_sale_items_sale on sale_items (sale_id);
create index if not exists idx_sale_items_stock on sale_items (stock_id);

create index if not exists idx_invoice_items_invoice on invoice_items (invoice_id);
