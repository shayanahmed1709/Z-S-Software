import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { app } from 'electron';
import { SMTP_SETTING_KEYS } from '../shared/types';

const DEFAULT_ADMIN_EMAIL = 'admin@zsenterprises.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123';

let db: Database.Database | null = null;

export function getDatabasePath(): string {
  return path.join(app.getPath('userData'), 'zs_data.db');
}

export function initDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const database = new Database(dbPath);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.pragma('busy_timeout = 5000');

  try {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'salesperson')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      location TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Packaging', 'Printing')),
      sub_category TEXT,
      unit TEXT NOT NULL,
      qty_in_stock REAL DEFAULT 0,
      reorder_level REAL DEFAULT 0,
      supplier TEXT,
      notes TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      client_id INTEGER REFERENCES clients(id),
      description TEXT,
      category TEXT CHECK(category IN ('Packaging', 'Printing')),
      qty INTEGER,
      unit_rate REAL,
      total_amount REAL,
      advance_paid REAL DEFAULT 0,
      balance_due REAL GENERATED ALWAYS AS (total_amount - advance_paid) VIRTUAL,
      status TEXT DEFAULT 'Received' CHECK(status IN ('Received','In Printing','Printed','In Packaging','Dispatched','Delivered')),
      due_date TEXT,
      assigned_to INTEGER REFERENCES users(id),
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_no TEXT UNIQUE NOT NULL,
      client_id INTEGER REFERENCES clients(id),
      issued_date TEXT,
      valid_until TEXT,
      validity_days INTEGER DEFAULT 5,
      line_items TEXT NOT NULL,
      subtotal REAL,
      tax_rate REAL DEFAULT 18,
      tax_amount REAL,
      other_charges REAL DEFAULT 0,
      grand_total REAL,
      terms TEXT,
      status TEXT DEFAULT 'Draft' CHECK(status IN ('Draft','Sent','Accepted','Rejected')),
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      order_id INTEGER REFERENCES orders(id),
      client_id INTEGER REFERENCES clients(id),
      issued_date TEXT,
      due_date TEXT,
      line_items TEXT NOT NULL,
      subtotal REAL,
      tax_rate REAL DEFAULT 18,
      tax_amount REAL,
      other_charges REAL DEFAULT 0,
      grand_total REAL,
      amount_paid REAL DEFAULT 0,
      balance_due REAL,
      payment_terms TEXT,
      status TEXT DEFAULT 'Unpaid' CHECK(status IN ('Unpaid','Partially Paid','Paid')),
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_type TEXT,
      document_id INTEGER,
      recipient_email TEXT,
      subject TEXT,
      status TEXT,
      sent_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

    ensureColumn(database, 'clients', 'notes', 'TEXT');
    ensureColumn(database, 'orders', 'unit', 'TEXT');
    database.exec(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        status TEXT NOT NULL,
        changed_at TEXT DEFAULT (datetime('now'))
      );
    `);
    database.exec(`
      INSERT INTO order_status_history (order_id, status, changed_at)
      SELECT id, COALESCE(status, 'Received'), created_at
      FROM orders
      WHERE id NOT IN (SELECT order_id FROM order_status_history);
    `);
    seedDefaultAdmin(database);
    seedSmtpSettings(database);
  } catch (error) {
    database.close();
    throw error;
  }

  db = database;
  return database;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database has not been initialized');
  }
  return db;
}

export function closeDatabase(): void {
  if (!db) {
    return;
  }
  db.close();
  db = null;
}

function ensureColumn(
  database: Database.Database,
  table: string,
  column: string,
  definition: string,
): void {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((item) => item.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function seedDefaultAdmin(database: Database.Database): void {
  const existing = database
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(DEFAULT_ADMIN_EMAIL);

  if (existing) {
    return;
  }

  const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
  database
    .prepare(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')`,
    )
    .run('Administrator', DEFAULT_ADMIN_EMAIL, passwordHash);
}

function seedSmtpSettings(database: Database.Database): void {
  const insert = database.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
  );
  const insertAll = database.transaction(() => {
    for (const key of SMTP_SETTING_KEYS) {
      insert.run(key, '');
    }
  });
  insertAll();
}
