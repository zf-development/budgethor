import {
  DEBT_OPTIMIZE_MAX_MONTHS,
  optimizeDebts,
  recommendedDebtStrategy,
  type DebtOptimizeInput,
  type DebtOptimizeResult,
  type DebtOptimizeStrategy,
} from "@/lib/debt-optimize";
import { remainingMonthsExact } from "@/lib/money";

export type DebtPlanDropInput = {
  debtId: string;
  amountCents: number;
  redirectDebtId: string | null;
};

export type DebtPlanConfig = {
  strategy: DebtOptimizeStrategy;
  extraMonthlyCents: number;
  drops: DebtPlanDropInput[];
};

type PlanRow = DebtOptimizeInput & {
  paymentCents: number;
  originalPaymentCents: number;
  rolledFrom: string[];
};

export type DebtPlanPhaseRow = {
  id: string;
  creditor: string;
  balanceCents: number;
  paymentCents: number;
  originalPaymentCents: number;
  months: number | null;
  rolledFrom: string[];
  isFocus: boolean;
  dropCents: number;
  redirectDebtId: string | null;
};

export type DebtPlanPhase = {
  key: string;
  title: string;
  subtitle: string | null;
  isStart: boolean;
  paidOffLabel: string | null;
  rows: DebtPlanPhaseRow[];
};

export type DebtPlanView = {
  recommended: DebtOptimizeStrategy;
  phases: DebtPlanPhase[];
  estimate: DebtOptimizeResult | null;
};

function creditorLabel(name: string) {
  return name.trim() || "Dette";
}

function sortForStrategy(rows: PlanRow[], strategy: DebtOptimizeStrategy) {
  return [...rows].sort((a, b) => {
    if (strategy === "avalanche") {
      return b.annualRateBps - a.annualRateBps || a.balanceCents - b.balanceCents;
    }
    return a.balanceCents - b.balanceCents || b.annualRateBps - a.annualRateBps;
  });
}

function dropByDebtId(drops: DebtPlanDropInput[]) {
  return new Map(drops.map((drop) => [drop.debtId, drop]));
}

function redirectTarget(
  paidId: string,
  remaining: PlanRow[],
  drops: DebtPlanDropInput[],
  strategy: DebtOptimizeStrategy,
) {
  const preferredId = dropByDebtId(drops).get(paidId)?.redirectDebtId;
  if (preferredId) {
    const preferred = remaining.find((row) => row.id === preferredId);
    if (preferred) return preferred;
  }
  return sortForStrategy(remaining, strategy)[0] ?? null;
}

function toPhaseRow(
  row: PlanRow,
  focusId: string | undefined,
  drop: DebtPlanDropInput | undefined,
): DebtPlanPhaseRow {
  return {
    id: row.id,
    creditor: creditorLabel(row.creditor),
    balanceCents: row.balanceCents,
    paymentCents: row.paymentCents,
    originalPaymentCents: row.originalPaymentCents,
    months: remainingMonthsExact(row.balanceCents, row.paymentCents),
    rolledFrom: row.rolledFrom,
    isFocus: row.id === focusId,
    dropCents: drop?.amountCents ?? 0,
    redirectDebtId: drop?.redirectDebtId ?? null,
  };
}

function rollPayment(from: PlanRow, to: PlanRow) {
  to.paymentCents += from.paymentCents;
  to.rolledFrom = [...to.rolledFrom, creditorLabel(from.creditor)];
  from.paymentCents = 0;
}

function cloneRows(rows: PlanRow[]) {
  return rows.map((row) => ({ ...row, rolledFrom: [...row.rolledFrom] }));
}

export function buildDebtPlanPhases(
  debts: DebtOptimizeInput[],
  config: DebtPlanConfig,
): DebtPlanPhase[] {
  const drops = dropByDebtId(config.drops);
  const extra = Math.max(0, Math.round(config.extraMonthlyCents));

  const working: PlanRow[] = debts
    .filter((debt) => debt.balanceCents > 0 || debt.monthlyPaymentCents > 0)
    .map((debt) => {
      const dropCents = Math.max(0, Math.round(drops.get(debt.id)?.amountCents ?? 0));
      return {
        ...debt,
        creditor: creditorLabel(debt.creditor),
        balanceCents: Math.max(0, debt.balanceCents - dropCents),
        paymentCents: debt.monthlyPaymentCents,
        originalPaymentCents: debt.monthlyPaymentCents,
        rolledFrom: [],
      };
    });

  const paidByDrop = working.filter((row) => row.balanceCents <= 0 && row.paymentCents > 0);
  const remaining = () => working.filter((row) => row.balanceCents > 0);

  for (const paid of paidByDrop) {
    const target = redirectTarget(paid.id, remaining(), config.drops, config.strategy);
    if (target) rollPayment(paid, target);
  }

  if (extra > 0) {
    const focus = sortForStrategy(remaining(), config.strategy)[0];
    if (focus) {
      focus.paymentCents += extra;
      focus.rolledFrom = [...focus.rolledFrom, "Extra / mois"];
    }
  }

  const phases: DebtPlanPhase[] = [];

  const toRows = (rows: PlanRow[]) => {
    const focusId = sortForStrategy(
      rows.filter((row) => row.balanceCents > 0),
      config.strategy,
    )[0]?.id;
    return rows.map((row) => toPhaseRow(row, focusId, drops.get(row.id)));
  };

  const startRows = working.map((row) =>
    row.balanceCents > 0 ? row : { ...row, paymentCents: 0, rolledFrom: [] },
  );
  const paidDropLabel =
    paidByDrop.length > 0 ? paidByDrop.map((row) => row.creditor).join(", ") : null;

  phases.push({
    key: "current",
    title: "État actuel des dettes",
    subtitle: paidDropLabel ? `Drops appliqués : ${paidDropLabel} soldée(s).` : null,
    isStart: true,
    paidOffLabel: paidDropLabel,
    rows: toRows(cloneRows(startRows)),
  });

  const sim = cloneRows(working);
  const alreadyPaid = new Set(sim.filter((row) => row.balanceCents <= 0).map((row) => row.id));
  let month = 0;

  while (sim.some((row) => row.balanceCents > 0) && month < DEBT_OPTIMIZE_MAX_MONTHS) {
    month += 1;
    for (const row of sim) {
      if (row.balanceCents <= 0) continue;
      row.balanceCents = Math.max(0, row.balanceCents - row.paymentCents);
    }

    const newlyPaid = sortForStrategy(
      sim.filter((row) => row.balanceCents <= 0 && !alreadyPaid.has(row.id)),
      config.strategy,
    );
    if (newlyPaid.length === 0) continue;

    for (const paid of newlyPaid) {
      alreadyPaid.add(paid.id);
      const stillOpen = sim.filter((row) => row.balanceCents > 0);
      if (stillOpen.length === 0) break;
      const target = redirectTarget(paid.id, stillOpen, config.drops, config.strategy);
      if (target) rollPayment(paid, target);
      phases.push({
        key: `after-${paid.id}-${month}`,
        title: `Après ${paid.creditor}`,
        subtitle: target
          ? `Paiement de ${paid.creditor} redirigé vers ${target.creditor}.`
          : null,
        isStart: false,
        paidOffLabel: paid.creditor,
        rows: toRows(cloneRows(stillOpen)),
      });
    }

    if (!sim.some((row) => row.balanceCents > 0 && row.paymentCents > 0)) break;
  }

  return phases;
}

export function evaluateDebtPlan(
  debts: DebtOptimizeInput[],
  config: DebtPlanConfig,
): DebtPlanView {
  const dropMap = dropByDebtId(config.drops);
  const afterDrops = debts.map((debt) => ({
    ...debt,
    balanceCents: Math.max(
      0,
      debt.balanceCents - Math.max(0, Math.round(dropMap.get(debt.id)?.amountCents ?? 0)),
    ),
  }));
  const freedCents = afterDrops
    .filter((debt) => debt.balanceCents <= 0)
    .reduce((sum, debt) => sum + Math.max(0, debt.monthlyPaymentCents), 0);

  return {
    recommended: recommendedDebtStrategy(debts),
    phases: buildDebtPlanPhases(debts, config),
    estimate: optimizeDebts(afterDrops, config.extraMonthlyCents + freedCents),
  };
}
