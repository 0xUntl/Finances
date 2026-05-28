import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Subscription } from '../lib/types';
import { eur } from '../lib/format';
import { Section } from '../components/Section';
import { AutoInput } from '../components/AutoInput';

export function SubscriptionsSection() {
  const [rows, setRows] = useState<Subscription[]>([]);

  const load = useCallback(async () => {
    setRows(await api.get<Subscription[]>('/subscriptions'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = rows.reduce((a, r) => a + (r.price || 0), 0);

  const add = async () => {
    await api.post('/subscriptions', { product: 'Nouveau service', price: 0 });
    await load();
  };

  const upd = async (id: number, patch: Partial<Subscription>) => {
    await api.put(`/subscriptions/${id}`, patch);
  };

  const remove = async (id: number) => {
    if (!confirm('Supprimer cet abonnement ?')) return;
    await api.del(`/subscriptions/${id}`);
    await load();
  };

  return (
    <Section
      title="Abonnements annuels"
      hint="Renouvellements sur l'année (toutes catégories)."
      right={
        <button onClick={add} className="text-sm text-ink/70 hover:text-ink">
          + ajouter
        </button>
      }
    >
      {!rows.length && <p className="text-sm text-slate-400">Aucun abonnement.</p>}
      {!!rows.length && (
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 px-2">
            <div className="col-span-2">Renouvellement</div>
            <div className="col-span-6">Produit</div>
            <div className="col-span-3 text-right">Prix</div>
            <div className="col-span-1"></div>
          </div>
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 items-center px-2 py-1 hover:bg-slate-50 rounded-lg">
              <div className="col-span-2">
                <AutoInput
                  value={r.renewal_date}
                  onSave={(v) => upd(r.id, { renewal_date: v || null })}
                  placeholder="MM-DD"
                  className="input-flat text-xs"
                />
              </div>
              <div className="col-span-6">
                <AutoInput value={r.product} onSave={(v) => upd(r.id, { product: v })} />
              </div>
              <div className="col-span-3">
                <AutoInput
                  type="number"
                  step="0.01"
                  value={r.price}
                  onSave={(v) => {
                    upd(r.id, { price: Number(v) || 0 });
                    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, price: Number(v) || 0 } : x)));
                  }}
                  className="input-flat text-right num"
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
            <span className="text-slate-500">Total annuel · {rows.length} abonnement{rows.length > 1 ? 's' : ''}</span>
            <span className="font-semibold num">{eur(total)}</span>
          </div>
        </div>
      )}
    </Section>
  );
}
