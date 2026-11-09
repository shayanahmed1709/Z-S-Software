import { ipcMain } from 'electron';
import type { IpcInvokes } from '../../shared/types';
import { getDatabase } from '../database';

export function registerHandler<C extends keyof IpcInvokes>(
  channel: C,
  handler: (...args: IpcInvokes[C]['args']) => IpcInvokes[C]['result'],
): void {
  ipcMain.handle(channel, (_event, ...args) =>
    handler(...(args as IpcInvokes[C]['args'])),
  );
}

export function readOne<T>(sql: string, ...params: unknown[]): T | null {
  const row = getDatabase()
    .prepare(sql)
    .get(...(params as never[])) as T | undefined;
  return row ?? null;
}

export function readAll<T>(sql: string, ...params: unknown[]): T[] {
  return getDatabase()
    .prepare(sql)
    .all(...(params as never[])) as T[];
}

export class NotFoundError extends Error {
  constructor(entity: string) {
    super(`${entity} not found`);
    this.name = 'NotFoundError';
  }
}

export function requiredId(id: unknown, label = 'Id'): number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} is invalid`);
  }
  return id;
}

export function requiredText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

export function assertEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

export function requiredJsonArray(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('line_items must be a JSON array');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('line_items must be valid JSON');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('line_items must be a JSON array');
  }

  return JSON.stringify(parsed);
}

export function insertAndReturn<T>(
  table: string,
  columns: readonly string[],
  input: Record<string, unknown>,
  returning: string,
): T {
  const keys = columns.filter((column) => input[column] !== undefined);
  if (keys.length === 0) {
    throw new Error(`Cannot insert an empty ${table} row`);
  }

  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys
    .map((key) => `@${key}`)
    .join(', ')}) RETURNING ${returning}`;
  const params: Record<string, unknown> = {};
  for (const key of keys) {
    params[key] = input[key];
  }

  return getDatabase().prepare(sql).get(params) as T;
}

export function updateAndReturn<T>(
  table: string,
  columns: readonly string[],
  id: number,
  input: Record<string, unknown>,
  returning: string,
  options?: { touchUpdatedAt?: boolean },
): T {
  const keys = columns.filter((column) => input[column] !== undefined);
  if (keys.length === 0) {
    throw new Error('No fields to update');
  }

  const assignments = keys.map((key) => `${key} = @${key}`);
  if (options?.touchUpdatedAt) {
    assignments.push(`updated_at = datetime('now')`);
  }

  const params: Record<string, unknown> = { id };
  for (const key of keys) {
    params[key] = input[key];
  }

  const sql = `UPDATE ${table} SET ${assignments.join(', ')} WHERE id = @id RETURNING ${returning}`;
  const row = getDatabase().prepare(sql).get(params) as T | undefined;
  if (!row) {
    throw new NotFoundError(table);
  }
  return row;
}

export function deleteById(table: string, id: number, entity: string): void {
  const result = getDatabase().prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  if (result.changes === 0) {
    throw new NotFoundError(entity);
  }
}
