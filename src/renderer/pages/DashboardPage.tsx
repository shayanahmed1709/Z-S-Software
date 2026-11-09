import { useEffect, useState } from 'react';
import { ClipboardList, Printer, Receipt, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Client, Invoice, Order, OrderStatus, StockItem } from '../../shared/types';
import { Skeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../lib/format';

const PIPELINE: OrderStatus[] = [
  'Received',
  'In Printing',
  'Printed',
  'In Packaging',
  'Dispatched',
  'Delivered',
];

const PIPELINE_COLORS = ['#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1E3A8A'];

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [nextOrders, nextClients, nextInvoices, nextStock] = await Promise.all([
          window.zs.orders.list(),
          window.zs.clients.getAll(),
          window.zs.invoices.list(),
          window.zs.stock.list(),
        ]);
        if (!active) return;
        setOrders(nextOrders);
        setClients(nextClients);
        setInvoices(nextInvoices);
        setStock(nextStock);
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load the dashboard');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const clientName = (clientId: number | null) =>
    clients.find((client) => client.id === clientId)?.company_name ?? '—';

  const activeOrders = orders.filter((order) => order.status !== 'Delivered').length;
  const inPrinting = orders.filter((order) => order.status === 'In Printing').length;
  const pendingInvoices = invoices.filter(
    (invoice) => invoice.status === 'Unpaid' || invoice.status === 'Partially Paid',
  ).length;
  const alerts = stock.filter((item) => item.qty_in_stock <= item.reorder_level);
  const recent = [...orders].sort((a, b) => b.id - a.id).slice(0, 10);

  const stats = [
    { label: 'Total Active Orders', value: activeOrders, icon: ClipboardList, tint: 'bg-blue-100 text-blue-700' },
    { label: 'In Printing', value: inPrinting, icon: Printer, tint: 'bg-cyan-100 text-cyan-700' },
    { label: 'Total Clients', value: clients.length, icon: Users, tint: 'bg-indigo-100 text-indigo-700' },
    { label: 'Pending Invoices', value: pendingInvoices, icon: Receipt, tint: 'bg-orange-100 text-orange-700' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1628]">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">A snapshot of orders, clients, invoices, and stock.</p>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28" />)
          : stats.map((stat) => (
              <article key={stat.label} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.tint}`}>
                  <stat.icon size={22} />
                </span>
                <div>
                  <p className="text-3xl font-bold text-[#0A1628]">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </article>
            ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <article className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-3">
          <h2 className="mb-4 text-lg font-semibold text-[#0A1628]">Recent Orders</h2>
          {loading ? (
            <Skeleton className="h-64" />
          ) : recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="pb-3">Order No</th>
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((order) => (
                    <tr
                      key={order.id}
                      className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="py-3 font-medium text-[#0A1628]">{order.order_no}</td>
                      <td className="py-3">{clientName(order.client_id)}</td>
                      <td className="py-3">{order.category ?? '—'}</td>
                      <td className="py-3"><StatusBadge status={order.status} /></td>
                      <td className="py-3">{formatDate(order.due_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-[#0A1628]">Stock Alerts</h2>
          {loading ? (
            <Skeleton className="h-64" />
          ) : alerts.length === 0 ? (
            <p className="py-10 text-center text-sm font-medium text-green-600">All stock levels are healthy ✓</p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((item) => (
                <li key={item.id} className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-3">
                  <p className="font-medium text-[#0A1628]">{item.item_name}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {item.category} · Qty {item.qty_in_stock} · Reorder {item.reorder_level}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#0A1628]">Order Pipeline</h2>
        {loading ? (
          <Skeleton className="h-28" />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {PIPELINE.map((status, index) => (
              <div
                key={status}
                className="rounded-xl px-4 py-4"
                style={{ background: PIPELINE_COLORS[index], color: index < 2 ? '#0A1628' : '#ffffff' }}
              >
                <p className="text-2xl font-bold">{orders.filter((order) => order.status === status).length}</p>
                <p className="mt-1 text-sm font-medium">{status}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
