import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../supabaseAdmin';
import { asyncRoute, ApiError } from '../middleware/error';

const router = Router();

const companySchema = z.object({
  name: z.string().trim().min(1).optional(),
  ntn: z.string().trim().optional().nullable(),
  strn: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  phone2: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
});

const logoSchema = z.object({
  // Data URL, e.g. "data:image/png;base64,iVBORw0KG..."
  dataUrl: z.string().min(1),
});

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

router.get(
  '/',
  asyncRoute(async (_req, res) => {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .order('is_default', { ascending: false });
    if (error) throw error;
    res.json({ data });
  })
);

router.put(
  '/:id',
  asyncRoute(async (req, res) => {
    const body = companySchema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('companies')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw new ApiError(400, error.message);
    res.json({ data });
  })
);

// POST /companies/:id/logo — upload/replace a company's logo image.
router.post(
  '/:id/logo',
  asyncRoute(async (req, res) => {
    const { dataUrl } = logoSchema.parse(req.body);

    const match = dataUrl.match(/^data:([\w/+.-]+);base64,(.+)$/);
    if (!match) throw new ApiError(400, 'Invalid image data.');
    const [, mimeType, base64] = match;

    const ext = ALLOWED_TYPES[mimeType];
    if (!ext) throw new ApiError(400, 'Please upload a PNG, JPG, WEBP, or SVG image.');

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.byteLength > MAX_LOGO_BYTES) throw new ApiError(400, 'Logo must be smaller than 2MB.');

    const path = `${req.params.id}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('branding')
      .upload(path, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) throw new ApiError(500, 'Could not upload the logo. Please try again.');

    const { data: publicUrlData } = supabaseAdmin.storage.from('branding').getPublicUrl(path);

    const { data, error } = await supabaseAdmin
      .from('companies')
      .update({ logo_url: publicUrlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  })
);

export default router;
