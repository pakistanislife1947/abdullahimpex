import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { api, ApiClientError } from '../lib/api';
import { triggerBlobDownload } from '../lib/format';
import { PageHeader } from '../components/ui';
import SearchableSelect from '../components/SearchableSelect';

interface Party {
  id: string;
  name: string;
}

function monthRange(monthStr: string) {
  const [year, month] = monthStr.split('-').map(Number);
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export default function Ledger() {
  const [partyType, setPartyType] = useState<'customer' | 'supplier'>('customer');
  const [customers, setCustomers] = useState<Party[]>([]);
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [partyId, setPartyId] = useState('');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get<{ data: Party[] }>('/customers').then((r) => setCustomers(r.data));
    api.get<{ data: Party[] }>('/suppliers').then((r) => setSuppliers(r.data));
  }, []);

  useEffect(() => {
    setPartyId('');
  }, [partyType]);

  const options = (partyType === 'customer' ? customers : suppliers).map((p) => ({ id: p.id, label: p.name }));

  async function handleDownload() {
    if (!partyId) {
      toast.error('Choose a customer or supplier first.');
      return;
    }
    setDownloading(true);
    try {
      const { from, to } = monthRange(month);
      const params = new URLSearchParams({ party_type: partyType, party_id: partyId, from, to });
      const blob = await api.download(`/ledger/pdf?${params.toString()}`);
      triggerBlobDownload(blob, `ledger-${month}.pdf`);
      toast.success('Ledger downloaded.');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not generate the ledger.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Monthly Ledger"
        subtitle="A printable running statement of a customer's or supplier's activity for a chosen month."
      />
      <div className="px-5 py-6 sm:px-8">
        <div className="card max-w-xl p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Party type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPartyType('customer')}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    partyType === 'customer' ? 'border-ink bg-ink text-white' : 'border-line text-ink-muted'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setPartyType('supplier')}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    partyType === 'supplier' ? 'border-ink bg-ink text-white' : 'border-line text-ink-muted'
                  }`}
                >
                  Supplier
                </button>
              </div>
            </div>
            <div>
              <label className="label">Month</label>
              <input type="month" className="input" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
          </div>

          <div className="mt-4">
            <label className="label">{partyType === 'customer' ? 'Customer' : 'Supplier'}</label>
            <SearchableSelect
              value={partyId}
              onChange={setPartyId}
              options={options}
              placeholder={`Search ${partyType}…`}
            />
          </div>

          <button className="btn-primary mt-5" disabled={downloading} onClick={handleDownload}>
            <Download size={16} /> {downloading ? 'Preparing…' : 'Download ledger PDF'}
          </button>

          <p className="mt-3 text-xs text-ink-faint">
            Shows an opening balance carried from before the selected month, every sale/purchase within the month,
            and a running balance — ready to print.
          </p>
        </div>
      </div>
    </div>
  );
}
