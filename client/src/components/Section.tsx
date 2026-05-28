import { ReactNode } from 'react';

type Props = {
  title: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function Section({ title, hint, right, children }: Props) {
  return (
    <section className="card">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold tracking-tight">{title}</h3>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </header>
      {children}
    </section>
  );
}
