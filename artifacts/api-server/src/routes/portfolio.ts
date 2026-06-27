// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/portfolio.ts
import { Router } from "express";
import { db, salesTransactionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { optionalAuth } from "../lib/auth.js";
import { buildFilters, aggregateKpi } from "../lib/kpi-engine.js";
import { GetBcgBody, GetEvaBody, GetPaybackBody } from "@workspace/api-zod";

const router = Router();

// POST /api/portfolio/bcg
router.post("/bcg", optionalAuth, async (req, res) => {
  const parsed = GetBcgBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, currentYear, prevYear, category } = parsed.data;

  // Get available years
  const years = await db.selectDistinct({ year: salesTransactionsTable.year })
    .from(salesTransactionsTable).where(eq(salesTransactionsTable.datasetId, datasetId));
  const sortedYears = years.map((y) => y.year!).filter(Boolean).sort((a, b) => b - a);
  const curYear = currentYear ?? sortedYears[0] ?? new Date().getFullYear();
  const prvYear = prevYear ?? sortedYears[1] ?? curYear - 1;

  // SKU-level aggregation for current and previous year
  const filterCur: any = { year: curYear };
  const filterPrv: any = { year: prvYear };
  if (category) { filterCur.category = category; filterPrv.category = category; }

  const [curRows, prvRows] = await Promise.all([
    aggregateKpi(datasetId, ["sku", "category"], filterCur),
    aggregateKpi(datasetId, ["sku", "category"], filterPrv),
  ]);

  const prvMap = new Map(prvRows.map((r) => [r.dimensions.sku, Number(r.metrics.revenue ?? 0)]));
  const totalRevCur = curRows.reduce((s, r) => s + Number(r.metrics.revenue ?? 0), 0);

  const items = curRows.map((r) => {
    const revCur = Number(r.metrics.revenue ?? 0);
    const revPrv = prvMap.get(r.dimensions.sku) ?? null;
    const growthYoy = revPrv !== null && revPrv > 0 ? ((revCur - revPrv) / revPrv) * 100 : 0;
    const marketShare = totalRevCur > 0 ? (revCur / totalRevCur) * 100 : 0;
    // Use BCG from data if available, else calculate
    let bcgQuadrant = r.metrics.bcgQuadrant ?? r.dimensions.bcgQuadrant;
    if (!bcgQuadrant) {
      const highGrowth = growthYoy > 10;
      const highShare = marketShare > 5;
      if (highGrowth && highShare) bcgQuadrant = "Stars";
      else if (!highGrowth && highShare) bcgQuadrant = "Cash Cows";
      else if (highGrowth && !highShare) bcgQuadrant = "Question Marks";
      else bcgQuadrant = "Dogs";
    }
    return {
      sku: r.dimensions.sku ?? "", category: r.dimensions.category ?? "",
      revCurrent: revCur, revPrev: revPrv, growthYoy, marketShare, bcgQuadrant,
    };
  });

  const quadrantCounts: Record<string, number> = {};
  const quadrantRev: Record<string, number> = {};
  for (const item of items) {
    quadrantCounts[item.bcgQuadrant] = (quadrantCounts[item.bcgQuadrant] ?? 0) + 1;
    quadrantRev[item.bcgQuadrant] = (quadrantRev[item.bcgQuadrant] ?? 0) + item.revCurrent;
  }

  res.json({ currentYear: curYear, prevYear: prvYear, items, quadrantCounts, quadrantRev });
});

// POST /api/portfolio/eva
router.post("/eva", optionalAuth, async (req, res) => {
  const parsed = GetEvaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, groupBy, filters } = parsed.data;

  const dims = groupBy ?? ["category"];
  const rows = await aggregateKpi(datasetId, dims, filters ?? undefined);

  const evaRows = rows.map((r) => {
    const ebit = Number(r.metrics.ebit ?? 0);
    const ic = Number(r.metrics.investedCapital ?? 0);
    const wacc = Number(r.metrics.wacc ?? 0.08);
    const nopat = ebit * (1 - 0.25); // tax 25%
    const waccIc = wacc * ic;
    const eva = Number(r.metrics.eva ?? 0) || (nopat - waccIc);
    return {
      dimensions: r.dimensions, ebit, ic, nopat,
      wacc, waccIc, eva, evaPositive: eva >= 0,
    };
  });

  const totalEva = evaRows.reduce((s, r) => s + r.eva, 0);
  const totalNopat = evaRows.reduce((s, r) => s + r.nopat, 0);
  const valueCreators = evaRows.filter((r) => r.evaPositive).length;
  const valueDestroyers = evaRows.filter((r) => !r.evaPositive).length;

  res.json({ groupBy: dims, rows: evaRows, totalEva, totalNopat, valueCreators, valueDestroyers });
});

// POST /api/portfolio/payback
router.post("/payback", optionalAuth, async (req, res) => {
  const parsed = GetPaybackBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, filters } = parsed.data;

  const rows = await aggregateKpi(datasetId, ["sku"], filters ?? undefined);
  const paybackRows = rows.map((r) => {
    const gpAnnual = Number(r.metrics.grossProfit ?? 0);
    const ic = Number(r.metrics.investedCapital ?? 0);
    const paybackYears = gpAnnual > 0 && ic > 0 ? ic / gpAnnual : null;
    return {
      sku: r.dimensions.sku ?? "", gpAnnual, ic, paybackYears,
      bcgQuadrant: r.metrics.bcgQuadrant ?? null,
    };
  });

  const validPaybacks = paybackRows.filter((r) => r.paybackYears !== null).map((r) => r.paybackYears!);
  const avgPayback = validPaybacks.length > 0 ? validPaybacks.reduce((s, v) => s + v, 0) / validPaybacks.length : 0;
  const under3Years = validPaybacks.filter((v) => v <= 3).length;
  const over5Years = validPaybacks.filter((v) => v > 5).length;

  res.json({ rows: paybackRows, avgPayback, under3Years, over5Years });
});

export default router;
