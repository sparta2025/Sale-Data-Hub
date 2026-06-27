// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/export.ts
import { Router } from "express";
import { optionalAuth } from "../lib/auth.js";
import { aggregateKpi, METRIC_DEFS } from "../lib/kpi-engine.js";
import { ExportExcelBody, ExportCsvBody, ExportJsonBody } from "@workspace/api-zod";

const router = Router();

async function getExportData(body: any) {
  const { datasetId, type, filters, groupBy } = body;
  const dims = groupBy ?? ["year", "month"];
  const rows = await aggregateKpi(datasetId, dims, filters);
  return rows;
}

// POST /api/export/excel
router.post("/excel", optionalAuth, async (req, res) => {
  const parsed = ExportExcelBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const rows = await getExportData(parsed.data);
  const { utils, write } = await import("xlsx");

  const sheetData = rows.map((r) => ({
    ...r.dimensions,
    ...Object.fromEntries(Object.entries(r.metrics).map(([k, v]) => [METRIC_DEFS[k]?.display ?? k, v])),
  }));

  const ws = utils.json_to_sheet(sheetData);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "KPI Data");
  const buf = write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="kpi-export.xlsx"');
  res.send(buf);
});

// POST /api/export/csv
router.post("/csv", optionalAuth, async (req, res) => {
  const parsed = ExportCsvBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const rows = await getExportData(parsed.data);
  if (rows.length === 0) { res.setHeader("Content-Type", "text/csv"); res.send(""); return; }

  const headers = [...Object.keys(rows[0]!.dimensions), ...Object.keys(rows[0]!.metrics).map((k) => METRIC_DEFS[k]?.display ?? k)];
  const csvRows = rows.map((r) => [
    ...Object.values(r.dimensions).map((v) => `"${v ?? ""}"`),
    ...Object.values(r.metrics).map((v) => String(Number(v).toFixed(2))),
  ].join(","));
  const csv = [headers.join(","), ...csvRows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="kpi-export.csv"');
  res.send(csv);
});

// POST /api/export/json
router.post("/json", optionalAuth, async (req, res) => {
  const parsed = ExportJsonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const rows = await getExportData(parsed.data);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", 'attachment; filename="kpi-export.json"');
  res.json({ data: rows, exportedAt: new Date().toISOString() });
});

export default router;
