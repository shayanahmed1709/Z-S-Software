import { ipcChannels, type Client, type ClientInput, type UpdateClientInput } from '../../shared/types';
import { getDatabase } from '../database';
import {
  NotFoundError,
  insertAndReturn,
  readAll,
  readOne,
  registerHandler,
  requiredId,
  requiredText,
  updateAndReturn,
} from './util';

const CLIENT_COLUMNS = ['company_name', 'contact_person', 'phone', 'email', 'location', 'notes'] as const;

export function listClients(): Client[] {
  return readAll<Client>('SELECT * FROM clients ORDER BY id DESC');
}

export function getClient(id: number): Client | null {
  return readOne<Client>('SELECT * FROM clients WHERE id = ?', requiredId(id));
}

export function createClient(input: ClientInput): Client {
  return insertAndReturn<Client>(
    'clients',
    CLIENT_COLUMNS,
    {
      ...input,
      company_name: requiredText(input?.company_name, 'Company name'),
    },
    '*',
  );
}

export function updateClient(input: UpdateClientInput): Client {
  const id = requiredId(input?.id);
  const patch: Record<string, unknown> = { ...input };
  delete patch.id;
  if (input.company_name !== undefined) {
    patch.company_name = requiredText(input.company_name, 'Company name');
  }
  return updateAndReturn<Client>('clients', CLIENT_COLUMNS, id, patch, '*');
}

export function deleteClient(id: number): void {
  const clientId = requiredId(id);
  const database = getDatabase();
  const remove = database.transaction(() => {
    database.prepare('UPDATE orders SET client_id = NULL WHERE client_id = ?').run(clientId);
    database.prepare('UPDATE quotations SET client_id = NULL WHERE client_id = ?').run(clientId);
    database.prepare('UPDATE invoices SET client_id = NULL WHERE client_id = ?').run(clientId);
    const result = database.prepare('DELETE FROM clients WHERE id = ?').run(clientId);
    if (result.changes === 0) {
      throw new NotFoundError('Client');
    }
  });
  remove();
}

export function registerClientHandlers(): void {
  registerHandler(ipcChannels.clients.list, listClients);
  registerHandler(ipcChannels.clients.getAll, listClients);
  registerHandler(ipcChannels.clients.get, getClient);
  registerHandler(ipcChannels.clients.create, createClient);
  registerHandler(ipcChannels.clients.update, updateClient);
  registerHandler(ipcChannels.clients.delete, deleteClient);
}
