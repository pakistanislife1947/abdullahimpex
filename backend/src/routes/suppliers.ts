import { z } from 'zod';
import { Router } from 'express';
import { createCrudRouter } from '../lib/crudRouter';
import { supabaseAdmin } from '../supabaseAdmin';
import { asyncRoute, ApiError } from '../middleware/error';

const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Supplier name is required'),
  contact_person: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal('')),
  address: z.string().trim().optional().nullable(),
  ntn: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const router = createCrudRouter({
  table: 'suppliers',
  schema: supplierSchema,
  searchColumns: ['name', 'phone', 'contact_person'],
  label: 'Supplier',
});

// POST /suppliers/:id/also-customer — this supplier is also a customer.
// If they're already linked to a customer record, returns that. Otherwise
// creates a new customer record copying the supplier's contact details
// and links the two together.
router.post(
  '/:id/also-customer',
  asyncRoute(async (req, res) => {
    const { data: supplier, error: supplierErr } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (supplierErr || !supplier) throw new ApiError(404, 'Supplier not found.');

    if (supplier.linked_customer_id) {
      const { data: existing } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('id', supplier.linked_customer_id)
        .maybeSingle();
      if (existing) return res.json({ data: existing, alreadyLinked: true });
    }

    const { data: customer, error: customerErr } = await supabaseAdmin
      .from('customers')
      .insert({
        name: supplier.name,
        contact_person: supplier.contact_person,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        ntn: supplier.ntn,
        linked_supplier_id: supplier.id,
      })
      .select()
      .single();
    if (customerErr) throw customerErr;

    await supabaseAdmin.from('suppliers').update({ linked_customer_id: customer.id }).eq('id', supplier.id);

    res.status(201).json({ data: customer, alreadyLinked: false });
  })
);

export default router;
