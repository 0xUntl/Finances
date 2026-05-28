import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import db from './db.js';

const app = express();
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3001;
const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = join(__dirname, '..', 'client', 'dist');

const yearMonth = (req) => {
  const y = parseInt(req.query.year, 10);
  const m = parseInt(req.query.month, 10);
  if (!y || !m || m < 1 || m > 12) throw new Error('year & month required (1-12)');
  return { y, m };
};

const handle = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

// ---------- settings ----------
app.get('/api/settings', handle((_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const r of rows) out[r.key] = JSON.parse(r.value);
  res.json(out);
}));

app.put('/api/settings/:key', handle((req, res) => {
  const { key } = req.params;
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, JSON.stringify(req.body));
  res.json({ ok: true });
}));

// ---------- revenues ----------
app.get('/api/revenues', handle((req, res) => {
  const { y, m } = yearMonth(req);
  res.json(db.prepare('SELECT * FROM revenues WHERE year = ? AND month = ? ORDER BY day, id').all(y, m));
}));

app.post('/api/revenues', handle((req, res) => {
  const { year, month, day = null, amount_gross = 0, deduction = 0, deduction_label = null, notes = null } = req.body;
  const r = db.prepare(
    'INSERT INTO revenues (year, month, day, amount_gross, deduction, deduction_label, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(year, month, day, amount_gross, deduction, deduction_label, notes);
  res.json({ id: r.lastInsertRowid });
}));

app.put('/api/revenues/:id', handle((req, res) => {
  const fields = ['day', 'amount_gross', 'deduction', 'deduction_label', 'notes'];
  const sets = [];
  const vals = [];
  for (const f of fields) if (f in req.body) { sets.push(`${f} = ?`); vals.push(req.body[f]); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  db.prepare(`UPDATE revenues SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
}));

app.delete('/api/revenues/:id', handle((req, res) => {
  db.prepare('DELETE FROM revenues WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
}));

// ---------- recurring charges ----------
app.get('/api/recurring', handle((req, res) => {
  const { y, m } = yearMonth(req);
  const charges = db.prepare('SELECT * FROM recurring_charges WHERE active = 1 ORDER BY category, sort_order, id').all();
  const status = db.prepare('SELECT * FROM recurring_status WHERE year = ? AND month = ?').all(y, m);
  const statusMap = Object.fromEntries(status.map((s) => [s.charge_id, s]));
  res.json(charges.map((c) => ({ ...c, done: statusMap[c.id]?.done || 0, done_note: statusMap[c.id]?.done_note || '' })));
}));

app.post('/api/recurring', handle((req, res) => {
  const { category, label, amount = 0, due_day = null, notes = null, sort_order = 0 } = req.body;
  const r = db.prepare(
    'INSERT INTO recurring_charges (category, label, amount, due_day, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(category, label, amount, due_day, notes, sort_order);
  res.json({ id: r.lastInsertRowid });
}));

app.put('/api/recurring/:id', handle((req, res) => {
  const fields = ['category', 'label', 'amount', 'due_day', 'notes', 'active', 'sort_order'];
  const sets = [];
  const vals = [];
  for (const f of fields) if (f in req.body) { sets.push(`${f} = ?`); vals.push(req.body[f]); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  db.prepare(`UPDATE recurring_charges SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
}));

app.delete('/api/recurring/:id', handle((req, res) => {
  db.prepare('DELETE FROM recurring_charges WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
}));

app.put('/api/recurring/:id/status', handle((req, res) => {
  const { year, month, done = 0, done_note = null } = req.body;
  db.prepare(
    `INSERT INTO recurring_status (year, month, charge_id, done, done_note) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(year, month, charge_id) DO UPDATE SET done = excluded.done, done_note = excluded.done_note`
  ).run(year, month, req.params.id, done ? 1 : 0, done_note);
  res.json({ ok: true });
}));

// ---------- expenses ----------
app.get('/api/expenses', handle((req, res) => {
  const { y, m } = yearMonth(req);
  res.json(db.prepare('SELECT * FROM expenses WHERE year = ? AND month = ? ORDER BY day, id').all(y, m));
}));

app.post('/api/expenses', handle((req, res) => {
  const { year, month, day = null, label = null, amount = 0, notes = null } = req.body;
  const r = db.prepare(
    'INSERT INTO expenses (year, month, day, label, amount, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(year, month, day, label, amount, notes);
  res.json({ id: r.lastInsertRowid });
}));

app.put('/api/expenses/:id', handle((req, res) => {
  const fields = ['day', 'label', 'amount', 'notes'];
  const sets = [];
  const vals = [];
  for (const f of fields) if (f in req.body) { sets.push(`${f} = ?`); vals.push(req.body[f]); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  db.prepare(`UPDATE expenses SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
}));

app.delete('/api/expenses/:id', handle((req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
}));

// ---------- subscriptions ----------
app.get('/api/subscriptions', handle((_req, res) => {
  res.json(db.prepare('SELECT * FROM subscriptions WHERE active = 1 ORDER BY renewal_date, id').all());
}));

app.post('/api/subscriptions', handle((req, res) => {
  const { renewal_date = null, product = '', price = 0, notes = null } = req.body;
  const r = db.prepare(
    'INSERT INTO subscriptions (renewal_date, product, price, notes) VALUES (?, ?, ?, ?)'
  ).run(renewal_date, product, price, notes);
  res.json({ id: r.lastInsertRowid });
}));

app.put('/api/subscriptions/:id', handle((req, res) => {
  const fields = ['renewal_date', 'product', 'price', 'notes', 'active'];
  const sets = [];
  const vals = [];
  for (const f of fields) if (f in req.body) { sets.push(`${f} = ?`); vals.push(req.body[f]); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  db.prepare(`UPDATE subscriptions SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
}));

app.delete('/api/subscriptions/:id', handle((req, res) => {
  db.prepare('DELETE FROM subscriptions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
}));

// ---------- investments ----------
app.get('/api/investments', handle((req, res) => {
  const { y, m } = yearMonth(req);
  const invs = db.prepare('SELECT * FROM investments ORDER BY sort_order, id').all();
  const status = db.prepare('SELECT * FROM investment_status WHERE year = ? AND month = ?').all(y, m);
  const statusMap = Object.fromEntries(status.map((s) => [s.investment_id, s]));
  res.json(invs.map((i) => ({ ...i, done: statusMap[i.id]?.done || 0, actual_amount: statusMap[i.id]?.actual_amount ?? null })));
}));

app.post('/api/investments', handle((req, res) => {
  const { support, asset, isin = null, group_pct = 1, parent_group, automated = 0, sort_order = 0 } = req.body;
  const r = db.prepare(
    'INSERT INTO investments (support, asset, isin, group_pct, parent_group, automated, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(support, asset, isin, group_pct, parent_group, automated ? 1 : 0, sort_order);
  res.json({ id: r.lastInsertRowid });
}));

app.put('/api/investments/:id', handle((req, res) => {
  const fields = ['support', 'asset', 'isin', 'group_pct', 'parent_group', 'automated', 'sort_order'];
  const sets = [];
  const vals = [];
  for (const f of fields) if (f in req.body) { sets.push(`${f} = ?`); vals.push(req.body[f]); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  db.prepare(`UPDATE investments SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
}));

app.delete('/api/investments/:id', handle((req, res) => {
  db.prepare('DELETE FROM investments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
}));

app.put('/api/investments/:id/status', handle((req, res) => {
  const { year, month, done = 0, actual_amount = null } = req.body;
  db.prepare(
    `INSERT INTO investment_status (year, month, investment_id, done, actual_amount) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(year, month, investment_id) DO UPDATE SET done = excluded.done, actual_amount = excluded.actual_amount`
  ).run(year, month, req.params.id, done ? 1 : 0, actual_amount);
  res.json({ ok: true });
}));

// ---------- Until Prod ----------
app.get('/api/untilprod', handle((req, res) => {
  const { y, m } = yearMonth(req);
  res.json(db.prepare('SELECT * FROM untilprod WHERE year = ? AND month = ? ORDER BY id').all(y, m));
}));

app.post('/api/untilprod', handle((req, res) => {
  const { year, month, client = null, period = null, notes = null, amount = 0, status = 'a_facturer', invoice_date = null, paid_date = null } = req.body;
  const r = db.prepare(
    'INSERT INTO untilprod (year, month, client, period, notes, amount, status, invoice_date, paid_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(year, month, client, period, notes, amount, status, invoice_date, paid_date);
  res.json({ id: r.lastInsertRowid });
}));

app.put('/api/untilprod/:id', handle((req, res) => {
  const fields = ['client', 'period', 'notes', 'amount', 'status', 'invoice_date', 'paid_date'];
  const sets = [];
  const vals = [];
  for (const f of fields) if (f in req.body) { sets.push(`${f} = ?`); vals.push(req.body[f]); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  db.prepare(`UPDATE untilprod SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
}));

app.delete('/api/untilprod/:id', handle((req, res) => {
  db.prepare('DELETE FROM untilprod WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
}));

// ---------- summary ----------
app.get('/api/summary', handle((req, res) => {
  const { y, m } = yearMonth(req);
  const revs = db.prepare('SELECT * FROM revenues WHERE year = ? AND month = ?').all(y, m);
  const exps = db.prepare('SELECT COALESCE(SUM(amount),0) AS s FROM expenses WHERE year = ? AND month = ?').get(y, m);
  const distRow = db.prepare("SELECT value FROM settings WHERE key = 'distribution'").get();
  const distribution = JSON.parse(distRow.value);

  const gross = revs.reduce((a, r) => a + (r.amount_gross || 0), 0);
  const deductions = revs.reduce((a, r) => a + (r.deduction || 0), 0);
  const base = revs.reduce((a, r) => a + ((r.amount_gross || 0) - (r.deduction || 0)) / 2, 0);

  const pro = base;
  const perso = base;
  const prevision_invest = revs.reduce((a, r) => a + ((r.amount_gross || 0) - (r.deduction || 0)) * (distribution.prevision_invest || 0), 0);
  const bonta = revs.reduce((a, r) => a + ((r.amount_gross || 0) - (r.deduction || 0)) * (distribution.bonta_matelas || 0), 0);

  res.json({
    revenue: { gross, deductions, pro, perso, prevision_invest, bonta_matelas: bonta },
    expenses_ponctuelles: exps.s,
  });
}));

// ---------- static client ----------
if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(CLIENT_DIST, 'index.html'));
  });
}

app.listen(PORT, () => console.log(`[finances] http://localhost:${PORT}`));
