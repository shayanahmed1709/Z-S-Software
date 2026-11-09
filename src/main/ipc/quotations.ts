import {
  QUOTATION_STATUSES,
  ipcChannels,
  type Quotation,
  type QuotationInput,
  type QuotationStatus,
  type UpdateQuotationInput,
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

const QUOTATION_COLUMNS = [
  'quotation_no',
  'client_id',
  'issued_date',
  'valid_until',
  'validity_days',
  'line_items',
  'subtotal',
  'tax_rate',
  'tax_amount',
  'other_charges',
  'grand_total',
  'terms',
  'status',
  'created_by',
] as const;

function quotationValues(
  input: QuotationInput | UpdateQuotationInput,
): Record<string, unknown> {
  const values: Record<string, unknown> = { ...(input ?? {}) };
  delete values.id;
  if ('quotation_no' in input && input.quotation_no !== undefined) {
    values.quotation_no = requiredText(input.quotation_no, 'Quotation number');
  }
  if (input.line_items !== undefined) {
    values.line_items = requiredJsonArray(input.line_items);
  }
  if (input.status != null) {
    values.status = assertEnum<QuotationStatus>(input.status, QUOTATION_STATUSES, 'Status');
  }
  return values;
}

export function listQuotations(): Quotation[] {
  return readAll<Quotation>('SELECT * FROM quotations ORDER BY id DESC');
}

export function getQuotation(id: number): Quotation | null {
  return readOne<Quotation>('SELECT * FROM quotations WHERE id = ?', requiredId(id));
}

export function createQuotation(input: QuotationInput): Quotation {
  const values = quotationValues({
    ...input,
    quotation_no: requiredText(input?.quotation_no, 'Quotation number'),
    line_items: requiredJsonArray(input?.line_items),
  });
  return insertAndReturn<Quotation>('quotations', QUOTATION_COLUMNS, values, '*');
}

export function updateQuotation(input: UpdateQuotationInput): Quotation {
  return updateAndReturn<Quotation>(
    'quotations',
    QUOTATION_COLUMNS,
    requiredId(input?.id),
    quotationValues(input),
    '*',
  );
}

export function deleteQuotation(id: number): void {
  deleteById('quotations', requiredId(id), 'Quotation');
}

export function registerQuotationHandlers(): void {
  registerHandler(ipcChannels.quotations.list, listQuotations);
  registerHandler(ipcChannels.quotations.get, getQuotation);
  registerHandler(ipcChannels.quotations.create, createQuotation);
  registerHandler(ipcChannels.quotations.update, updateQuotation);
  registerHandler(ipcChannels.quotations.delete, deleteQuotation);
}
