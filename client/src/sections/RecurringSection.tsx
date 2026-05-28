import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { RecurringCharge } from '../lib/types';
import { eur } from '../lib/format';
import { Section } from '../components/Section';
import { AutoInput } from '../components/AutoInput';

type Props = { year: number; month: number; category: 'pro' | 'perso'; title: string; onChange: () => void };

export function RecurringSection({ year, month, category, title, onChange }: Props) {
  const [rows, setRows] = useState<RecurringCharge[]>([]);

  const load = useCallback(async () => {
    const all = await api.get<RecurringCharge[]>(`/recurring?year=${year}&month=${month}`);
    setRows(all.filter((r) => r.category === category));
  }, [year, month, category]);

  useEffect(() => {
    load();
  }, [load]);

  const total = rows.reduce((a, r) => a + (r.amount || 0), 0);
  const totalDone = rows.filter((r) => r.done).reduce((a, r) => a + (r.amount || 0), 0);

  const add = async () => {
    await api.post('/recurring', { category, label: 'Nouvelle charge', amount: 0, sort_order: rows.length + 99 });
    await load();
    onChange();
  };

  const upd = async (id: number, patch: Partial<RecurringCharge>) => {
    await api.put(`/recurring/${id}`, patch);
    onChange();
  };

  const toggle = async (r: RecurringCharge) => {
    const next = r.done ? 0 : 1;
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, done: next } : x)));
    await api.put(`/recurring/${r.id}/status`, { year, month, done: next });
    onChange();
  };

  const remove = async (id: number) => {
    if (!confirm('Supprimer cette charge récurrente (de tous les mois) ?')) return;
    await api.del(`/recurring/${id}`);
    await load();
    onChange();
  };

  return (
    <Section
      title={title}
      hint="Cochez quand le paiement est fait pour ce mois."
      right={
        <button onClick={add} className="text-sm text-ink/70 hover:text-ink">
          + ajouter
        </button>
      }
    >
      {!rows.length && <p className="text-sm text-slate-400">Aucune charge.</p>}
      {!!rows.length && (
        <div className="space-y-1">
          {rows.map((r) => (
            <div
              key={r.id}
              className={`grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded-lg transition ${
                r.done ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
              }`}
            >
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={!!r.done}
                  onChange={() => toggle(r)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>
              <div className="col-span-5">
                <AutoInput
                  value={r.label}
                  onSave={(v) => upd(r.id, { label: v })}
                  className={`input-flat text-sm ${r.done ? 'line-through text-slate-400' : ''}`}
                />
              </div>
              <div className="col-span-2">
                <AutoInput
                  type="number"
                  step="0.01"
                  value={r.amount}
                  onSave={(v) => {
                    upd(r.id, { amount: Number(v) || 0 });
                    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, amount: Number(v) || 0 } : x)));
                  }}
                  className="input-flat text-right num"
                />
              </div>
              <div className="col-span-3">
                <AutoInput
                  value={r.notes}
                  onSave={(v) => upd(r.id, { notes: v || null })}
                  placeholder="notes…"
                  className="input-flat text-xs text-slate-500"
                />
              </div>
              <div className="col-span-1 text-right">
                <button onClick={() => remove(r.id)} className="text-xs text-slate-300 hover:text-red-500">
                  ×
                </button>
              </div>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">
              {rows.filter((r) => r.done).length}/{rows.length} fait
            </span>
            <span className="num">
              <span className="text-emerald-600 font-medium">{eur(totalDone)}</span>
              <span className="mx-1 text-slate-300">/</span>
              <span className="font-semibold">{eur(total)}</span>
            </span>
          </div>
        </div>
      )}
    </Section>
  );
}
