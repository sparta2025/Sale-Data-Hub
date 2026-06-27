// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/kpi.ts
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db, salesTransactionsTable, kpiTargetsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { optionalAuth, requireAuth } from "../lib/auth.js";
import { aggregateKpi, buildFilters, METRIC_DEFS } from "../lib/kpi-engine.js";
import {
  GetKpiSummaryBody,
  GetKpiScorecardBody,
  GetKpiCompareBody,
  GetProfitLossBody,
  UpsertKpiTargetBody,
  GetKpiTargetsQueryParams,
} from "@workspace/api-zod";

const router = Router();

// POST /api/kpi/summary
router.post("/summary", optionalAuth, async (req, res) => {
  const parsed = GetKpiSummaryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, groupBy, filters } = parsed.data;
  const rows = await aggregateKpi(datasetId, groupBy, filters ?? undefined);
  const total: Record<string, number> = {};
  for (const row of rows) {
    for (const [k, v] of Object.entries(row.metrics)) {
      total[k] = (total[k] ?? 0) + (v as number);
    }
  }
  res.json({ groupBy, rows, total, rowCount: rows.length, cached: false });
});

// POST /api/kpi/scorecard
router.post("/scorecard", optionalAuth, async (req, res) => {
  const parsed = GetKpiScorecardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, periodCol, periodA, periodB, filters } = parsed.data;

  const filtersA = { ...filters, [periodCol]: isNaN(Number(periodA)) ? periodA : Number(periodA) };
  const filtersB = { ...filters, [periodCol]: isNaN(Number(periodB)) ? periodB : Number(periodB) };

  const [rowsA, rowsB] = await Promise.all([
    aggregateKpi(datasetId, [], filtersA),
    aggregateKpi(datasetId, [], filtersB),
  ]);

  const metricsA = rowsA[0]?.metrics ?? {};
  const metricsB = rowsB[0]?.metrics ?? {};

  const metrics = Object.entries(METRIC_DEFS).map(([key, def]) => {
    const valA = Number(metricsA[key] ?? 0);
    const valB = Number(metricsB[key] ?? 0);
    const deltaPct = valA !== 0 ? ((valB - valA) / Math.abs(valA)) * 100 : 0;
    return { columnName: key, displayName: def.display, displayFormat: def.format, valueA: valA, valueB: valB, deltaPct };
  });

  res.json({ periodA, periodB, metrics });
});

// POST /api/kpi/compare
router.post("/compare", optionalAuth, async (req, res) => {
  const parsed = GetKpiCompareBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, dimension, metric, periodCol, periodA, periodB, limit } = parsed.data;

  const filtersA = { [periodCol]: isNaN(Number(periodA)) ? periodA : Number(periodA) };
  const filtersB = { [periodCol]: isNaN(Number(periodB)) ? periodB : Number(periodB) };

  const [rowsA, rowsB] = await Promise.all([
    aggregateKpi(datasetId, [dimension], filtersA),
    aggregateKpi(datasetId, [dimension], filtersB),
  ]);

  const mapA = new Map(rowsA.map((r) => [r.dimensions[dimension], r.metrics[metric] ?? 0]));
  const mapB = new Map(rowsB.map((r) => [r.dimensions[dimension], r.metrics[metric] ?? 0]));
  const labels = new Set([...mapA.keys(), ...mapB.keys()]);

  const items = Array.from(labels).map((label) => {
    const valA = Number(mapA.get(label) ?? 0);
    const valB = Number(mapB.get(label) ?? 0);
    const delta = valB - valA;
    const deltaPct = valA !== 0 ? (delta / Math.abs(valA)) * 100 : 0;
    return { label: String(label ?? ""), valueA: valA, valueB: valB, delta, deltaPct };
  }).sort((a, b) => b.valueB - a.valueB).slice(0, limit ?? 15);

  const def = METRIC_DEFS[metric];
  res.json({ dimension, metric, metricDisplay: def?.display ?? metric, periodA, periodB, items });
});

// POST /api/kpi/pl
router.post("/pl", optionalAuth, async (req, res) => {
  const parsed = GetProfitLossBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, filters } = parsed.data;

  const rows = await aggregateKpi(datasetId, [], filters ?? undefined);
  const m = rows[0]?.metrics ?? {};
  const rev = Number(m.revenue ?? 0);
  const cogs = Number(m.cogs ?? 0);
  const gp = Number(m.grossProfit ?? 0);
  const mkt = Number(m.marketing ?? 0);
  const oh = Number(m.overhead ?? 0);
  const ebitda = Number(m.ebitda ?? 0);
  const ebit = Number(m.ebit ?? 0);
  const np = Number(m.netProfit ?? 0);

  const pct = (v: number) => rev > 0 ? (v / rev) * 100 : null;

  const lines = [
    { label: "Выручка нетто", value: rev, pct: 100, level: 0, isTotal: false },
    { label: "Себестоимость", value: -cogs, pct: pct(-cogs), level: 1, isTotal: false },
    { label: "Валовая прибыль", value: gp, pct: pct(gp), level: 0, isTotal: true },
    { label: "Маркетинг", value: -mkt, pct: pct(-mkt), level: 1, isTotal: false },
    { label: "Накладные расходы", value: -oh, pct: pct(-oh), level: 1, isTotal: false },
    { label: "EBITDA", value: ebitda, pct: pct(ebitda), level: 0, isTotal: true },
    { label: "D&A (approx)", value: -(ebitda - ebit), pct: pct(-(ebitda - ebit)), level: 1, isTotal: false },
    { label: "EBIT", value: ebit, pct: pct(ebit), level: 0, isTotal: true },
    { label: "Налоги и прочее", value: -(ebit - np), pct: pct(-(ebit - np)), level: 1, isTotal: false },
    { label: "Чистая прибыль", value: np, pct: pct(np), level: 0, isTotal: true },
  ];

  res.json({ lines, currency: "EUR", groupBy: [], filters: filters ?? {} });
});

// GET /api/kpi/targets
router.get("/targets", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = GetKpiTargetsQueryParams.safeParse(req.query);
  const datasetId = parsed.data?.datasetId;
  let query: any = db.select().from(kpiTargetsTable).where(eq(kpiTargetsTable.userId, user.id));
  if (datasetId) {
    query = db.select().from(kpiTargetsTable).where(and(eq(kpiTargetsTable.userId, user.id), eq(kpiTargetsTable.datasetId, datasetId)));
  }
  const rows = await query;
  res.json(rows.map(fmtTarget));
});

// POST /api/kpi/targets
router.post("/targets", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = UpsertKpiTargetBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, metric, targetValue, period } = parsed.data;
  const id = uuidv4();
  await db.insert(kpiTargetsTable).values({ id, datasetId, userId: user.id, metric, targetValue: String(targetValue), period });
  const row = await db.select().from(kpiTargetsTable).where(eq(kpiTargetsTable.id, id)).limit(1);
  res.json(fmtTarget(row[0]!));
});

function fmtTarget(t: any) {
  return {
    id: t.id, datasetId: t.datasetId, userId: t.userId, metric: t.metric,
    targetValue: Number(t.targetValue), period: t.period,
    createdAt: t.createdAt?.toISOString() ?? "",
  };
}

export default router;
