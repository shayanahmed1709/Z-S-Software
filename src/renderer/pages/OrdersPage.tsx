import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ITEM_CATEGORIES,
  ORDER_STATUSES,
  type Client,
  type ItemCategory,
  type Order,
  type OrderStatus,
  type User,
} from '../../shared/types';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { Skeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatPkr } from '../lib/format';

export function OrdersPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [category, setCategory] = useState<ItemCategory | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(orderId ? Number(orderId) : null);
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);

  useEffect(() => {
    setSelectedId(orderId ? Number(orderId) : null);
  }, [orderId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [nextOrders, nextClients, nextUsers] = await Promise.all([
        window.zs.orders.list(),
        window.zs.clients.getAll(),
        window.zs.auth.listUsers(),
      ]);
      setOrders(nextOrders);
      setClients(nextClients);
      setUsers(nextUsers);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const clientName = (clientId: number | null) =>
    clients.find((client) => client.id === clientId)?.company_name ?? '—';
  const userName = (userId: number | null) => users.find((person) => person.id === userId)?.name ?? '—';

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const name = clientName(order.client_id).toLowerCase();
      const matchesSearch = !query || order.order_no.toLowerCase().includes(query) || name.includes(query);
      const matchesStatus = !status || order.status === status;
      const matchesCategory = !category || order.category === category;
      const due = order.due_date?.slice(0, 10) ?? '';
      const matchesFrom = !from || (due && due >= from);
      const matchesTo = !to || (due && due <= to);
      return matchesSearch && matchesStatus && matchesCategory && matchesFrom && matchesTo;
    });
  }, [orders, clients, search, status, category, from, to]);

  const selected = orders.find((order) => order.id === selectedId) ?? null;
  const canEdit = user?.role === 'admin' || user?.role === 'employee';

  function openOrder(id: number) {
    setSelectedId(id);
    navigate(`/orders/${id}`);
  }

  function closeOrder() {
    setSelectedId(null);
    navigate('/orders');
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await window.zs.orders.delete(pendingDelete.id);
      setPendingDelete(null);
      if (selectedId === pendingDelete.id) closeOrder();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete the order');
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0A1628]">Orders</h1>
        {canEdit ? (
          <button
            type="button"
            onClick={() => navigate('/orders/new')}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
          >
            + New Order
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-5">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order no or client" className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
        <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | '')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value as ItemCategory | '')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">All categories</option>
          {ITEM_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" aria-label="Due from" />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" aria-label="Due to" />
        </div>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10" />)}</div>
        ) : (
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                {['Order No', 'Client', 'Description', 'Category', 'Qty', 'Total Amount', 'Advance Paid', 'Balance Due', 'Status', 'Due Date', 'Assigned To', 'Actions'].map((heading) => (
                  <th key={heading} className="px-3 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="px-3 py-10 text-center text-slate-500">No orders match these filters.</td></tr>
              ) : filtered.map((order) => (
                <tr key={order.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => openOrder(order.id)}>
                  <td className="px-3 py-3 font-medium text-[#0A1628]">{order.order_no}</td>
                  <td className="px-3 py-3">{clientName(order.client_id)}</td>
                  <td className="max-w-[180px] truncate px-3 py-3">{order.description ?? '—'}</td>
                  <td className="px-3 py-3">{order.category ?? '—'}</td>
                  <td className="px-3 py-3">{order.qty ?? '—'} {order.unit ?? ''}</td>
                  <td className="px-3 py-3">{formatPkr(order.total_amount)}</td>
                  <td className="px-3 py-3">{formatPkr(order.advance_paid)}</td>
                  <td className="px-3 py-3">{formatPkr(order.balance_due)}</td>
                  <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-3 py-3">{formatDate(order.due_date)}</td>
                  <td className="px-3 py-3">{userName(order.assigned_to)}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
                      <button type="button" className="text-[#2563EB]" onClick={() => openOrder(order.id)}>View</button>
                      {canEdit ? <button type="button" className="text-[#0A1628]" onClick={() => navigate(`/orders/${order.id}/edit`)}>Edit</button> : null}
                      {user?.role === 'admin' ? <button type="button" className="text-red-600" onClick={() => setPendingDelete(order)}>Delete</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected ? (
        <OrderDetailModal
          order={selected}
          clients={clients}
          users={users}
          canUpdate={canEdit}
          onClose={closeOrder}
          onUpdated={(updated) => {
            setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
          }}
        />
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1628]/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#0A1628]">Delete {pendingDelete.order_no}?</h2>
            <p className="mt-2 text-sm text-slate-600">This removes the order and its status history.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="rounded-lg px-4 py-2 text-sm">Cancel</button>
              <button type="button" onClick={() => void confirmDelete()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
