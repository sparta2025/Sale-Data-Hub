// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/forecast.ts
import { Router } from "express";
import { db, salesTransactionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { optionalAuth } from "../lib/auth.js";
import { forecastTrendSeasonal, buildFilters } from "../lib/kpi-engine.js";
import { GetForecastBody } from "@workspace/api-zod";

const router = Router();

// POST /api/forecast
router.post("/", optionalAuth, async (req, res) => {
  const parsed = GetForecastBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, horizon, method, groupCol, macroAdj, filters } = parsed.data;

  const whereClause = buildFilters(datasetId, filters ?? undefined);

  const historyRaw = await db
    .select({
      year: salesTransactionsTable.year,
      month: salesTransactionsTable.month,
      value: sql<number>`COALESCE(SUM(${salesTransactionsTable.revenueNet}), 0)`,
    })
    .from(salesTransactionsTable)
    .where(whereClause)
    .groupBy(salesTransactionsTable.year, salesTransactionsTable.month)
    .orderBy(salesTransactionsTable.year, salesTransactionsTable.month);

  const history = historyRaw
    .filter((r) => r.year && r.month)
    .map((r) => ({
      year: r.year!,
      month: r.month!,
      value: Number(r.value),
      date: `${r.year}-${String(r.month).padStart(2, "0")}`,
      isHistory: true as const,
      group: null as string | null,
      lowerCi: null as number | null,
      upperCi: null as number | null,
    }));

  const { forecast } = forecastTrendSeasonal(
    history.map((h) => ({ year: h.year, month: h.month, value: h.value })),
    horizon ?? 12,
    macroAdj ?? 1.0
  );

  // Seasonality indices
  const monthVals: Record<number, number[]> = {};
  for (const h of history) {
    if (!monthVals[h.month]) monthVals[h.month] = [];
    monthVals[h.month]!.push(h.value);
  }
  const avgOverall = history.reduce((s, h) => s + h.value, 0) / (history.length || 1);
  const seasonality = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const vals = monthVals[m] ?? [avgOverall];
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    return { month: m, index: avgOverall > 0 ? avg / avgOverall : 1 };
  });

  // YoY trend
  const lastYearData = history.filter((h) => h.year === history[history.length - 1]?.year);
  const prevYearData = history.filter((h) => h.year === (history[history.length - 1]?.year ?? 0) - 1);
  const lastRev = lastYearData.reduce((s, h) => s + h.value, 0);
  const prevRev = prevYearData.reduce((s, h) => s + h.value, 0);
  const trendYoyPct = prevRev > 0 ? ((lastRev - prevRev) / prevRev) * 100 : null;

  res.json({
    method: method ?? "trend_seasonal",
    horizon: horizon ?? 12,
    groupCol: groupCol ?? null,
    macroAdj: macroAdj ?? 1.0,
    history,
    forecast: forecast.map((f) => ({
      year: f.year, month: f.month, value: f.value,
      date: `${f.year}-${String(f.month).padStart(2, "0")}`,
      isHistory: false, group: null, lowerCi: f.lowerCi, upperCi: f.upperCi,
    })),
    seasonality,
    trendYoyPct,
  });
});

export default router;
