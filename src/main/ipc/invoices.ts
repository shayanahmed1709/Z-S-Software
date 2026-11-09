import {
  INVOICE_STATUSES,
  ipcChannels,
  type Invoice,
  type InvoiceInput,
  type InvoiceStatus,
  type UpdateInvoiceInput,
} from '../../shared/types';
import {
  assertEnum,
  deleteById,
  insertAndReturn,
  readAll,
  readOne,
  registerHandler,
  requiredId,
  requiredJsonArray,
  requiredText,
  updateAndReturn,
} from './util';

const INVOICE_COLUMNS = [
  'invoice_no',
  'order_id',
  'client_id',
  'issued_date',
  'due_date',
  'line_items',
  'subtotal',
  'tax_rate',
  'tax_amount',
  'other_charges',
  'grand_total',
  'amount_paid',
  'balance_due',
  'payment_terms',
  'status',
  'created_by',
] as const;

function invoiceValues(input: InvoiceInput | UpdateInvoiceInput): Record<string, unknown> {
  const values: Record<string, unknown> = { ...(input ?? {}) };
  delete values.id;
  if ('invoice_no' in input && input.invoice_no !== undefined) {
    values.invoice_no = requiredText(input.invoice_no, 'Invoice number');
  }
  if (input.line_items !== undefined) {
    values.line_items = requiredJsonArray(input.line_items);
  }
  if (input.status != null) {
    values.status = assertEnum<InvoiceStatus>(input.status, INVOICE_STATUSES, 'Status');
  }
  return values;
}

export function listInvoices(): Invoice[] {
  return readAll<Invoice>('SELECT * FROM invoices ORDER BY id DESC');
}

export function getInvoice(id: number): Invoice | null {
  return readOne<Invoice>('SELECT * FROM invoices WHERE id = ?', requiredId(id));
}

export function createInvoice(input: InvoiceInput): Invoice {
  const values = invoiceValues({
    ...input,
    invoice_no: requiredText(input?.invoice_no, 'Invoice number'),
    line_items: requiredJsonArray(input?.line_items),
  });
  return insertAndReturn<Invoice>('invoices', INVOICE_COLUMNS, values, '*');
}

export function updateInvoice(input: UpdateInvoiceInput): Invoice {
  return updateAndReturn<Invoice>(
    'invoices',
    INVOICE_COLUMNS,
    requiredId(input?.id),
    invoiceValues(input),
    '*',
  );
}

export function deleteInvoice(id: number): void {
  deleteById('invoices', requiredId(id), 'Invoice');
}

export function registerInvoiceHandlers(): void {
  registerHandler(ipcChannels.invoices.list, listInvoices);
  registerHandler(ipcChannels.invoices.get, getInvoice);
  registerHandler(ipcChannels.invoices.create, createInvoice);
  registerHandler(ipcChannels.invoices.update, updateInvoice);
  registerHandler(ipcChannels.invoices.delete, deleteInvoice);
}
