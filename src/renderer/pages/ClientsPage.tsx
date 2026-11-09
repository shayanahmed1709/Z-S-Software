import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Client, Invoice, Order, Quotation } from '../../shared/types';
import { Skeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatPkr } from '../lib/format';

type ClientTab = 'Orders' | 'Quotations' | 'Invoices';

interface ClientDraft {
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
}

const emptyDraft: ClientDraft = {
  company_name: '',
  contact_person: '',
  phone: '',
  email: '',
  location: '',
  notes: '',
};

export function ClientsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [tab, setTab] = useState<ClientTab>('Orders');
  const [editor, setEditor] = useState<Client | null | 'new'>(null);
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [nextClients, nextOrders, nextQuotes, nextInvoices] = await Promise.all([
        window.zs.clients.getAll(),
        window.zs.orders.list(),
        window.zs.quotations.list(),
        window.zs.invoices.list(),
      ]);
      setClients(nextClients);
      setOrders(nextOrders);
      setQuotations(nextQuotes);
      setInvoices(nextInvoices);
      setSelected((current) => nextClients.find((client) => client.id === current?.id) ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load clients');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) =>
      [client.company_name, client.contact_person, client.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [clients, search]);

  function orderCount(clientId: number) {
    return orders.filter((order) => order.client_id === clientId).length;
  }

  function outstanding(clientId: number) {
    return invoices
      .filter((invoice) => invoice.client_id === clientId && (invoice.status === 'Unpaid' || invoice.status === 'Partially Paid'))
      .reduce((sum, invoice) => sum + (invoice.balance_due ?? (invoice.grand_total ?? 0) - (invoice.amount_paid ?? 0)), 0);
  }

  function linkedCount(clientId: number) {
    return (
      orders.filter((order) => order.client_id === clientId).length +
      quotations.filter((quote) => quote.client_id === clientId).length +
      invoices.filter((invoice) => invoice.client_id === clientId).length
    );
  }

  async function removeClient() {
    if (!pendingDelete) return;
    try {
      await window.zs.clients.delete(pendingDelete.id);
      setPendingDelete(null);
      if (selected?.id === pendingDelete.id) setSelected(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete the client');
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0A1628]">Clients</h1>
        <button type="button" onClick={() => setEditor('new')} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">
          + Add Client
        </button>
      </div>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, contact, or phone" className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10" />)}</div>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                {['Company Name', 'Contact Person', 'Phone', 'Email', 'Location', 'Total Orders', 'Outstanding Balance', 'Actions'].map((heading) => (
                  <th key={heading} className="px-3 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-10 text-center text-slate-500">No clients found.</td></tr>
              ) : filtered.map((client) => (
                <tr key={client.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => { setSelected(client); setTab('Orders'); }}>
                  <td className="px-3 py-3 font-medium text-[#0A1628]">{client.company_name}</td>
                  <td className="px-3 py-3">{client.contact_person ?? '—'}</td>
                  <td className="px-3 py-3">{client.phone ?? '—'}</td>
                  <td className="px-3 py-3">{client.email ?? '—'}</td>
                  <td className="px-3 py-3">{client.location ?? '—'}</td>
                  <td className="px-3 py-3">{orderCount(client.id)}</td>
                  <td className="px-3 py-3">{formatPkr(outstanding(client.id))}</td>
                  <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                    <div className="flex gap-2">
                      <button type="button" className="text-[#2563EB]" onClick={() => setSelected(client)}>View</button>
                      <button type="button" className="text-[#0A1628]" onClick={() => setEditor(client)}>Edit</button>
                      {user?.role === 'admin' ? <button type="button" className="text-red-600" onClick={() => setPendingDelete(client)}>Delete</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected ? (
        <ClientDetail
          client={selected}
          orders={orders.filter((order) => order.client_id === selected.id)}
          quotations={quotations.filter((quote) => quote.client_id === selected.id)}
          invoices={invoices.filter((invoice) => invoice.client_id === selected.id)}
          tab={tab}
          onTab={setTab}
          onClose={() => setSelected(null)}
          onNewQuotation={() => navigate('/quotations/new', { state: { clientId: selected.id } })}
          onNewInvoice={() => navigate('/invoices/new', { state: { clientId: selected.id } })}
        />
      ) : null}

      {editor ? (
        <ClientModal
          client={editor === 'new' ? null : editor}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            setEditor(null);
            await load();
          }}
        />
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1628]/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#0A1628]">Delete {pendingDelete.company_name}?</h2>
            <p className="mt-2 text-sm text-slate-600">
              {linkedCount(pendingDelete.id) > 0
                ? `This client has ${linkedCount(pendingDelete.id)} linked records. Deleting will not remove linked records but will unlink them. Continue?`
                : 'This client has no linked records.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="rounded-lg px-4 py-2 text-sm">Cancel</button>
              <button type="button" onClick={() => void removeClient()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Continue</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ClientDetail({
  client,
  orders,
  quotations,
  invoices,
  tab,
  onTab,
  onClose,
  onNewQuotation,
  onNewInvoice,
}: {
  client: Client;
  orders: Order[];
  quotations: Quotation[];
  invoices: Invoice[];
  tab: ClientTab;
  onTab: (tab: ClientTab) => void;
  onClose: () => void;
  onNewQuotation: () => void;
  onNewInvoice: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[#0A1628]/30">
      <aside className="h-full w-full max-w-xl overflow-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0A1628]">{client.company_name}</h2>
            <p className="mt-1 text-sm text-slate-500">{client.contact_person ?? 'No contact'} · {client.phone ?? 'No phone'}</p>
            <p className="text-sm text-slate-500">{client.email ?? 'No email'} · {client.location ?? 'No location'}</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-500">Close</button>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onNewQuotation} className="rounded-lg border border-[#2563EB] px-3 py-2 text-sm font-medium text-[#2563EB]">New Quotation for this client</button>
          <button type="button" onClick={onNewInvoice} className="rounded-lg border border-[#2563EB] px-3 py-2 text-sm font-medium text-[#2563EB]">New Invoice for this client</button>
        </div>
        <div className="mt-5 flex gap-2 border-b border-slate-200">
          {(['Orders', 'Quotations', 'Invoices'] as ClientTab[]).map((item) => (
            <button key={item} type="button" onClick={() => onTab(item)} className={`px-3 py-2 text-sm font-medium ${tab === item ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-slate-500'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {tab === 'Orders' ? orders.map((order) => (
            <DocumentRow key={order.id} title={order.order_no} meta={formatDate(order.due_date)} status={order.status} />
          )) : null}
          {tab === 'Quotations' ? quotations.map((quote) => (
            <DocumentRow key={quote.id} title={quote.quotation_no} meta={formatDate(quote.issued_date)} status={quote.status} />
          )) : null}
          {tab === 'Invoices' ? invoices.map((invoice) => (
            <DocumentRow key={invoice.id} title={invoice.invoice_no} meta={formatPkr(invoice.balance_due)} status={invoice.status} />
          )) : null}
          {((tab === 'Orders' && orders.length === 0) || (tab === 'Quotations' && quotations.length === 0) || (tab === 'Invoices' && invoices.length === 0)) ? (
            <p className="py-6 text-sm text-slate-500">Nothing here yet.</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function DocumentRow({ title, meta, status }: { title: string; meta: string; status: string | null }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3">
      <div>
        <p className="font-medium text-[#0A1628]">{title}</p>
        <p className="text-xs text-slate-500">{meta}</p>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

function ClientModal({
  client,
  onClose,
  onSaved,
}: {
  client: Client | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<ClientDraft>(client ? {
    company_name: client.company_name,
    contact_person: client.contact_person ?? '',
    phone: client.phone ?? '',
    email: client.email ?? '',
    location: client.location ?? '',
    notes: client.notes ?? '',
  } : emptyDraft);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function setField(key: keyof ClientDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      company_name: draft.company_name.trim(),
      contact_person: draft.contact_person.trim() || null,
      phone: draft.phone.trim() || null,
      email: draft.email.trim() || null,
      location: draft.location.trim() || null,
      notes: draft.notes.trim() || null,
    };
    try {
      if (client) await window.zs.clients.update({ id: client.id, ...payload });
      else await window.zs.clients.create(payload);
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the client');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1628]/40 p-4">
      <form onSubmit={(event) => void handleSubmit(event)} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#0A1628]">{client ? 'Edit Client' : 'Add Client'}</h2>
        <div className="mt-4 space-y-3">
          <Field label="Company Name *" value={draft.company_name} onChange={(value) => setField('company_name', value)} required />
          <Field label="Contact Person" value={draft.contact_person} onChange={(value) => setField('contact_person', value)} />
          <Field label="Phone" value={draft.phone} onChange={(value) => setField('phone', value)} />
          <Field label="Email" value={draft.email} onChange={(value) => setField('email', value)} type="email" />
          <Field label="Location" value={draft.location} onChange={(value) => setField('location', value)} />
          <label className="block text-sm font-medium text-[#0A1628]">
            Notes
            <textarea value={draft.notes} onChange={(event) => setField('notes', event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#0A1628] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-[#0A1628]">
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
    </label>
  );
}
