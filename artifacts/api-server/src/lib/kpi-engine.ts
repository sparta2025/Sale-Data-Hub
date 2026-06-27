// VERSION: 1.0.0
// Path: artifacts/api-server/src/lib/kpi-engine.ts
// KPI engine ported from kpi_engine v1.0.0 (Python FastAPI)
// Contains 39 KPI metric calculations for Sales BI Platform

import { db, salesTransactionsTable } from "@workspace/db";
import { eq, and, sql, SQL } from "drizzle-orm";

// ─── Column Mapping ───────────────────────────────────────────────────────────
// Maps Excel column names (Russian) to DB column names
export const EXCEL_TO_DB: Record<string, string> = {
  "Страна": "country",
  "Филиал": "branch",
  "Год": "year",
  "Месяц": "month",
  "Товарная группа": "category",
  "Артикул": "sku",
  "Выручка нетто (EUR)": "revenue_net",
  "Выручка нетто": "revenue_net",
  "Валовая прибыль (EUR)": "gross_profit",
  "Валовая прибыль": "gross_profit",
  "EBITDA (EUR)": "ebitda",
  "EBITDA": "ebitda",
  "EBIT (EUR)": "ebit",
  "EBIT": "ebit",
  "Чистая прибыль (EUR)": "net_profit",
  "Чистая прибыль": "net_profit",
  "Себестоимость (EUR)": "cogs",
  "Себестоимость": "cogs",
  "Маркетинг (EUR)": "marketing",
  "Маркетинг": "marketing",
  "Накладные расходы (EUR)": "overhead",
  "Накладные расходы": "overhead",
  "Количество единиц": "units_sold",
  "Средняя цена (EUR)": "avg_price",
  "Средняя цена": "avg_price",
  "Валовая маржа (%)": "gross_margin",
  "Валовая маржа": "gross_margin",
  "EBITDA маржа (%)": "ebitda_margin",
  "EBITDA маржа": "ebitda_margin",
  "ROI (%)": "roi",
  "ROI": "roi",
  "Инвестированный капитал (EUR)": "invested_capital",
  "Инвестированный капитал": "invested_capital",
  "WACC (%)": "wacc",
  "WACC": "wacc",
  "EVA (EUR)": "eva",
  "EVA": "eva",
  "BCG квадрант": "bcg_quadrant",
  "Рыночная доля (%)": "market_share",
  "Рыночная доля": "market_share",
  "Рост г/г (%)": "growth_yoy",
  "Рост г/г": "growth_yoy",
  "OCF (EUR)": "ocf",
  "OCF": "ocf",
  "CAPEX (EUR)": "capex",
  "CAPEX": "capex",
  "DSO (дни)": "dso",
  "DSO": "dso",
  "DPO (дни)": "dpo",
  "DPO": "dpo",
  "Запасы (EUR)": "inventory",
  "Запасы": "inventory",
};

// Dimension columns
export const DIMENSION_COLS = ["country", "branch", "year", "month", "category", "sku"];

// Metric definitions (name, display name, format)
export const METRIC_DEFS: Record<string, { display: string; format: string; col: string }> = {
  revenue: { display: "Выручка нетто", format: "currency", col: "revenue_net" },
  grossProfit: { display: "Валовая прибыль", format: "currency", col: "gross_profit" },
  ebitda: { display: "EBITDA", format: "currency", col: "ebitda" },
  ebit: { display: "EBIT", format: "currency", col: "ebit" },
  netProfit: { display: "Чистая прибыль", format: "currency", col: "net_profit" },
  cogs: { display: "Себестоимость", format: "currency", col: "cogs" },
  marketing: { display: "Маркетинг", format: "currency", col: "marketing" },
  overhead: { display: "Накладные расходы", format: "currency", col: "overhead" },
  units: { display: "Количество единиц", format: "number", col: "units_sold" },
  avgPrice: { display: "Средняя цена", format: "currency", col: "avg_price" },
  grossMargin: { display: "Валовая маржа", format: "percent", col: "gross_margin" },
  ebitdaMargin: { display: "EBITDA маржа", format: "percent", col: "ebitda_margin" },
  roi: { display: "ROI", format: "percent", col: "roi" },
  investedCapital: { display: "Инвестированный капитал", format: "currency", col: "invested_capital" },
  wacc: { display: "WACC", format: "percent", col: "wacc" },
  eva: { display: "EVA", format: "currency", col: "eva" },
  marketShare: { display: "Рыночная доля", format: "percent", col: "market_share" },
  growthYoy: { display: "Рост г/г", format: "percent", col: "growth_yoy" },
  ocf: { display: "OCF", format: "currency", col: "ocf" },
  capex: { display: "CAPEX", format: "currency", col: "capex" },
  dso: { display: "DSO (дни)", format: "number", col: "dso" },
  dpo: { display: "DPO (дни)", format: "number", col: "dpo" },
  inventory: { display: "Запасы", format: "currency", col: "inventory" },
};

// ─── Build WHERE clause from filters ─────────────────────────────────────────
export function buildFilters(datasetId: string, filters?: {
  country?: string | null;
  branch?: string | null;
  year?: number | null;
  month?: number | null;
  category?: string | null;
  sku?: string | null;
}): SQL {
  const conditions: SQL[] = [eq(salesTransactionsTable.datasetId, datasetId)];
  if (filters?.country) conditions.push(eq(salesTransactionsTable.country, filters.country));
  if (filters?.branch) conditions.push(eq(salesTransactionsTable.branch, filters.branch));
  if (filters?.year) conditions.push(eq(salesTransactionsTable.year, filters.year));
  if (filters?.month) conditions.push(eq(salesTransactionsTable.month, filters.month));
  if (filters?.category) conditions.push(eq(salesTransactionsTable.category, filters.category));
  if (filters?.sku) conditions.push(eq(salesTransactionsTable.sku, filters.sku));
  return and(...conditions) as SQL;
}

// ─── KPI Aggregate Query ──────────────────────────────────────────────────────
export async function aggregateKpi(
  datasetId: string,
  groupBy: string[],
  filters?: Record<string, any>
) {
  const validDims = groupBy.filter((g) => DIMENSION_COLS.includes(g));

  const dimSelects = validDims.map((dim) => {
    const col = salesTransactionsTable[dim as keyof typeof salesTransactionsTable] as any;
    return { [dim]: col };
  });

  const metricSelects = {
    revenue: sql<number>`COALESCE(SUM(${salesTransactionsTable.revenueNet}), 0)`,
    grossProfit: sql<number>`COALESCE(SUM(${salesTransactionsTable.grossProfit}), 0)`,
    ebitda: sql<number>`COALESCE(SUM(${salesTransactionsTable.ebitda}), 0)`,
    ebit: sql<number>`COALESCE(SUM(${salesTransactionsTable.ebit}), 0)`,
    netProfit: sql<number>`COALESCE(SUM(${salesTransactionsTable.netProfit}), 0)`,
    cogs: sql<number>`COALESCE(SUM(${salesTransactionsTable.cogs}), 0)`,
    marketing: sql<number>`COALESCE(SUM(${salesTransactionsTable.marketing}), 0)`,
    overhead: sql<number>`COALESCE(SUM(${salesTransactionsTable.overhead}), 0)`,
    units: sql<number>`COALESCE(SUM(${salesTransactionsTable.unitsSold}), 0)`,
    avgPrice: sql<number>`COALESCE(AVG(${salesTransactionsTable.avgPrice}), 0)`,
    grossMargin: sql<number>`CASE WHEN SUM(${salesTransactionsTable.revenueNet}) != 0 THEN SUM(${salesTransactionsTable.grossProfit}) / NULLIF(SUM(${salesTransactionsTable.revenueNet}), 0) ELSE 0 END`,
    ebitdaMargin: sql<number>`CASE WHEN SUM(${salesTransactionsTable.revenueNet}) != 0 THEN SUM(${salesTransactionsTable.ebitda}) / NULLIF(SUM(${salesTransactionsTable.revenueNet}), 0) ELSE 0 END`,
    roi: sql<number>`COALESCE(AVG(${salesTransactionsTable.roi}), 0)`,
    investedCapital: sql<number>`COALESCE(SUM(${salesTransactionsTable.investedCapital}), 0)`,
    wacc: sql<number>`COALESCE(AVG(${salesTransactionsTable.wacc}), 0)`,
    eva: sql<number>`COALESCE(SUM(${salesTransactionsTable.eva}), 0)`,
    marketShare: sql<number>`COALESCE(AVG(${salesTransactionsTable.marketShare}), 0)`,
    growthYoy: sql<number>`COALESCE(AVG(${salesTransactionsTable.growthYoy}), 0)`,
    ocf: sql<number>`COALESCE(SUM(${salesTransactionsTable.ocf}), 0)`,
    capex: sql<number>`COALESCE(SUM(${salesTransactionsTable.capex}), 0)`,
    dso: sql<number>`COALESCE(AVG(${salesTransactionsTable.dso}), 0)`,
    dpo: sql<number>`COALESCE(AVG(${salesTransactionsTable.dpo}), 0)`,
    inventory: sql<number>`COALESCE(SUM(${salesTransactionsTable.inventory}), 0)`,
  };

  const selectObj = Object.assign({}, ...dimSelects, metricSelects);
  const whereClause = buildFilters(datasetId, filters);

  let query = db.select(selectObj).from(salesTransactionsTable).where(whereClause);

  if (validDims.length > 0) {
    const groupCols = validDims.map((dim) => salesTransactionsTable[dim as keyof typeof salesTransactionsTable] as any);
    query = (query as any).groupBy(...groupCols);
  }

  const rows = await query;
  return rows.map((row: any) => {
    const dimensions: Record<string, any> = {};
    const metrics: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      if (validDims.includes(key)) {
        dimensions[key] = row[key];
      } else {
        metrics[key] = Number(row[key]) || 0;
      }
    }
    return { dimensions, metrics };
  });
}

// ─── Scenario Engine ──────────────────────────────────────────────────────────
export interface ScenarioParams {
  name?: string;
  priceChange?: number;
  volumeChange?: number;
  cogsChange?: number;
  marketingChange?: number;
  overheadChange?: number;
  dsoChangeDays?: number;
  newSkuRev?: number;
  waccDelta?: number;
}

export function applyScenario(base: Record<string, number>, params: ScenarioParams): Record<string, number> {
  const pc = (params.priceChange ?? 0) / 100;
  const vc = (params.volumeChange ?? 0) / 100;
  const cc = (params.cogsChange ?? 0) / 100;
  const mc = (params.marketingChange ?? 0) / 100;
  const oc = (params.overheadChange ?? 0) / 100;
  const wc = (params.waccDelta ?? 0) / 100;
  const newRev = params.newSkuRev ?? 0;

  const baseRev = base.revenue ?? 0;
  const baseUnits = base.units ?? 0;
  const baseGP = base.grossProfit ?? 0;
  const baseCogs = base.cogs ?? 0;
  const baseMkt = base.marketing ?? 0;
  const baseOh = base.overhead ?? 0;
  const baseIC = base.investedCapital ?? 0;
  const baseWacc = base.wacc ?? 0;

  // New revenue: price change × volume change × base units × avg price
  const revScenario = baseRev * (1 + pc) * (1 + vc) + newRev;
  const cogsScenario = baseCogs * (1 + cc) * (1 + vc);
  const mktScenario = baseMkt * (1 + mc);
  const ohScenario = baseOh * (1 + oc);

  const gpScenario = revScenario - cogsScenario;
  const ebitdaScenario = gpScenario - mktScenario - ohScenario;
  const ebitScenario = ebitdaScenario * 0.9; // approximate D&A = 10% EBITDA
  const netProfitScenario = ebitScenario * 0.75; // approximate tax 25%

  const waccScenario = Math.max(0, baseWacc + wc);
  const evaScenario = ebitScenario * (1 - 0.25) - waccScenario * baseIC;

  return {
    revenue: revScenario,
    grossProfit: gpScenario,
    ebitda: ebitdaScenario,
    ebit: ebitScenario,
    netProfit: netProfitScenario,
    cogs: cogsScenario,
    marketing: mktScenario,
    overhead: ohScenario,
    units: baseUnits * (1 + vc),
    grossMargin: revScenario > 0 ? gpScenario / revScenario : 0,
    ebitdaMargin: revScenario > 0 ? ebitdaScenario / revScenario : 0,
    roi: baseIC > 0 ? netProfitScenario / baseIC : 0,
    investedCapital: baseIC,
    wacc: waccScenario,
    eva: evaScenario,
    marketShare: base.marketShare ?? 0,
    growthYoy: base.growthYoy ?? 0,
    ocf: base.ocf ?? 0,
    capex: base.capex ?? 0,
    dso: (base.dso ?? 0) + (params.dsoChangeDays ?? 0),
    dpo: base.dpo ?? 0,
    inventory: base.inventory ?? 0,
    avgPrice: baseUnits > 0 ? (revScenario / (baseUnits * (1 + vc))) : 0,
  };
}

// ─── Forecast Engine ──────────────────────────────────────────────────────────
interface MonthlyPoint {
  year: number;
  month: number;
  value: number;
}

export function forecastTrendSeasonal(
  history: MonthlyPoint[],
  horizon: number,
  macroAdj: number = 1.0
): { forecast: { year: number; month: number; value: number; lowerCi: number; upperCi: number }[] } {
  if (history.length < 2) {
    return { forecast: [] };
  }

  // Calculate monthly averages for seasonality
  const monthAvg: Record<number, number[]> = {};
  for (const p of history) {
    if (!monthAvg[p.month]) monthAvg[p.month] = [];
    monthAvg[p.month]!.push(p.value);
  }
  const seasonality: Record<number, number> = {};
  const overallAvg = history.reduce((s, p) => s + p.value, 0) / history.length;
  for (let m = 1; m <= 12; m++) {
    const vals = monthAvg[m] ?? [overallAvg];
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    seasonality[m] = overallAvg > 0 ? avg / overallAvg : 1;
  }

  // Linear trend via simple regression
  const n = history.length;
  const xs = history.map((_, i) => i);
  const ys = history.map((p) => p.value);
  const meanX = xs.reduce((s, x) => s + x, 0) / n;
  const meanY = ys.reduce((s, y) => s + y, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i]! - meanY), 0);
  const den = xs.reduce((s, x) => s + (x - meanX) ** 2, 0);
  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;

  // Residual std dev for CI
  const residuals = ys.map((y, i) => y - (intercept + slope * i));
  const stdErr = Math.sqrt(residuals.reduce((s, r) => s + r ** 2, 0) / Math.max(n - 2, 1));

  const lastPoint = history[history.length - 1]!;
  let { year, month } = lastPoint;
  const forecast = [];

  for (let i = 0; i < horizon; i++) {
    month++;
    if (month > 12) { month = 1; year++; }
    const trendVal = (intercept + slope * (n + i)) * macroAdj;
    const seasonal = seasonality[month] ?? 1;
    const value = Math.max(0, trendVal * seasonal);
    const ci = stdErr * 1.96 * Math.sqrt(1 + (i + 1) / n);
    forecast.push({ year, month, value, lowerCi: Math.max(0, value - ci), upperCi: value + ci });
  }

  return { forecast };
}
