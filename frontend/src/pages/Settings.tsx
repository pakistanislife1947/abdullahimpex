import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, User, KeyRound, Upload } from 'lucide-react';
import { api, ApiClientError } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { triggerBlobDownload } from '../lib/format';
import { PageHeader } from '../components/ui';

interface Company {
  id: string;
  name: string;
  ntn: string | null;
  strn: string | null;
  address: string | null;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  is_default: boolean;
  logo_url: string | null;
  invoice_letterhead_url: string | null;
}

const MODULES = [
  { key: 'stock', label: 'Stock' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'customers', label: 'Customers' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'sales', label: 'Sales' },
  { key: 'invoices', label: 'Invoices' },
];

function CompanyCard({ company, onSaved }: { company: Company; onSaved: () => void }) {
  const [form, setForm] = useState(company);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingLetterhead, setUploadingLetterhead] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/companies/${company.id}`, {
        name: form.name,
        ntn: form.ntn,
        strn: form.strn,
        address: form.address,
        phone: form.phone,
        phone2: form.phone2,
        email: form.email,
      });
      toast.success('Company details updated.');
      setEditing(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, kind: 'logo' | 'letterhead') {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB.');
      return;
    }
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, WEBP, or SVG image.');
      return;
    }

    const setUploading = kind === 'logo' ? setUploadingLogo : setUploadingLetterhead;
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await api.post(`/companies/${company.id}/${kind}`, { dataUrl });
      toast.success(kind === 'logo' ? 'Logo updated.' : 'Invoice design updated — new invoices will use it.');
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveLetterhead() {
    if (!window.confirm('Remove the custom invoice design? New invoices will go back to the default layout.')) return;
    try {
      await api.del(`/companies/${company.id}/letterhead`);
      toast.success('Custom invoice design removed.');
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not remove it.');
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-canvas">
            {company.logo_url ? (
              <img src={company.logo_url} alt={`${company.name} logo`} className="h-full w-full object-contain" />
            ) : (
              <span className="font-display text-lg font-bold text-ink-faint">{company.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className="font-display text-sm font-bold">{company.name}</p>
            {company.is_default && <p className="text-xs text-ink-faint">Default for invoices</p>}
          </div>
        </div>
        {!editing && (
          <button className="btn-secondary" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
        <label className="btn-secondary inline-flex w-fit cursor-pointer">
          <Upload size={14} />
          {uploadingLogo ? 'Uploading…' : company.logo_url ? 'Replace logo' : 'Upload logo'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => handleImageUpload(e, 'logo')}
            disabled={uploadingLogo}
          />
        </label>
        <span className="text-xs text-ink-faint">PNG, JPG, WEBP or SVG, up to 2MB. Used as this company's mark on invoices.</span>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Custom invoice design</p>
        <p className="mt-1 text-xs text-ink-faint">
          Upload your own invoice header/letterhead design (e.g. exported from Word or Canva) — it will be placed at
          the top of every invoice for this company exactly as uploaded, with the item table and totals printed
          below it automatically.
        </p>
        {company.invoice_letterhead_url && (
          <img
            src={company.invoice_letterhead_url}
            alt="Custom invoice letterhead preview"
            className="mt-3 max-h-28 rounded border border-line object-contain"
          />
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="btn-secondary inline-flex w-fit cursor-pointer">
            <Upload size={14} />
            {uploadingLetterhead ? 'Uploading…' : company.invoice_letterhead_url ? 'Replace design' : 'Upload design'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => handleImageUpload(e, 'letterhead')}
              disabled={uploadingLetterhead}
            />
          </label>
          {company.invoice_letterhead_url && (
            <button type="button" className="btn-ghost hover:text-danger" onClick={handleRemoveLetterhead}>
              Remove, use default layout
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">NTN</label>
              <input className="input font-mono" value={form.ntn ?? ''} onChange={(e) => setForm({ ...form, ntn: e.target.value })} />
            </div>
            <div>
              <label className="label">S.T Registration #</label>
              <input className="input font-mono" value={form.strn ?? ''} onChange={(e) => setForm({ ...form, strn: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone 2</label>
              <input className="input" value={form.phone2 ?? ''} onChange={(e) => setForm({ ...form, phone2: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-1 text-sm text-ink-muted">
          <p>NTN: {company.ntn || '—'}</p>
          {company.strn && <p>S.T Reg #: {company.strn}</p>}
          <p>{company.phone}{company.phone2 ? ` / ${company.phone2}` : ''}</p>
          <p>{company.email}</p>
          <p>{company.address}</p>
        </div>
      )}
    </div>
  );
}

function BackupExport() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(MODULES.map((m) => m.key));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [downloading, setDownloading] = useState(false);

  function toggle(key: string) {
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  }

  async function handleDownload() {
    if (selected.length === 0) {
      toast.error('Choose at least one module.');
      return;
    }
    setDownloading(true);
    try {
      const params = new URLSearchParams({ modules: selected.join(',') });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const blob = await api.download(`/export?${params.toString()}`);
      triggerBlobDownload(blob, `backup-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Backup downloaded.');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not generate backup.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="card p-5">
      <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen((o) => !o)}>
        <div>
          <p className="font-display text-sm font-bold">Data export &amp; backup</p>
          <p className="mt-0.5 text-xs text-ink-muted">Download an Excel copy of your data, for a chosen period.</p>
        </div>
        <span className="text-xs font-semibold text-accent-dark">{open ? 'Hide' : 'Open'}</span>
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Modules to include</label>
            <div className="flex flex-wrap gap-2">
              {MODULES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => toggle(m.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selected.includes(m.key) ? 'border-ink bg-ink text-white' : 'border-line text-ink-muted'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tenure from (optional)</label>
              <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">Tenure to (optional)</label>
              <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-ink-faint">Stock is always exported in full — date ranges apply to purchases, sales, and invoices.</p>
          <button className="btn-primary" disabled={downloading} onClick={handleDownload}>
            <Download size={16} /> {downloading ? 'Preparing…' : 'Download backup'}
          </button>
        </div>
      )}
    </div>
  );
}

function AccountSettings() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingName, setSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    api
      .get<{ data: { email: string; full_name: string | null } }>('/me')
      .then((res) => {
        setEmail(res.data.email);
        setName(res.data.full_name ?? '');
      })
      .catch((err) => toast.error(err instanceof ApiClientError ? err.message : 'Could not load your profile.'))
      .finally(() => setLoadingProfile(false));
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setSavingName(true);
    try {
      await api.put('/me', { full_name: name.trim() });
      toast.success('Name updated.');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not update your name.');
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setChangingPassword(true);
    // Password changes go straight through Supabase Auth from the browser —
    // it never passes through our backend, so the new password is never
    // seen anywhere except Supabase's own auth servers.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password changed.');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <form onSubmit={saveName} className="card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <User size={15} className="text-ink-muted" />
          <h3 className="font-display text-sm font-bold">Your name</h3>
        </div>
        {loadingProfile ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : (
          <>
            <div>
              <label className="label">Email</label>
              <input className="input bg-canvas" value={email} disabled />
            </div>
            <div>
              <label className="label">Display name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Abdullah Shahid" />
            </div>
            <button type="submit" disabled={savingName} className="btn-primary">
              {savingName ? 'Saving…' : 'Save name'}
            </button>
          </>
        )}
      </form>

      <form onSubmit={changePassword} className="card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <KeyRound size={15} className="text-ink-muted" />
          <h3 className="font-display text-sm font-bold">Change password</h3>
        </div>
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
          />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
          />
        </div>
        <button type="submit" disabled={changingPassword} className="btn-primary">
          {changingPassword ? 'Changing…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}

export default function Settings() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ data: Company[] }>('/companies');
      setCompanies(res.data);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not load company profiles.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Company profiles and data backup." />
      <div className="space-y-6 px-5 py-6 sm:px-8">
        <div>
          <h2 className="mb-3 font-display text-sm font-bold text-ink-muted">Your account</h2>
          <AccountSettings />
        </div>

        <div>
          <h2 className="mb-3 font-display text-sm font-bold text-ink-muted">Company profiles</h2>
          {loading ? (
            <p className="text-sm text-ink-muted">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {companies.map((c) => (
                <CompanyCard key={c.id} company={c} onSaved={load} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-display text-sm font-bold text-ink-muted">Backup</h2>
          <BackupExport />
        </div>
      </div>
    </div>
  );
}
