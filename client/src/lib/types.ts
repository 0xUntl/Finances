export type Distribution = {
  pro: number;
  perso: number;
  prevision_invest: number;
  bonta_matelas: number;
};

export type InvestAllocation = {
  pea: number;
  or: number;
  crypto: number;
};

export type Settings = {
  distribution: Distribution;
  invest_allocation: InvestAllocation;
};

export type Revenue = {
  id: number;
  year: number;
  month: number;
  day: number | null;
  amount_gross: number;
  deduction: number;
  deduction_label: string | null;
  notes: string | null;
};

export type RecurringCharge = {
  id: number;
  category: 'pro' | 'perso';
  label: string;
  amount: number;
  due_day: number | null;
  notes: string | null;
  active: number;
  sort_order: number;
  done: number;
  done_note: string;
};

export type Expense = {
  id: number;
  year: number;
  month: number;
  day: number | null;
  label: string | null;
  amount: number;
  notes: string | null;
};

export type Subscription = {
  id: number;
  renewal_date: string | null;
  product: string;
  price: number;
  notes: string | null;
  active: number;
};

export type Investment = {
  id: number;
  support: string;
  asset: string;
  isin: string | null;
  group_pct: number;
  parent_group: 'pea' | 'or' | 'crypto';
  automated: number;
  sort_order: number;
  done: number;
  actual_amount: number | null;
};

export type UntilProd = {
  id: number;
  year: number;
  month: number;
  client: string | null;
  period: string | null;
  notes: string | null;
  amount: number;
  status: 'a_facturer' | 'envoyee' | 'payee';
  invoice_date: string | null;
  paid_date: string | null;
};

export type Summary = {
  revenue: {
    gross: number;
    deductions: number;
    pro: number;
    perso: number;
    prevision_invest: number;
    bonta_matelas: number;
  };
  expenses_ponctuelles: number;
};
