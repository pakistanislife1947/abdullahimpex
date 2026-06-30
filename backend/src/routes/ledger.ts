import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import { supabaseAdmin } from '../supabaseAdmin';
import { asyncRoute, ApiError } from '../middleware/error';
import { renderLedgerPdf, LedgerEntry } from '../lib/pdf';

const router = Router();

const querySchema = z.object({
  party_type: z.enum(['customer', 'supplier']),
  party_id: z.string().uuid(),
  from: z.string(),
  to: z.string(),
});

async function buildLedger(partyType: 'customer' | 'supplier', partyId: string, from: string, to: string) {
  if (partyType === 'customer') {
    const { data: customer, error: custErr } = await supabaseAdmin
      .from('customers')
      .select('name')
      .eq('id', partyId)
      .single();
    if (custErr || !customer) throw new ApiError(404, 'Customer not found.');

    // Opening balance: everything before the period start.
    const { data: priorSales } = await supabaseAdmin
      .from('sales')
      .select('total_amount')
      .eq('customer_id', partyId)
      .lt('sale_date', from);
    const opening = (priorSales ?? []).reduce((s, r) => s + Number(r.total_amount), 0);

    const { data: sales, error: salesErr } = await supabaseAdmin
      .from('sales')
      .select('sale_date, total_amount, sale_items(id)')
      .eq('customer_id', partyId)
      .gte('sale_date', from)
      .lte('sale_date', to)
      .order('sale_date', { ascending: true });
    if (salesErr) throw salesErr;

    const entries: LedgerEntry[] = (sales ?? []).map((s: any) => ({
      date: s.sale_date,
      type: 'Sale',
      description: `Sale — ${s.sale_items?.length ?? 0} item(s)`,
      debit: Number(s.total_amount), // sales increase what the customer owes
      credit: 0,
    }));

    return { partyName: customer.name, partyType: 'Customer' as const, openingBalance: opening, entries };
  }

  const { data: supplier, error: supErr } = await supabaseAdmin
    .from('suppliers')
    .select('name')
    .eq('id', partyId)
    .single();
  if (supErr || !supplier) throw new ApiError(404, 'Supplier not found.');

  const { data: priorPurchases } = await supabaseAdmin
    .from('purchases')
    .select('total_amount')
    .eq('supplier_id', partyId)
    .lt('purchase_date', from);
  const opening = (priorPurchases ?? []).reduce((s, r) => s + Number(r.total_amount), 0);

  const { data: purchases, error: purchErr } = await supabaseAdmin
    .from('purchases')
    .select('purchase_date, total_amount, purchase_items(id)')
    .eq('supplier_id', partyId)
    .gte('purchase_date', from)
    .lte('purchase_date', to)
    .order('purchase_date', { ascending: true });
  if (purchErr) throw purchErr;

  const entries: LedgerEntry[] = (purchases ?? []).map((p: any) => ({
    date: p.purchase_date,
    type: 'Purchase',
    description: `Purchase — ${p.purchase_items?.length ?? 0} item(s)`,
    debit: 0,
    credit: Number(p.total_amount), // purchases increase what we owe the supplier
  }));

  return { partyName: supplier.name, partyType: 'Supplier' as const, openingBalance: opening, entries };
}

// GET /ledger/pdf?party_type=customer&party_id=...&from=...&to=...
router.get(
  '/pdf',
  asyncRoute(async (req, res) => {
    const { party_type, party_id, from, to } = querySchema.parse(req.query);
    const ledgerBase = await buildLedger(party_type, party_id, from, to);

    const buffer = await renderLedgerPdf({
      ...ledgerBase,
      periodStart: from,
      periodEnd: to,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="ledger-${ledgerBase.partyName.replace(/\s+/g, '-')}-${dayjs(from).format('YYYY-MM')}.pdf"`
    );
    res.send(buffer);
  })
);

export default router;
