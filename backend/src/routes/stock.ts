import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../supabaseAdmin';
import { asyncRoute, ApiError } from '../middleware/error';
import { nextStockCode } from '../lib/codeGen';

const router = Router();

const stockSchema = z.object({
  code: z.string().trim().min(1).optional(), // optional on create -> auto-generated
  name: z.string().trim().min(1, 'Product name is required'),
  size: z.string().trim().optional().nullable(),
  unit: z.enum(['ft', 'set', 'nos', 'mtr']),
  quantity: z.number().nonnegative().default(0),
  purchase_rate: z.number().nonnegative().default(0),
  sale_rate: z.number().nonnegative().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  specification: z.string().trim().optional().nullable(),
  low_stock_threshold: z.number().nonnegative().optional(),
});

// GET /stock?search=... -> search by code, OR by name+size together
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const search = (req.query.search as string | undefined)?.trim();
    let query = supabaseAdmin.from('stock').select('*').order('name', { ascending: true });

    if (search) {
      // Matches the unique code exactly/partially, OR matches product name,
      // OR matches the size string — covers "search by code" and
      // "search by name with size" in one box.
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%,size.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ data });
  })
);

router.get(
  '/next-code',
  asyncRoute(async (_req, res) => {
    const code = await nextStockCode();
    res.json({ code });
  })
);

router.get(
  '/:id/history',
  asyncRoute(async (req, res) => {
    const [purchaseRes, saleRes] = await Promise.all([
      supabaseAdmin
        .from('purchase_items')
        .select('quantity, rate, amount, purchases(purchase_date, created_at, suppliers(name))')
        .eq('stock_id', req.params.id),
      supabaseAdmin
        .from('sale_items')
        .select('quantity, rate, amount, sales(sale_date, created_at, customers(name))')
        .eq('stock_id', req.params.id),
    ]);

    if (purchaseRes.error) throw purchaseRes.error;
    if (saleRes.error) throw saleRes.error;

    const movements = [
      ...(purchaseRes.data ?? []).map((p: any) => ({
        type: 'in' as const,
        date: p.purchases?.purchase_date,
        recorded_at: p.purchases?.created_at,
        party: p.purchases?.suppliers?.name ?? null,
        quantity: p.quantity,
        rate: p.rate,
        amount: p.amount,
      })),
      ...(saleRes.data ?? []).map((s: any) => ({
        type: 'out' as const,
        date: s.sales?.sale_date,
        recorded_at: s.sales?.created_at,
        party: s.sales?.customers?.name ?? null,
        quantity: s.quantity,
        rate: s.rate,
        amount: s.amount,
      })),
    ].sort((a, b) => new Date(b.recorded_at ?? b.date).getTime() - new Date(a.recorded_at ?? a.date).getTime());

    res.json({ data: movements });
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('stock')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw new ApiError(404, 'Stock item not found.');
    res.json({ data });
  })
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const body = stockSchema.parse(req.body);
    const code = body.code && body.code.length > 0 ? body.code : await nextStockCode();

    const { data, error } = await supabaseAdmin
      .from('stock')
      .insert({ ...body, code })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError(409, `Item code "${code}" already exists.`);
      throw error;
    }
    res.status(201).json({ data });
  })
);

router.put(
  '/:id',
  asyncRoute(async (req, res) => {
    const body = stockSchema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('stock')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'That item code is already in use.');
      throw error;
    }
    res.json({ data });
  })
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const { error } = await supabaseAdmin.from('stock').delete().eq('id', req.params.id);
    if (error) {
      throw new ApiError(
        409,
        'This item is referenced in purchase, sale, or invoice records and cannot be deleted.'
      );
    }
    res.status(204).send();
  })
);

export default router;
