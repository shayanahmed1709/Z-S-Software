import {
  ipcChannels,
  type EmailLog,
  type EmailLogInput,
  type UpdateEmailLogInput,
} from '../../shared/types';
import { getDatabase } from '../database';
import {
  deleteById,
  insertAndReturn,
  readAll,
  readOne,
  registerHandler,
  requiredId,
  updateAndReturn,
} from './util';

const EMAIL_COLUMNS = [
  'document_type',
  'document_id',
  'recipient_email',
  'subject',
  'status',
] as const;

export function listEmailLogs(): EmailLog[] {
  return readAll<EmailLog>('SELECT * FROM email_log ORDER BY id DESC');
}

export function getEmailLog(id: number): EmailLog | null {
  return readOne<EmailLog>('SELECT * FROM email_log WHERE id = ?', requiredId(id));
}

export function createEmailLog(input: EmailLogInput): EmailLog {
  const values: Record<string, unknown> = { ...(input ?? {}) };
  const hasValue = EMAIL_COLUMNS.some((column) => values[column] !== undefined);
  if (!hasValue) {
    return getDatabase()
      .prepare('INSERT INTO email_log DEFAULT VALUES RETURNING *')
      .get() as EmailLog;
  }
  return insertAndReturn<EmailLog>('email_log', EMAIL_COLUMNS, values, '*');
}

export function updateEmailLog(input: UpdateEmailLogInput): EmailLog {
  const patch: Record<string, unknown> = { ...input };
  delete patch.id;
  return updateAndReturn<EmailLog>(
    'email_log',
    EMAIL_COLUMNS,
    requiredId(input?.id),
    patch,
    '*',
  );
}

export function deleteEmailLog(id: number): void {
  deleteById('email_log', requiredId(id), 'Email log');
}

export function registerEmailHandlers(): void {
  registerHandler(ipcChannels.email.list, listEmailLogs);
  registerHandler(ipcChannels.email.get, getEmailLog);
  registerHandler(ipcChannels.email.create, createEmailLog);
  registerHandler(ipcChannels.email.update, updateEmailLog);
  registerHandler(ipcChannels.email.delete, deleteEmailLog);
}
