import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from './lib/api';
import { MONTHS_FR } from './lib/format';
import type { Settings, Summary } from './lib/types';
import { MonthNav } from './components/MonthNav';
import { Dashboard } from './components/Dashboard';
import { RevenuesSection } from './sections/RevenuesSection';
import { RecurringSection } from './sections/RecurringSection';
import { ExpensesSection } from './sections/ExpensesSection';
import { SubscriptionsSection } from './sections/SubscriptionsSection';
import { InvestmentSection } from './sections/InvestmentSection';
import { UntilProdSection } from './sections/UntilProdSection';
import { SettingsDrawer } from './components/SettingsDrawer';

const STORAGE_KEY = 'finances:cursor';

function loadCursor(): { year: number; month: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export default function App() {
  const [{ year, month }, setCursor] = useState(loadCursor);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ year, month }));
  }, [year, month]);

  useEffect(() => {
    api.get<Settings>('/settings').then(setSettings);
  }, []);

  const reloadSummary = useCallback(() => {
    api.get<Summary>(`/summary?year=${year}&month=${month}`).then(setSummary);
  }, [year, month]);

  useEffect(() => {
    reloadSummary();
  }, [reloadSummary, tick]);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  const monthLabel = useMemo(() => `${MONTHS_FR[month - 1]} ${year}`, [year, month]);

  if (!settings) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">Chargement…</div>
    );
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-paper/85 backdrop-blur border-b border-slate-200/70">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center font-bold">€</div>
            <h1 className="font-semibold tracking-tight">Finances</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <MonthNav
              year={year}
              month={month}
              onChange={(y, m) => setCursor({ year: y, month: m })}
            />
            <button onClick={() => setSettingsOpen(true)} className="btn-ghost">
              Réglages
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-24">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">{monthLabel}</h2>
        </div>

        <Dashboard summary={summary} settings={settings} />

        <RevenuesSection year={year} month={month} onChange={bump} />
        <RecurringSection year={year} month={month} category="pro" title="Crédits & loyer pro" onChange={bump} />
        <RecurringSection year={year} month={month} category="perso" title="Dépenses récurrentes perso" onChange={bump} />
        <ExpensesSection year={year} month={month} onChange={bump} />
        <SubscriptionsSection />
        <InvestmentSection
          year={year}
          month={month}
          settings={settings}
          summary={summary}
          onChange={bump}
        />
        <UntilProdSection year={year} month={month} onChange={bump} />
      </main>

      {settingsOpen && (
        <SettingsDrawer
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onChange={(s) => setSettings(s)}
          afterSave={bump}
        />
      )}
    </div>
  );
}
