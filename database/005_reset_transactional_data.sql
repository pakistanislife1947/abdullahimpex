-- =====================================================================
-- RESET — clears all transactional data for a fresh start.
-- Keeps: table structure, company profiles (M Riaz / Abdullah Impex).
-- Wipes: every stock item, purchase, sale, invoice, supplier, customer,
-- and stock history entry.
-- Login users are NOT affected by this — manage those from
-- Authentication -> Users in the Supabase dashboard instead.
--
-- ⚠️ THIS CANNOT BE UNDONE. Make sure this is really what you want
-- before running it.
-- =====================================================================

truncate table
  invoice_items,
  invoices,
  sale_items,
  sales,
  purchase_items,
  purchases,
  stock_adjustments,
  stock,
  customers,
  suppliers
restart identity cascade;

-- Company profiles are intentionally left untouched. If you also want to
-- reset them back to their original seeded values, run this too:
--
-- update companies set
--   ntn = '4196865-4', strn = null,
--   address = 'Main Bazar, Nishatabad, Near Nishat Mills Ltd, Faisalabad.',
--   phone = '0300-9652564', phone2 = '0314-9902564', email = 'm.riaztraders@yahoo.com'
-- where name = 'M Riaz Trading';
