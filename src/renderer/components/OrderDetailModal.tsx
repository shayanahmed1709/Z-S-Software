import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ORDER_STATUSES,
  type Client,
  type Order,
  type OrderStatus,
  type OrderStatusEvent,
  type User,
} from '../../shared/types';
import { formatDate, formatDateTime, formatPkr } from '../lib/format';
import { StatusBadge } from './StatusBadge';

export function OrderDetailModal({
  order,
  clients,
  users,
  canUpdate,
  onClose,
  onUpdated,
}: {
  order: Order;
  clients: Client[];
  users: User[];
  canUpdate: boolean;
  onClose: () => void;
  onUpdated: (order: Order) => void;
}) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<OrderStatus | ''>(order.status ?? '');
  const [history, setHistory] = useState<OrderStatusEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    window.zs.orders
      .history(order.id)
      .then((events) => {
        if (active) setHistory(events);
      })
      .catch(() => {
        if (active) setHistory([]);
      });
    return () => {
      active = false;
    };
  }, [order.id, order.status]);

  const client = clients.find((item) => item.id === order.client_id);
  const assignee = users.find((item) => item.id === order.assigned_to);

  async function saveStatus() {
    if (!status || status === order.status) return;
    setSaving(true);
    setError('');
    try {
      const updated = await window.zs.orders.update({ id: order.id, status });
      onUpdated(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update status');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1628]/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Order</p>
            <h2 className="text-2xl font-bold text-[#0A1628]">{order.order_no}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-[#0A1628]">
            Close
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <Field label="Client" value={client?.company_name ?? '—'} />
          <Field label="Category" value={order.category ?? '—'} />
          <Field label="Description" value={order.description ?? '—'} />
          <Field label="Qty" value={order.qty == null ? '—' : `${order.qty} ${order.unit ?? ''}`.trim()} />
          <Field label="Unit rate" value={formatPkr(order.unit_rate)} />
          <Field label="Total" value={formatPkr(order.total_amount)} />
          <Field label="Advance paid" value={formatPkr(order.advance_paid)} />
          <Field label="Balance due" value={formatPkr(order.balance_due)} />
          <Field label="Due date" value={formatDate(order.due_date)} />
          <Field label="Assigned to" value={assignee?.name ?? '—'} />
          <Field label="Notes" value={order.notes ?? '—'} />
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1"><StatusBadge status={order.status} /></dd>
          </div>
        </dl>

        {canUpdate ? (
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-[#0A1628]">Update status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as OrderStatus)}
                className="rounded-lg border border-slate-200 px-3 py-2"
              >
                {ORDER_STATUSES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void saveStatus()}
              disabled={saving || status === order.status}
              className="rounded-lg bg-[#0A1628] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save status'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/invoices/new', { state: { orderId: order.id, clientId: order.client_id } })}
              className="rounded-lg border border-[#2563EB] px-4 py-2 text-sm font-semibold text-[#2563EB]"
            >
              Generate invoice
            </button>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-8">
          <h3 className="font-semibold text-[#0A1628]">Status history</h3>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No status changes recorded.</p>
          ) : (
            <ol className="mt-3 space-y-3 border-l-2 border-blue-100 pl-4">
              {history.map((event) => (
                <li key={event.id}>
                  <StatusBadge status={event.status} />
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(event.changed_at)}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-[#0A1628]">{value}</dd>
    </div>
  );
}
