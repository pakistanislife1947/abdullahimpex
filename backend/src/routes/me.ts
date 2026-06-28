import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../supabaseAdmin';
import { asyncRoute } from '../middleware/error';
import { AuthedRequest } from '../middleware/auth';

const router = Router();

const meSchema = z.object({
  full_name: z.string().trim().min(1, 'Please enter a name'),
});

router.get(
  '/',
  asyncRoute(async (req: AuthedRequest, res) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', req.user!.id)
      .maybeSingle();
    if (error) throw error;
    res.json({ data: { email: req.user!.email, full_name: data?.full_name ?? null } });
  })
);

router.put(
  '/',
  asyncRoute(async (req: AuthedRequest, res) => {
    const body = meSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: req.user!.id, full_name: body.full_name }, { onConflict: 'id' })
      .select('full_name')
      .single();
    if (error) throw error;
    res.json({ data: { email: req.user!.email, full_name: data.full_name } });
  })
);

export default router;
