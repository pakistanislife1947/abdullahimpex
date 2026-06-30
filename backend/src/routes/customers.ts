import { z } from 'zod';
import { Router } from 'express';
import { createCrudRouter } from '../lib/crudRouter';
import { supabaseAdmin } from '../supabaseAdmin';
import { asyncRoute, ApiError } from '../middleware/error';

const customerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  contact_person: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal('')),
  address: z.string().trim().optional().nullable(),
  ntn: z.string().trim().optional().nullable(),
  strn: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const router = createCrudRouter({
  table: 'customers',
  schema: customerSchema,
  searchColumns: ['name', 'phone', 'contact_person'],
  label: 'Customer',
});

// POST /customers/:id/also-supplier — this customer is also a supplier.
router.post(
  '/:id/also-supplier',
  asyncRoute(async (req, res) => {
    const { data: customer, error: customerErr } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (customerErr || !customer) throw new ApiError(404, 'Customer not found.');

    if (customer.linked_supplier_id) {
      const { data: existing } = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .eq('id', customer.linked_supplier_id)
        .maybeSingle();
      if (existing) return res.json({ data: existing, alreadyLinked: true });
    }

    const { data: supplier, error: supplierErr } = await supabaseAdmin
      .from('suppliers')
      .insert({
        name: customer.name,
        contact_person: customer.contact_person,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        ntn: customer.ntn,
        linked_customer_id: customer.id,
      })
      .select()
      .single();
    if (supplierErr) throw supplierErr;

    await supabaseAdmin.from('customers').update({ linked_supplier_id: supplier.id }).eq('id', customer.id);

    res.status(201).json({ data: supplier, alreadyLinked: false });
  })
);

export default router;
