const eurFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

export const eur = (n: number | null | undefined) => (n == null ? '—' : eurFmt.format(n));
export const num = (n: number | null | undefined, d = 2) =>
  n == null ? '—' : Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: d });

export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
