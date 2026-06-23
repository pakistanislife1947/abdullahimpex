import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Boxes,
  Wallet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Truck,
  Plus,
  HandCoins,
  ShoppingCart,
  FileText,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, ApiClientError } from '../lib/api';
import { money, formatDate } from '../lib/format';
import { PageHeader, StatCard, EmptyState } from '../components/ui';

interface Summary {
  totalStockItems: number;
  stockValue: number;
  lowStockCount: number;
  salesThisMonth: number;
  purchasesThisMonth: number;
  totalCustomers: number;
  totalSuppliers: number;
  recentInvoices: Array<{
    id: string;
    serial_number: number;
    invoice_date: string;
    grand_total: number;
    customers: { name: string } | null;
    companies: { name: string } | null;
  }>;
}

const INK = '#0A0A0A';
const ACCENT = '#1B8FA8';
const LINE = '#E5E5E5';
const DANGER = '#B3261E';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const QUICK_ACTIONS = [
  { to: '/sales', label: 'New sale', icon: HandCoins },
  { to: '/purchases', label: 'New purchase', icon: ShoppingCart },
  { to: '/invoices/new', label: 'New invoice', icon: FileText },
];

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ data: Summary }>('/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch((err) => {
        const message = err instanceof ApiClientError ? err.message : 'Could not reach the server.';
        setError(message);
        toast.error(message);
      });
  }, []);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <PageHeader
        title={`${greeting()}`}
        subtitle={today}
        action={
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.to} to={a.to} className="btn-secondary">
                <a.icon size={15} /> {a.label}
              </Link>
            ))}
          </div>
        }
      />
      <div className="px-5 py-6 sm:px-8">
        {!summary ? (
          <p className="text-sm text-ink-muted">{error ? `Couldn't load dashboard: ${error}` : 'Loading…'}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Stock items" value={String(summary.totalStockItems)} icon={Boxes} />
              <StatCard
                label="Stock value"
                value={`Rs. ${money(summary.stockValue)}`}
                hint="At purchase rate"
                icon={Wallet}
              />
              <StatCard
                label="Low stock"
                value={String(summary.lowStockCount)}
                tone={summary.lowStockCount > 0 ? 'warning' : 'default'}
                hint="Items at/below threshold"
                icon={AlertTriangle}
              />
              <StatCard label="Sales this month" value={`Rs. ${money(summary.salesThisMonth)}`} icon={TrendingUp} />
              <StatCard label="Purchases this month" value={`Rs. ${money(summary.purchasesThisMonth)}`} icon={TrendingDown} />
              <StatCard label="Customers" value={String(summary.totalCustomers)} icon={Users} />
              <StatCard label="Suppliers" value={String(summary.totalSuppliers)} icon={Truck} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="card p-5 lg:col-span-2">
                <h2 className="font-display text-sm font-bold">Sales vs purchases — this month</h2>
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Sales', value: summary.salesThisMonth },
                        { name: 'Purchases', value: summary.purchasesThisMonth },
                      ]}
                      margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid stroke={LINE} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5C5C5C' }} axisLine={{ stroke: LINE }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#8C8C8C' }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip
                        formatter={(v: number) => [`Rs. ${money(v)}`, '']}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${LINE}` }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        <Cell fill={INK} />
                        <Cell fill={ACCENT} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-5">
                <h2 className="font-display text-sm font-bold">Stock health</h2>
                <div className="mt-2 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Healthy', value: Math.max(summary.totalStockItems - summary.lowStockCount, 0) },
                          { name: 'Low stock', value: summary.lowStockCount },
                        ]}
                        dataKey="value"
                        innerRadius={42}
                        outerRadius={64}
                        paddingAngle={2}
                      >
                        <Cell fill={INK} />
                        <Cell fill={DANGER} />
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${LINE}` }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-center gap-4 text-xs text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: INK }} /> Healthy
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: DANGER }} /> Low stock
                  </span>
                </div>
              </div>
            </div>

            <div className="card mt-6">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-display text-sm font-bold">Recent invoices</h2>
                <Link to="/invoices" className="text-sm font-medium text-accent-dark hover:underline">
                  View all
                </Link>
              </div>
              {summary.recentInvoices.length === 0 ? (
                <EmptyState title="No invoices yet" hint="Invoices you create will show up here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-shell">
                    <thead>
                      <tr>
                        <th>Serial #</th>
                        <th>Date</th>
                        <th>Company</th>
                        <th>Customer</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="data-num">{inv.serial_number}</td>
                          <td>{formatDate(inv.invoice_date)}</td>
                          <td>{inv.companies?.name}</td>
                          <td>{inv.customers?.name ?? 'Walk-in'}</td>
                          <td className="data-num text-right">{money(inv.grand_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
