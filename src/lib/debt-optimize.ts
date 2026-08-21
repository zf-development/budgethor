export const DEBT_OPTIMIZE_MAX_MONTHS = 600;

export type DebtOptimizeStrategy = "avalanche" | "snowball";

export const DEBT_STRATEGIES: Record<
  DebtOptimizeStrategy,
  { label: string; summary: string }
> = {
  avalanche: {
    label: "Avalanche",
    summary: "Prioriser la dette avec le taux d’intérêt le plus élevé.",
  },
  snowball: {
    label: "Snowball",
    summary: "Rembourse d’abord les plus petites dettes.",
  },
};

export type DebtOptimizeInput = {
  id: string;
  creditor: string;
  balanceCents: number;
  monthlyPaymentCents: number;
  annualRateBps: number;
};

type SimDebt = DebtOptimizeInput;

export type DebtPayoffRun = {
  months: number;
  interestCents: number;
  paidOff: boolean;
};

export type DebtStrategyFocus = {
  id: string;
  creditor: string;
  balanceCents: number;
  currentPaymentCents: number;
  recommendedPaymentCents: number;
  extraCents: number;
};

export type DebtStrategyPlan = {
  strategy: DebtOptimizeStrategy;
  focus: DebtStrategyFocus | null;
  months: number;
  paidOff: boolean;
  interestCents: number;
  monthsSaved: number | null;
  interestSavedCents: number;
};

export type DebtOptimizeResult = {
  recommended: DebtOptimizeStrategy;
  hasRates: boolean;
  extraCents: number;
  baseline: DebtPayoffRun;
  plans: Record<DebtOptimizeStrategy, DebtStrategyPlan>;
};

function monthlyInterestCents(balanceCents: number, annualRateBps: number) {
  if (balanceCents <= 0 || annualRateBps <= 0) return 0;
  return Math.round((balanceCents * annualRateBps) / 12 / 10_000);
}

function cloneActive(debts: DebtOptimizeInput[]): SimDebt[] {
  return debts
    .filter((debt) => debt.balanceCents > 0)
    .map((debt) => ({ ...debt }));
}

function hasBalance(debts: SimDebt[]) {
  return debts.some((debt) => debt.balanceCents > 0);
}

function pickFocus(debts: SimDebt[], strategy: DebtOptimizeStrategy) {
  const active = debts.filter((debt) => debt.balanceCents > 0);
  if (active.length === 0) return null;
  const sorted = [...active].sort((a, b) => {
    if (strategy === "avalanche") {
      return b.annualRateBps - a.annualRateBps || a.balanceCents - b.balanceCents;
    }
    return a.balanceCents - b.balanceCents || b.annualRateBps - a.annualRateBps;
  });
  return sorted[0] ?? null;
}

function applyInterest(debts: SimDebt[]) {
  let interestCents = 0;
  for (const debt of debts) {
    if (debt.balanceCents <= 0) continue;
    const added = monthlyInterestCents(debt.balanceCents, debt.annualRateBps);
    debt.balanceCents += added;
    interestCents += added;
  }
  return interestCents;
}

function payBaseline(debts: SimDebt[]) {
  for (const debt of debts) {
    if (debt.balanceCents <= 0) continue;
    debt.balanceCents -= Math.min(debt.monthlyPaymentCents, debt.balanceCents);
  }
}

function payStrategy(debts: SimDebt[], extraCents: number, strategy: DebtOptimizeStrategy) {
  let pool = extraCents;
  for (const debt of debts) {
    if (debt.balanceCents <= 0) {
      pool += debt.monthlyPaymentCents;
      continue;
    }
    const payment = Math.min(debt.monthlyPaymentCents, debt.balanceCents);
    debt.balanceCents -= payment;
    pool += debt.monthlyPaymentCents - payment;
  }
  if (pool <= 0) return;
  const focus = pickFocus(debts, strategy);
  if (!focus) return;
  focus.balanceCents -= Math.min(pool, focus.balanceCents);
}

function simulate(
  debts: DebtOptimizeInput[],
  extraCents: number,
  mode: DebtOptimizeStrategy | "baseline",
): DebtPayoffRun {
  const rows = cloneActive(debts);
  let months = 0;
  let interestCents = 0;
  while (hasBalance(rows) && months < DEBT_OPTIMIZE_MAX_MONTHS) {
    months += 1;
    interestCents += applyInterest(rows);
    if (mode === "baseline") payBaseline(rows);
    else payStrategy(rows, extraCents, mode);
  }
  return {
    months,
    interestCents,
    paidOff: !hasBalance(rows),
  };
}

function monthsSaved(baseline: DebtPayoffRun, plan: DebtPayoffRun) {
  if (!plan.paidOff || !baseline.paidOff) return null;
  return Math.max(0, baseline.months - plan.months);
}

function toPlan(
  strategy: DebtOptimizeStrategy,
  debts: DebtOptimizeInput[],
  extraCents: number,
  baseline: DebtPayoffRun,
): DebtStrategyPlan {
  const focusDebt = pickFocus(cloneActive(debts), strategy);
  const run = simulate(debts, extraCents, strategy);
  return {
    strategy,
    focus: focusDebt
      ? {
          id: focusDebt.id,
          creditor: focusDebt.creditor.trim() || "Dette",
          balanceCents: focusDebt.balanceCents,
          currentPaymentCents: focusDebt.monthlyPaymentCents,
          recommendedPaymentCents: focusDebt.monthlyPaymentCents + extraCents,
          extraCents,
        }
      : null,
    months: run.months,
    paidOff: run.paidOff,
    interestCents: run.interestCents,
    monthsSaved: monthsSaved(baseline, run),
    interestSavedCents: Math.max(0, baseline.interestCents - run.interestCents),
  };
}

export function recommendedDebtStrategy(debts: DebtOptimizeInput[]): DebtOptimizeStrategy {
  return debts.some((debt) => debt.balanceCents > 0 && debt.annualRateBps > 0)
    ? "avalanche"
    : "snowball";
}

export function optimizeDebts(
  debts: DebtOptimizeInput[],
  extraCents: number,
): DebtOptimizeResult | null {
  const active = cloneActive(debts);
  if (active.length === 0) return null;
  const extra = Math.max(0, Math.round(extraCents));
  const baseline = simulate(active, 0, "baseline");
  return {
    recommended: recommendedDebtStrategy(active),
    hasRates: active.some((debt) => debt.annualRateBps > 0),
    extraCents: extra,
    baseline,
    plans: {
      avalanche: toPlan("avalanche", active, extra, baseline),
      snowball: toPlan("snowball", active, extra, baseline),
    },
  };
}
