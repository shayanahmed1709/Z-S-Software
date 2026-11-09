import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ITEM_CATEGORIES,
  ORDER_STATUSES,
  type Client,
  type ItemCategory,
  type Order,
  type OrderStatus,
  type User,
} from '../../shared/types';
import { useAuth } from '../context/AuthContext';
import { formatPkr, nextOrderNo } from '../lib/format';

const fieldClass = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]';

export function OrderForm({ order }: { order?: Order }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orderNo, setOrderNo] = useState(order?.order_no ?? '');
  const [clientId, setClientId] = useState<number | null>(order?.client_id ?? null);
  const [category, setCategory] = useState<ItemCategory | ''>(order?.category ?? '');
  const [description, setDescription] = useState(order?.description ?? '');
  const [qty, setQty] = useState(order?.qty?.toString() ?? '');
  const [unit, setUnit] = useState(order?.unit ?? '');
  const [unitRate, setUnitRate] = useState(order?.unit_rate?.toString() ?? '');
  const [total, setTotal] = useState(order?.total_amount?.toString() ?? '');
  const [totalTouched, setTotalTouched] = useState(Boolean(order));
  const [advance, setAdvance] = useState(order?.advance_paid?.toString() ?? '0');
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? 'Received');
  const [dueDate, setDueDate] = useState(order?.due_date?.slice(0, 10) ?? '');
  const [assignedTo, setAssignedTo] = useState<number | ''>(order?.assigned_to ?? '');
  const [notes, setNotes] = useState(order?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [nextClients, nextUsers, orders] = await Promise.all([
          window.zs.clients.getAll(),
          window.zs.auth.listUsers(),
          window.zs.orders.list(),
        ]);
        if (!active) return;
        setClients(nextClients);
        setUsers(nextUsers.filter((person) => person.role === 'admin' || person.role === 'employee'));
        if (!order) setOrderNo(nextOrderNo(orders.map((item) => item.order_no)));
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load the form');
      }
    })();
    return () => {
      active = false;
    };
  }, [order]);

  const calculatedTotal = useMemo(() => {
    if (qty === '' || unitRate === '') return '';
    const amount = Number(qty) * Number(unitRate);
    if (!Number.isFinite(amount)) return '';
    return String(Math.round(amount * 100) / 100);
  }, [qty, unitRate]);

  const totalValue = totalTouched ? total : calculatedTotal || total;
  const balance = (Number(totalValue) || 0) - (Number(advance) || 0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!category) {
      setError('Category is required');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      order_no: orderNo.trim(),
      client_id: clientId,
      category,
      description: description.trim() || null,
      qty: qty === '' ? null : Number(qty),
      unit: unit.trim() || null,
      unit_rate: unitRate === '' ? null : Number(unitRate),
      total_amount: totalValue === '' ? null : Number(totalValue),
      advance_paid: advance === '' ? 0 : Number(advance),
      status,
      due_date: dueDate || null,
      assigned_to: assignedTo === '' ? null : assignedTo,
      notes: notes.trim() || null,
      created_by: order?.created_by ?? user?.id ?? null,
    };
    try {
      const saved = order
        ? await window.zs.orders.update({ id: order.id, ...payload })
        : await window.zs.orders.create(payload);
      navigate(`/orders/${saved.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the order');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mx-auto max-w-3xl space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0A1628]">{order ? 'Edit Order' : 'New Order'}</h1>
        <button type="button" onClick={() => navigate('/orders')} className="text-sm text-slate-500">
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm font-medium text-[#0A1628]">
          Order No
          <input className={`${fieldClass} mt-1`} value={orderNo} onChange={(event) => setOrderNo(event.target.value)} required />
        </label>
        <label className="text-sm font-medium text-[#0A1628]">
          Client
          <ClientPicker clients={clients} value={clientId} onChange={setClientId} />
        </label>
        <label className="text-sm font-medium text-[#0A1628]">
          Category
          <select className={`${fieldClass} mt-1`} value={category} onChange={(event) => setCategory(event.target.value as ItemCategory)} required>
            <option value="">Select category</option>
            {ITEM_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-[#0A1628]">
          Status
          <select className={`${fieldClass} mt-1`} value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)}>
            {ORDER_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-[#0A1628] md:col-span-2">
          Description
          <textarea className={`${fieldClass} mt-1`} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-[#0A1628]">
          Qty
          <input className={`${fieldClass} mt-1`} type="number" min="0" value={qty} onChange={(event) => { setQty(event.target.value); setTotalTouched(false); }} />
        </label>
        <label className="text-sm font-medium text-[#0A1628]">
          Unit
          <input className={`${fieldClass} mt-1`} value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="pcs, kg, ream" />
        </label>
        <label className="text-sm font-medium text-[#0A1628]">
          Unit Rate (PKR)
          <input className={`${fieldClass} mt-1`} type="number" min="0" step="0.01" value={unitRate} onChange={(event) => { setUnitRate(event.target.value); setTotalTouched(false); }} />
        </label>
        <label className="text-sm font-medium text-[#0A1628]">
          Total Amount (PKR)
          <input className={`${fieldClass} mt-1`} type="number" min="0" step="0.01" value={totalValue} onChange={(event) => { setTotal(event.target.value); setTotalTouched(true); }} />
        </label>
        <label className="text-sm font-medium text-[#0A1628]">
          Advance Paid (PKR)
          <input className={`${fieldClass} mt-1`} type="number" min="0" step="0.01" value={advance} onChange={(event) => setAdvance(event.target.value)} />
        </label>
        <div className="text-sm font-medium text-[#0A1628]">
          Balance Due
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2.5 font-semibold">{formatPkr(balance)}</p>
        </div>
        <label className="text-sm font-medium text-[#0A1628]">
          Due Date
          <input className={`${fieldClass} mt-1`} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-[#0A1628]">
          Assigned To
          <select className={`${fieldClass} mt-1`} value={assignedTo} onChange={(event) => setAssignedTo(event.target.value ? Number(event.target.value) : '')}>
            <option value="">Unassigned</option>
            {users.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-[#0A1628] md:col-span-2">
          Notes
          <textarea className={`${fieldClass} mt-1`} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" disabled={saving} className="rounded-lg bg-[#0A1628] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#16324F] disabled:opacity-60">
        {saving ? 'Saving…' : 'Save order'}
      </button>
    </form>
  );
}

function ClientPicker({
  clients,
  value,
  onChange,
}: {
  clients: Client[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = clients.find((client) => client.id === value);
  const filtered = clients.filter((client) => client.company_name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative mt-1">
      <input
        className={fieldClass}
        value={open ? query : selected?.company_name ?? ''}
        placeholder="Search clients"
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open ? (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          <li>
            <button type="button" className="w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50" onMouseDown={() => onChange(null)}>
              No client
            </button>
          </li>
          {filtered.map((client) => (
            <li key={client.id}>
              <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onMouseDown={() => onChange(client.id)}>
                {client.company_name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
