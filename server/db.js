import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// DB path resolution priority:
// 1. Explicit DB_PATH env var
// 2. Railway-injected volume mount path (RAILWAY_VOLUME_MOUNT_PATH)
// 3. Local default ./data/finances.db
const DB_PATH =
  process.env.DB_PATH ||
  (process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/finances.db`
    : './data/finances.db');

try {
  mkdirSync(dirname(DB_PATH), { recursive: true });
} catch (err) {
  console.error(`[db] cannot create dir for ${DB_PATH}:`, err.message);
}
console.log(`[db] using ${DB_PATH}`);

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS revenues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER,
    amount_gross REAL NOT NULL DEFAULT 0,
    deduction REAL NOT NULL DEFAULT 0,
    deduction_label TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_revenues_ym ON revenues(year, month);

  CREATE TABLE IF NOT EXISTS recurring_charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    due_day INTEGER,
    notes TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS recurring_status (
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    charge_id INTEGER NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    done_note TEXT,
    PRIMARY KEY (year, month, charge_id),
    FOREIGN KEY (charge_id) REFERENCES recurring_charges(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER,
    label TEXT,
    amount REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_expenses_ym ON expenses(year, month);

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    renewal_date TEXT,
    product TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    notes TEXT,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    support TEXT NOT NULL,
    asset TEXT NOT NULL,
    isin TEXT,
    group_pct REAL NOT NULL DEFAULT 1,
    parent_group TEXT NOT NULL,
    automated INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS investment_status (
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    investment_id INTEGER NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    actual_amount REAL,
    PRIMARY KEY (year, month, investment_id),
    FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS untilprod (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    client TEXT,
    period TEXT,
    notes TEXT,
    amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'a_facturer',
    invoice_date TEXT,
    paid_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_untilprod_ym ON untilprod(year, month);
`);

const DEFAULT_SETTINGS = {
  distribution: { pro: 0.5, perso: 0.5, prevision_invest: 0.25, bonta_matelas: 0.1 },
  invest_allocation: { pea: 0.7, or: 0.2, crypto: 0.1 },
};

function ensureSetting(key, value) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!row) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
  }
}
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) ensureSetting(k, v);

const seedCount = db.prepare('SELECT COUNT(*) AS n FROM recurring_charges').get().n;
if (seedCount === 0) {
  const ins = db.prepare(
    'INSERT INTO recurring_charges (category, label, amount, due_day, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const proCharges = [
    ['pro', 'Crédit conventionnement', 810, 25, 'Prélèvement le 25', 1],
    ['pro', 'SELARL → SCM (Loyer)', 1600, 27, null, 2],
    ['pro', 'SELARL → SCM (Charges)', 300, 27, null, 3],
    ['pro', 'SELARL → SCI David (loyer local 1)', 534, 27, null, 4],
    ['pro', 'SCM → SCI', 3200, 5, 'Permanent le 5 de chaque mois', 5],
  ];
  const persoCharges = [
    ['perso', 'Salle de sport', 35, null, null, 10],
    ['perso', 'YouTube Premium', 15, null, null, 11],
    ['perso', 'Loyer + courses (virement compte commun)', 800, null, null, 12],
    ['perso', 'Voyage des lousticots', 200, null, null, 13],
    ['perso', 'Optiven', 41.8, null, 'Arrêt prévu juin 2026', 14],
  ];
  for (const c of [...proCharges, ...persoCharges]) ins.run(...c);
}

const subSeed = db.prepare('SELECT COUNT(*) AS n FROM subscriptions').get().n;
if (subSeed === 0) {
  const ins = db.prepare(
    'INSERT INTO subscriptions (renewal_date, product, price) VALUES (?, ?, ?)'
  );
  const subs = [
    ['02-10', 'All Trail', 23.99],
    ['02-22', 'Cam Scanner (Pro)', 29.99],
    ['10-02', 'Finary', 149.99],
    ['02-19', 'My Fitness Pal', 49.99],
    ['02-28', 'Bitwarden', 10.35],
    ['02-12', 'Amazon Prime', 69.9],
    ['02-27', 'Trading View', 260.35],
    ['02-23', 'IDO Sport', 29.99],
  ];
  for (const s of subs) ins.run(...s);
}

const invSeed = db.prepare('SELECT COUNT(*) AS n FROM investments').get().n;
if (invSeed === 0) {
  const ins = db.prepare(
    'INSERT INTO investments (support, asset, isin, group_pct, parent_group, automated, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const invs = [
    ['PEA', 'MSCI World', 'IE0002XZSHO1', 0.7, 'pea', 0, 1],
    ['PEA', 'MSCI Emerging markets', 'LU1681045370', 0.1, 'pea', 0, 2],
    ['PEA', 'STOXX Europe 600 Energy', 'LU1834988278', 0.1, 'pea', 0, 3],
    ['PEA', 'Total, Saint Gobain, Air Liquide', null, 0.1, 'pea', 0, 4],
    ['monCOFFRE', "20 francs Coq (Liberté, égalité, fraternité) 1909", null, 1, 'or', 0, 5],
    ['Ledger (achat depuis Finary)', 'BTC', null, 1, 'crypto', 1, 6],
  ];
  for (const i of invs) ins.run(...i);
}

export default db;
