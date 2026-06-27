// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/map.ts
import { Router } from "express";
import { db, salesTransactionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { optionalAuth } from "../lib/auth.js";
import { aggregateKpi, buildFilters } from "../lib/kpi-engine.js";
import { GetMapDrilldownBody } from "@workspace/api-zod";

const router = Router();

// Approximate country coordinates for map rendering
const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Германия": { lat: 51.2, lng: 10.4 }, "Germany": { lat: 51.2, lng: 10.4 },
  "Франция": { lat: 46.2, lng: 2.2 }, "France": { lat: 46.2, lng: 2.2 },
  "Великобритания": { lat: 55.4, lng: -3.4 }, "UK": { lat: 55.4, lng: -3.4 },
  "США": { lat: 37.1, lng: -95.7 }, "USA": { lat: 37.1, lng: -95.7 },
  "Китай": { lat: 35.9, lng: 104.2 }, "China": { lat: 35.9, lng: 104.2 },
  "Япония": { lat: 36.2, lng: 138.2 }, "Japan": { lat: 36.2, lng: 138.2 },
  "Польша": { lat: 51.9, lng: 19.1 }, "Poland": { lat: 51.9, lng: 19.1 },
  "Казахстан": { lat: 48.0, lng: 67.3 }, "Kazakhstan": { lat: 48.0, lng: 67.3 },
  "Беларусь": { lat: 53.7, lng: 28.0 }, "Belarus": { lat: 53.7, lng: 28.0 },
  "Россия": { lat: 61.5, lng: 105.3 }, "Russia": { lat: 61.5, lng: 105.3 },
};

// POST /api/map/drilldown
router.post("/drilldown", optionalAuth, async (req, res) => {
  const parsed = GetMapDrilldownBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, level, parentCountry, parentBranch, parentCategory, metric, filters } = parsed.data;

  // Determine which column to group by based on level
  const levelGroups: Record<string, string[]> = {
    country: ["country"],
    branch: ["country", "branch"],
    category: ["country", "branch", "category"],
    sku: ["country", "branch", "category", "sku"],
  };
  const groupBy = levelGroups[level ?? "country"] ?? ["country"];

  // Build filters for drill-down context
  const drillFilters: Record<string, any> = { ...filters };
  if (parentCountry) drillFilters["country"] = parentCountry;
  if (parentBranch) drillFilters["branch"] = parentBranch;
  if (parentCategory) drillFilters["category"] = parentCategory;

  const rows = await aggregateKpi(datasetId, groupBy, drillFilters);

  // Get previous period for growth calculation
  const metricKey = metric ?? "revenue";
  const metricCol = {
    revenue: "revenue", grossProfit: "grossProfit", ebitda: "ebitda",
    netProfit: "netProfit", units: "units",
  }[metricKey] ?? "revenue";

  const items = rows.map((r, idx) => {
    const dimKey = level === "country" ? r.dimensions.country
      : level === "branch" ? r.dimensions.branch
      : level === "category" ? r.dimensions.category
      : r.dimensions.sku;

    const value = Number(r.metrics[metricCol] ?? 0);
    const coords = COUNTRY_COORDS[dimKey ?? ""] ?? null;

    return {
      id: `${level}-${idx}`,
      label: dimKey ?? `Unknown ${level}`,
      level: level ?? "country",
      value,
      growthPct: Number(r.metrics.growthYoy ?? 0) || null,
      children: 0,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    };
  }).sort((a, b) => b.value - a.value);

  res.json({ level: level ?? "country", metric: metricKey, items });
});

export default router;
