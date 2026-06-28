import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { api, ApiClientError } from '../lib/api';
import { money, formatDate } from '../lib/format';
import { PageHeader, Badge, EmptyState } from '../components/ui';

interface StockItem {
  id: string;
  code: string;
  name: string;
  size: string | null;
  unit: string;
  quantity: number;
  purchase_rate: number;
  sale_rate: number | null;
  description: string | null;
  specification: string | null;
  low_stock_threshold: number | null;
  created_at: string;
}

interface Movement {
  type: 'in' | 'out';
  date: string;
  recorded_at: string;
  party: string | null;
  quantity: number;
  rate: number;
  amount: number;
}

export default function StockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<StockItem | null>(null);
  const [movements, setMovements] = useState<Movement[] | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ data: StockItem }>(`/stock/${id}`)
      .then((res) => setItem(res.data))
      .catch((err) => toast.error(err instanceof ApiClientError ? err.message : 'Could not load this item.'));
    api
      .get<{ data: Movement[] }>(`/stock/${id}/history`)
      .then((res) => setMovements(res.data))
      .catch((err) => toast.error(err instanceof ApiClientError ? err.message : 'Could not load history.'));
  }, [id]);

  if (!item) {
    return <div className="px-5 py-10 text-center text-sm text-ink-muted sm:px-8">Loading…</div>;
  }

  const low = item.quantity <= (item.low_stock_threshold ?? 5);

  return (
    <div>
      <PageHeader
        title={item.name}
        subtitle={`Code ${item.code}${item.size ? ` · Size ${item.size}` : ''}`}
        action={
          <button className="btn-secondary" onClick={() => navigate('/stock')}>
            <ArrowLeft size={15} /> Back to stock
          </button>
        }
      />
      <div className="px-5 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Current quantity</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">
              {item.quantity} {item.unit}
            </p>
            {low && (
              <span className="mt-2 inline-block">
                <Badge tone="danger">Low stock</Badge>
              </span>
            )}
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Purchase rate</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">Rs. {money(item.purchase_rate)}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Sale rate</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">
              {item.sale_rate != null ? `Rs. ${money(item.sale_rate)}` : '—'}
            </p>
          </div>
        </div>

        {(item.specification || item.description) && (
          <div className="card mt-4 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            {item.specification && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Specification</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">{item.specification}</p>
              </div>
            )}
            {item.description && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Description</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">{item.description}</p>
              </div>
            )}
          </div>
        )}

        <div className="card mt-4">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-sm font-bold">Stock history</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              First added on {formatDate(item.created_at)}. Every purchase-in and sale-out for this item, most recent first.
            </p>
          </div>
          {movements === null ? (
            <p className="px-5 py-10 text-center text-sm text-ink-muted">Loading…</p>
          ) : movements.length === 0 ? (
            <EmptyState title="No movements yet" hint="Purchases and sales for this item will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-shell">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Party</th>
                    <th className="text-right">Quantity</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, idx) => (
                    <tr key={idx}>
                      <td>{formatDate(m.date)}</td>
                      <td>
                        {m.type === 'in' ? (
                          <span className="flex items-center gap-1.5 text-success">
                            <ArrowDownToLine size={13} /> Purchase in
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-danger">
                            <ArrowUpFromLine size={13} /> Sale out
                          </span>
                        )}
                      </td>
                      <td>{m.party ?? '—'}</td>
                      <td className="data-num text-right">
                        {m.type === 'in' ? '+' : '-'}
                        {m.quantity}
                      </td>
                      <td className="data-num text-right">{money(m.rate)}</td>
                      <td className="data-num text-right">{money(m.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
