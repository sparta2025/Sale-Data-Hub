// VERSION: 1.0.0
// Path: lib/db/src/schema/datasets.ts
import { pgTable, text, timestamp, varchar, integer, boolean, jsonb, numeric, real } from "drizzle-orm/pg-core";

export const datasetsTable = pgTable("datasets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }),
  rowCount: integer("row_count").notNull().default(0),
  columns: jsonb("columns").$type<string[]>().notNull().default([]),
  status: varchar("status", { length: 50 }).notNull().default("ready"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sales transactions (imported from Excel)
export const salesTransactionsTable = pgTable("sales_transactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  datasetId: varchar("dataset_id", { length: 36 }).notNull().references(() => datasetsTable.id, { onDelete: "cascade" }),
  country: varchar("country", { length: 100 }),
  branch: varchar("branch", { length: 100 }),
  year: integer("year"),
  month: integer("month"),
  category: varchar("category", { length: 100 }),
  sku: varchar("sku", { length: 100 }),
  // Core financials
  revenueNet: numeric("revenue_net", { precision: 18, scale: 2 }),
  grossProfit: numeric("gross_profit", { precision: 18, scale: 2 }),
  ebitda: numeric("ebitda", { precision: 18, scale: 2 }),
  ebit: numeric("ebit", { precision: 18, scale: 2 }),
  netProfit: numeric("net_profit", { precision: 18, scale: 2 }),
  // Cost structure
  cogs: numeric("cogs", { precision: 18, scale: 2 }),
  marketing: numeric("marketing", { precision: 18, scale: 2 }),
  overhead: numeric("overhead", { precision: 18, scale: 2 }),
  // Volume & pricing
  unitsSold: numeric("units_sold", { precision: 18, scale: 4 }),
  avgPrice: numeric("avg_price", { precision: 18, scale: 4 }),
  // Ratios (stored as decimal, e.g. 0.35 = 35%)
  grossMargin: numeric("gross_margin", { precision: 10, scale: 6 }),
  ebitdaMargin: numeric("ebitda_margin", { precision: 10, scale: 6 }),
  roi: numeric("roi", { precision: 10, scale: 6 }),
  // Capital
  investedCapital: numeric("invested_capital", { precision: 18, scale: 2 }),
  wacc: numeric("wacc", { precision: 10, scale: 6 }),
  eva: numeric("eva", { precision: 18, scale: 2 }),
  // BCG
  bcgQuadrant: varchar("bcg_quadrant", { length: 50 }),
  marketShare: numeric("market_share", { precision: 10, scale: 6 }),
  growthYoy: numeric("growth_yoy", { precision: 10, scale: 6 }),
  // Cash flow
  ocf: numeric("ocf", { precision: 18, scale: 2 }),
  capex: numeric("capex", { precision: 18, scale: 2 }),
  // Working capital
  dso: numeric("dso", { precision: 10, scale: 2 }),
  dpo: numeric("dpo", { precision: 10, scale: 2 }),
  inventory: numeric("inventory", { precision: 18, scale: 2 }),
  // Extra JSON for any additional columns
  extra: jsonb("extra"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const kpiTargetsTable = pgTable("kpi_targets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  datasetId: varchar("dataset_id", { length: 36 }).notNull().references(() => datasetsTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 }).notNull(),
  metric: varchar("metric", { length: 100 }).notNull(),
  targetValue: numeric("target_value", { precision: 18, scale: 6 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dashboardsTable = pgTable("dashboards", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  config: jsonb("config").notNull().default({}),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agentTasksTable = pgTable("agent_tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  prompt: text("prompt"),
  result: text("result"),
  error: text("error"),
  datasetId: varchar("dataset_id", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type Dataset = typeof datasetsTable.$inferSelect;
export type SalesTransaction = typeof salesTransactionsTable.$inferSelect;
export type KpiTarget = typeof kpiTargetsTable.$inferSelect;
export type Dashboard = typeof dashboardsTable.$inferSelect;
export type AgentTask = typeof agentTasksTable.$inferSelect;
