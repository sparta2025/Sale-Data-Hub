// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/scenario.ts
import { Router } from "express";
import { optionalAuth } from "../lib/auth.js";
import { aggregateKpi, applyScenario } from "../lib/kpi-engine.js";
import { RunScenarioBody, CompareScenariosBody, RunSensitivityBody } from "@workspace/api-zod";

const router = Router();

async function getBaseKpi(datasetId: string, filters?: any) {
  const rows = await aggregateKpi(datasetId, [], filters);
  const m = rows[0]?.metrics ?? {};
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Number(v)]));
}

// POST /api/scenario/run
router.post("/run", optionalAuth, async (req, res) => {
  const parsed = RunScenarioBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, scenario, filters } = parsed.data;

  const base = await getBaseKpi(datasetId, filters ?? undefined);
  const result = applyScenario(base, scenario as any);

  const KPI_KEYS = ["revenue", "grossProfit", "ebitda", "ebit", "netProfit", "roi", "eva", "grossMargin", "ebitdaMargin"];
  const deltas = KPI_KEYS.map((kpi) => {
    const baseVal = base[kpi] ?? 0;
    const scenVal = result[kpi] ?? 0;
    const deltaAbs = scenVal - baseVal;
    const deltaPct = baseVal !== 0 ? (deltaAbs / Math.abs(baseVal)) * 100 : 0;
    return { kpi, baseValue: baseVal, scenarioValue: scenVal, deltaAbs, deltaPct };
  });

  res.json({ scenarioName: (scenario as any).name ?? "Сценарий", base, result, deltas });
});

// POST /api/scenario/compare
router.post("/compare", optionalAuth, async (req, res) => {
  const parsed = CompareScenariosBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, scenarios, kpis } = parsed.data;

  const base = await getBaseKpi(datasetId);
  const kpiList = kpis ?? ["revenue", "grossProfit", "ebitda", "netProfit", "roi", "eva"];
  const scenNames = (scenarios as any[]).map((s: any) => s.name ?? `Сценарий ${scenarios.indexOf(s) + 1}`);

  const results = (scenarios as any[]).map((s: any) => applyScenario(base, s));
  const comparison = kpiList.map((kpi) => {
    const row: any = { kpi };
    row["base"] = base[kpi] ?? 0;
    for (let i = 0; i < scenNames.length; i++) {
      row[scenNames[i]!] = results[i]?.[kpi] ?? 0;
    }
    return row;
  });

  // Best = highest revenue
  const revenueIdx = results.map((r) => r.revenue ?? 0);
  const bestIdx = revenueIdx.indexOf(Math.max(...revenueIdx));
  const worstIdx = revenueIdx.indexOf(Math.min(...revenueIdx));

  res.json({
    scenarios: scenNames,
    kpis: kpiList,
    comparison,
    bestScenario: scenNames[bestIdx] ?? "",
    worstScenario: scenNames[worstIdx] ?? "",
  });
});

// POST /api/scenario/sensitivity
router.post("/sensitivity", optionalAuth, async (req, res) => {
  const parsed = RunSensitivityBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, baseScenario, paramName, values, targetKpi } = parsed.data;

  const base = await getBaseKpi(datasetId);
  const baseResult = applyScenario(base, baseScenario as any);
  const baseKpiVal = baseResult[targetKpi] ?? 0;

  const rows = (values as number[]).map((v) => {
    const params = { ...(baseScenario as any), [paramName]: v };
    const result = applyScenario(base, params);
    const kpiValue = result[targetKpi] ?? 0;
    const delta = kpiValue - baseKpiVal;
    const deltaPct = baseKpiVal !== 0 ? (delta / Math.abs(baseKpiVal)) * 100 : 0;
    return { paramValue: v, kpiValue, delta, deltaPct };
  });

  // Elasticity: %ΔY / %ΔX
  const firstPct = (values[0] ?? 0) !== 0 ? ((values[values.length - 1]! - values[0]!) / Math.abs(values[0]!)) * 100 : 0;
  const lastKpi = rows[rows.length - 1]?.kpiValue ?? 0;
  const firstKpi = rows[0]?.kpiValue ?? 0;
  const kpiPct = firstKpi !== 0 ? ((lastKpi - firstKpi) / Math.abs(firstKpi)) * 100 : 0;
  const elasticity = firstPct !== 0 ? kpiPct / firstPct : 0;

  res.json({ paramName, targetKpi, rows, elasticity });
});

export default router;
