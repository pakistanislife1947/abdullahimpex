import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../supabaseAdmin';
import { asyncRoute, ApiError } from '../middleware/error';
import { nextStockCode } from '../lib/codeGen';
import { AuthedRequest } from '../middleware/auth';

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
    const [purchaseRes, saleRes, adjustmentRes] = await Promise.all([
      supabaseAdmin
        .from('purchase_items')
        .select('quantity, rate, amount, purchases(purchase_date, created_at, suppliers(name))')
        .eq('stock_id', req.params.id),
      supabaseAdmin
        .from('sale_items')
        .select('quantity, rate, amount, sales(sale_date, created_at, customers(name))')
        .eq('stock_id', req.params.id),
      supabaseAdmin
        .from('stock_adjustments')
        .select('change_type, delta, resulting_quantity, note, created_at')
        .eq('stock_id', req.params.id),
    ]);

    if (purchaseRes.error) throw purchaseRes.error;
    if (saleRes.error) throw saleRes.error;
    if (adjustmentRes.error) throw adjustmentRes.error;

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
      ...(adjustmentRes.data ?? []).map((a: any) => ({
        type: a.change_type as 'initial' | 'adjustment', // 'initial' or 'adjustment'
        date: a.created_at,
        recorded_at: a.created_at,
        party: null,
        quantity: a.delta,
        rate: null,
        amount: null,
        note: a.note,
        resulting_quantity: a.resulting_quantity,
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
  asyncRoute(async (req: AuthedRequest, res) => {
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

    // Log the starting quantity so it shows up in this item's history too.
    await supabaseAdmin.from('stock_adjustments').insert({
      stock_id: data.id,
      change_type: 'initial',
      delta: data.quantity,
      resulting_quantity: data.quantity,
      note: 'Initial stock added',
      created_by: req.user?.id ?? null,
    });

    res.status(201).json({ data });
  })
);

router.put(
  '/:id',
  asyncRoute(async (req: AuthedRequest, res) => {
    const body = stockSchema.partial().parse(req.body);

    // Snapshot the quantity before updating, so we can log how much it
    // changed by — this is what shows up as a +/- entry in the item's history.
    const before = await supabaseAdmin.from('stock').select('quantity').eq('id', req.params.id).single();
    if (before.error) throw new ApiError(404, 'Stock item not found.');
    const previousQuantity = Number(before.data.quantity);

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

    const newQuantity = Number(data.quantity);
    const delta = newQuantity - previousQuantity;
    if (body.quantity !== undefined && delta !== 0) {
      await supabaseAdmin.from('stock_adjustments').insert({
        stock_id: data.id,
        change_type: 'adjustment',
        delta,
        resulting_quantity: newQuantity,
        note: 'Manual quantity adjustment',
        created_by: req.user?.id ?? null,
      });
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
