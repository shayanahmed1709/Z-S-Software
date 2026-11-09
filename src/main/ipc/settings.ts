import { ipcChannels, type Setting, type SettingInput } from '../../shared/types';
import { readAll, readOne, registerHandler, requiredText } from './util';
import { getDatabase } from '../database';

export function listSettings(): Setting[] {
  return readAll<Setting>('SELECT key, value FROM settings ORDER BY key ASC');
}

export function getSetting(key: string): Setting | null {
  return readOne<Setting>(
    'SELECT key, value FROM settings WHERE key = ?',
    requiredText(key, 'Key'),
  );
}

export function setSetting(input: SettingInput): Setting {
  const key = requiredText(input?.key, 'Key');
  if (typeof input?.value !== 'string') {
    throw new Error('Value is required');
  }

  getDatabase()
    .prepare(
      `INSERT INTO settings (key, value)
       VALUES (@key, @value)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run({ key, value: input.value });

  return { key, value: input.value };
}

export function registerSettingsHandlers(): void {
  registerHandler(ipcChannels.settings.list, listSettings);
  registerHandler(ipcChannels.settings.get, getSetting);
  registerHandler(ipcChannels.settings.set, setSetting);
}
