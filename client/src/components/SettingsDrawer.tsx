import { useState } from 'react';
import { api } from '../lib/api';
import type { Settings } from '../lib/types';

type Props = {
  settings: Settings;
  onClose: () => void;
  onChange: (s: Settings) => void;
  afterSave: () => void;
};

export function SettingsDrawer({ settings, onClose, onChange, afterSave }: Props) {
  const [local, setLocal] = useState(settings);

  const save = async (next: Settings) => {
    setLocal(next);
    onChange(next);
    await Promise.all([
      api.put('/settings/distribution', next.distribution),
      api.put('/settings/invest_allocation', next.invest_allocation),
    ]);
    afterSave();
  };

  const updDist = (k: keyof Settings['distribution'], v: number) =>
    save({ ...local, distribution: { ...local.distribution, [k]: v } });
  const updAlloc = (k: keyof Settings['invest_allocation'], v: number) =>
    save({ ...local, invest_allocation: { ...local.invest_allocation, [k]: v } });

  return (
    <div className="fixed inset-0 z-20 bg-ink/40 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-paper shadow-xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Réglages</h2>
          <button onClick={onClose} className="btn-ghost">Fermer</button>
        </header>

        <section className="space-y-4">
          <h3 className="label">Répartition des revenus (par €)</h3>
          <p className="text-xs text-slate-500 -mt-2">
            Pro et Perso restent à 50/50 par défaut. Prévision invest & Bonta sont des coussins calculés sur le net.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(['pro', 'perso', 'prevision_invest', 'bonta_matelas'] as const).map((k) => (
              <label key={k} className="block">
                <span className="label">{k.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={local.distribution[k]}
                    onChange={(e) => updDist(k, Number(e.target.value))}
                    className="input"
                  />
                  <span className="text-xs text-slate-400">×</span>
                </div>
                <span className="text-xs text-slate-400">= {(local.distribution[k] * 100).toFixed(1)}%</span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4 mt-8">
          <h3 className="label">Allocation investissement</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['pea', 'or', 'crypto'] as const).map((k) => (
              <label key={k} className="block">
                <span className="label">{k.toUpperCase()}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={local.invest_allocation[k]}
                  onChange={(e) => updAlloc(k, Number(e.target.value))}
                  className="input mt-1"
                />
                <span className="text-xs text-slate-400">{(local.invest_allocation[k] * 100).toFixed(0)}%</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
