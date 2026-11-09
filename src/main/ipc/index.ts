import { registerAuthHandlers } from './auth';
import { registerClientHandlers } from './clients';
import { registerEmailHandlers } from './email';
import { registerInvoiceHandlers } from './invoices';
import { registerOrderHandlers } from './orders';
import { registerQuotationHandlers } from './quotations';
import { registerSettingsHandlers } from './settings';
import { registerStockHandlers } from './stock';

export function registerIpcHandlers(): void {
  registerAuthHandlers();
  registerClientHandlers();
  registerStockHandlers();
  registerOrderHandlers();
  registerQuotationHandlers();
  registerInvoiceHandlers();
  registerEmailHandlers();
  registerSettingsHandlers();
}
