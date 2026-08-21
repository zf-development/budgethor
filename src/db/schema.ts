import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey().notNull().default(1),
  onboardingCompleted: integer("onboarding_completed", { mode: "boolean" })
    .notNull()
    .default(false),
  theme: text("theme", { enum: ["light", "dark", "system"] })
    .notNull()
    .default("light"),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["asset", "liability"] }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const debts = sqliteTable("debts", {
  id: text("id").primaryKey(),
  creditor: text("creditor").notNull(),
  accountId: text("account_id").references(() => accounts.id, { onDelete: "set null" }),
  balanceCents: integer("balance_cents").notNull().default(0),
  principalCents: integer("principal_cents").notNull().default(0),
  monthlyPaymentCents: integer("monthly_payment_cents").notNull().default(0),
  dayOfMonth: integer("day_of_month").notNull().default(1),
  payingSince: text("paying_since").notNull().default(""),
  annualRateBps: integer("annual_rate_bps").notNull().default(0),
});

export const debtPayoffPlans = sqliteTable("debt_payoff_plans", {
  id: integer("id").primaryKey().notNull().default(1),
  strategy: text("strategy", { enum: ["avalanche", "snowball"] })
    .notNull()
    .default("snowball"),
  extraMonthlyCents: integer("extra_monthly_cents").notNull().default(0),
});

export const debtPayoffDrops = sqliteTable("debt_payoff_drops", {
  id: text("id").primaryKey(),
  debtId: text("debt_id")
    .notNull()
    .unique()
    .references(() => debts.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull().default(0),
  redirectDebtId: text("redirect_debt_id").references(() => debts.id, { onDelete: "set null" }),
});

export const incomeTemplates = sqliteTable("income_templates", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  cadence: text("cadence", { enum: ["week", "biweek", "month"] })
    .notNull()
    .default("month"),
  nextPayDate: text("next_pay_date").notNull().default(""),
  dayOfMonth: integer("day_of_month").notNull(),
  expectedAmountCents: integer("expected_amount_cents").notNull(),
  notes: text("notes").notNull().default(""),
});

export const paymentTemplates = sqliteTable("payment_templates", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  dayOfMonth: integer("day_of_month").notNull(),
  expectedAmountCents: integer("expected_amount_cents").notNull(),
  notes: text("notes").notNull().default(""),
  debtId: text("debt_id").references(() => debts.id, { onDelete: "set null" }),
  fromDebt: integer("from_debt", { mode: "boolean" }).notNull().default(false),
});

export const months = sqliteTable(
  "months",
  {
    id: text("id").primaryKey(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
  },
  (table) => [unique().on(table.year, table.month)],
);

export const accountSnapshots = sqliteTable(
  "account_snapshots",
  {
    id: text("id").primaryKey(),
    monthId: text("month_id")
      .notNull()
      .references(() => months.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    openingBalanceCents: integer("opening_balance_cents").notNull().default(0),
  },
  (table) => [unique().on(table.monthId, table.accountId)],
);

export const incomeEntries = sqliteTable("income_entries", {
  id: text("id").primaryKey(),
  monthId: text("month_id")
    .notNull()
    .references(() => months.id, { onDelete: "cascade" }),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  templateId: text("template_id").references(() => incomeTemplates.id, {
    onDelete: "set null",
  }),
  label: text("label").notNull(),
  dayOfMonth: integer("day_of_month").notNull(),
  expectedAmountCents: integer("expected_amount_cents").notNull(),
  actualAmountCents: integer("actual_amount_cents"),
  received: integer("received", { mode: "boolean" }).notNull().default(false),
  notes: text("notes").notNull().default(""),
});

export const paymentEntries = sqliteTable("payment_entries", {
  id: text("id").primaryKey(),
  monthId: text("month_id")
    .notNull()
    .references(() => months.id, { onDelete: "cascade" }),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  templateId: text("template_id").references(() => paymentTemplates.id, {
    onDelete: "set null",
  }),
  debtId: text("debt_id").references(() => debts.id, { onDelete: "set null" }),
  label: text("label").notNull(),
  dayOfMonth: integer("day_of_month").notNull(),
  expectedAmountCents: integer("expected_amount_cents").notNull(),
  actualAmountCents: integer("actual_amount_cents"),
  paid: integer("paid", { mode: "boolean" }).notNull().default(false),
  notes: text("notes").notNull().default(""),
  appliedToDebtAmountCents: integer("applied_to_debt_amount_cents")
    .notNull()
    .default(0),
});

export type Account = typeof accounts.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type DebtPayoffPlan = typeof debtPayoffPlans.$inferSelect;
export type DebtPayoffDrop = typeof debtPayoffDrops.$inferSelect;
export type IncomeTemplate = typeof incomeTemplates.$inferSelect;
export type PaymentTemplate = typeof paymentTemplates.$inferSelect;
export type Month = typeof months.$inferSelect;
export type AccountSnapshot = typeof accountSnapshots.$inferSelect;
export type IncomeEntry = typeof incomeEntries.$inferSelect;
export type PaymentEntry = typeof paymentEntries.$inferSelect;
export type Settings = typeof settings.$inferSelect;
