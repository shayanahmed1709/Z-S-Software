import type { InvoiceStatus, OrderStatus, QuotationStatus } from '../../shared/types';

const ORDER_STYLES: Record<OrderStatus, string> = {
  Received: 'bg-slate-100 text-slate-700',
  'In Printing': 'bg-blue-100 text-blue-700',
  Printed: 'bg-cyan-100 text-cyan-800',
  'In Packaging': 'bg-orange-100 text-orange-700',
  Dispatched: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
};

const QUOTATION_STYLES: Record<QuotationStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  Sent: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

const INVOICE_STYLES: Record<InvoiceStatus, string> = {
  Unpaid: 'bg-slate-100 text-slate-700',
  'Partially Paid': 'bg-orange-100 text-orange-700',
  Paid: 'bg-green-100 text-green-700',
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const style =
    (status && ORDER_STYLES[status as OrderStatus]) ||
    (status && QUOTATION_STYLES[status as QuotationStatus]) ||
    (status && INVOICE_STYLES[status as InvoiceStatus]) ||
    'bg-slate-100 text-slate-600';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status || '—'}
    </span>
  );
}
