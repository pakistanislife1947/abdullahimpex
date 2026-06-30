-- =====================================================================
-- Lets each company upload a custom invoice letterhead (header design) —
-- if set, this image is placed at the top of that company's invoice PDFs
-- instead of the built-in generated header, so invoices can match
-- whatever design you upload. Run once in Supabase SQL Editor.
-- =====================================================================

alter table companies add column if not exists invoice_letterhead_url text;
