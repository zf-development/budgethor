import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  theme TEXT NOT NULL DEFAULT 'light'
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  creditor TEXT NOT NULL,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  principal_cents INTEGER NOT NULL DEFAULT 0,
  monthly_payment_cents INTEGER NOT NULL DEFAULT 0,
  day_of_month INTEGER NOT NULL DEFAULT 1,
  paying_since TEXT NOT NULL DEFAULT '',
  annual_rate_bps INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS income_templates (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  cadence TEXT NOT NULL DEFAULT 'month',
  next_pay_date TEXT NOT NULL DEFAULT '',
  day_of_month INTEGER NOT NULL,
  expected_amount_cents INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS payment_templates (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  day_of_month INTEGER NOT NULL,
  expected_amount_cents INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  debt_id TEXT REFERENCES debts(id) ON DELETE SET NULL,
  from_debt INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS debt_payoff_plans (
  id INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
  strategy TEXT NOT NULL DEFAULT 'snowball',
  extra_monthly_cents INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS debt_payoff_drops (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL UNIQUE REFERENCES debts(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  redirect_debt_id TEXT REFERENCES debts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS months (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  UNIQUE(year, month)
);

CREATE TABLE IF NOT EXISTS account_snapshots (
  id TEXT PRIMARY KEY,
  month_id TEXT NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  opening_balance_cents INTEGER NOT NULL DEFAULT 0,
  UNIQUE(month_id, account_id)
);

CREATE TABLE IF NOT EXISTS income_entries (
  id TEXT PRIMARY KEY,
  month_id TEXT NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES income_templates(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  day_of_month INTEGER NOT NULL,
  expected_amount_cents INTEGER NOT NULL,
  actual_amount_cents INTEGER,
  received INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS payment_entries (
  id TEXT PRIMARY KEY,
  month_id TEXT NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES payment_templates(id) ON DELETE SET NULL,
  debt_id TEXT REFERENCES debts(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  day_of_month INTEGER NOT NULL,
  expected_amount_cents INTEGER NOT NULL,
  actual_amount_cents INTEGER,
  paid INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  applied_to_debt_amount_cents INTEGER NOT NULL DEFAULT 0
);
`;

export function sqliteFilePath() {
  return process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "budgethor.db");
}

type AppDb = ReturnType<typeof drizzle<typeof schema>>;

let cached: AppDb | null = null;

export function getDb() {
  if (cached) return cached;

  const file = sqliteFilePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(SQLITE_SCHEMA);
  migrateSchema(sqlite);
  migrateDebts(sqlite);
  migrateDebtPayoffPlan(sqlite);

  cached = drizzle(sqlite, { schema });

  const existing = cached.select().from(schema.settings).all();
  if (existing.length === 0) {
    cached
      .insert(schema.settings)
      .values({ id: 1, onboardingCompleted: false, theme: "light" })
      .run();
  }

  const existingPlan = cached.select().from(schema.debtPayoffPlans).all();
  if (existingPlan.length === 0) {
    cached
      .insert(schema.debtPayoffPlans)
      .values({ id: 1, strategy: "snowball", extraMonthlyCents: 0 })
      .run();
  }

  return cached;
}

function migrateSchema(sqlite: InstanceType<typeof Database>) {
  const incomeColumns = sqlite.prepare("PRAGMA table_info(income_templates)").all() as {
    name: string;
  }[];
  const incomeNames = new Set(incomeColumns.map((column) => column.name));
  if (!incomeNames.has("cadence")) {
    sqlite.exec("ALTER TABLE income_templates ADD COLUMN cadence TEXT NOT NULL DEFAULT 'month'");
  }
  if (!incomeNames.has("next_pay_date")) {
    sqlite.exec("ALTER TABLE income_templates ADD COLUMN next_pay_date TEXT NOT NULL DEFAULT ''");
  }

  const debtColumns = sqlite.prepare("PRAGMA table_info(debts)").all() as { name: string }[];
  const debtNames = new Set(debtColumns.map((column) => column.name));
  if (!debtNames.has("day_of_month")) {
    sqlite.exec("ALTER TABLE debts ADD COLUMN day_of_month INTEGER NOT NULL DEFAULT 1");
  }
  if (!debtNames.has("account_id")) {
    sqlite.exec("ALTER TABLE debts ADD COLUMN account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL");
  }
  if (!debtNames.has("principal_cents")) {
    sqlite.exec("ALTER TABLE debts ADD COLUMN principal_cents INTEGER NOT NULL DEFAULT 0");
    sqlite.exec("UPDATE debts SET principal_cents = balance_cents WHERE principal_cents = 0");
  }
  if (!debtNames.has("paying_since")) {
    sqlite.exec("ALTER TABLE debts ADD COLUMN paying_since TEXT NOT NULL DEFAULT ''");
  }
  if (!debtNames.has("annual_rate_bps")) {
    sqlite.exec("ALTER TABLE debts ADD COLUMN annual_rate_bps INTEGER NOT NULL DEFAULT 0");
  }

  const paymentColumns = sqlite.prepare("PRAGMA table_info(payment_templates)").all() as {
    name: string;
  }[];
  const paymentNames = new Set(paymentColumns.map((column) => column.name));
  if (!paymentNames.has("from_debt")) {
    sqlite.exec("ALTER TABLE payment_templates ADD COLUMN from_debt INTEGER NOT NULL DEFAULT 0");
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  sqlite
    .prepare(
      `UPDATE income_templates
       SET next_pay_date = printf('%04d-%s-%02d', ?, ?, MIN(day_of_month, 28))
       WHERE next_pay_date = ''`,
    )
    .run(year, month);
}

function migrateDebts(sqlite: InstanceType<typeof Database>) {
  const columns = sqlite.prepare("PRAGMA table_info(debts)").all() as { name: string }[];
  const names = new Set(columns.map((column) => column.name));
  if (!names.has("day_of_month")) {
    sqlite.exec("ALTER TABLE debts ADD COLUMN day_of_month INTEGER NOT NULL DEFAULT 1");
  }
  if (!names.has("account_id")) {
    sqlite.exec("ALTER TABLE debts ADD COLUMN account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL");
  }
  if (!names.has("principal_cents")) {
    sqlite.exec("ALTER TABLE debts ADD COLUMN principal_cents INTEGER NOT NULL DEFAULT 0");
    sqlite.exec("UPDATE debts SET principal_cents = balance_cents WHERE principal_cents = 0");
  }
  if (!names.has("paying_since")) {
    sqlite.exec("ALTER TABLE debts ADD COLUMN paying_since TEXT NOT NULL DEFAULT ''");
  }
  if (!names.has("annual_rate_bps")) {
    sqlite.exec("ALTER TABLE debts ADD COLUMN annual_rate_bps INTEGER NOT NULL DEFAULT 0");
  }
}

function migrateDebtPayoffPlan(sqlite: InstanceType<typeof Database>) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS debt_payoff_plans (
      id INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
      strategy TEXT NOT NULL DEFAULT 'snowball',
      extra_monthly_cents INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS debt_payoff_drops (
      id TEXT PRIMARY KEY,
      debt_id TEXT NOT NULL UNIQUE REFERENCES debts(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      redirect_debt_id TEXT REFERENCES debts(id) ON DELETE SET NULL
    );
  `);
}
