// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/datasets.ts
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { db, datasetsTable, salesTransactionsTable } from "@workspace/db";
import { and, eq, desc, count, sql, type SQL } from "drizzle-orm";
import { GetDatasetPreviewQueryParams, GetDatasetPreviewResponse } from "@workspace/api-zod";
import { requireAuth, optionalAuth } from "../lib/auth.js";
import { logAction } from "../lib/audit.js";
import { EXCEL_TO_DB } from "../lib/kpi-engine.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// GET /api/datasets
router.get("/", optionalAuth, async (req, res) => {
  const user = (req as any).user;
  let query: any;
  if (user) {
    const { or, and } = await import("drizzle-orm");
    query = db.select().from(datasetsTable)
      .where(or(eq(datasetsTable.userId, user.id), eq(datasetsTable.isDemo, true)))
      .orderBy(desc(datasetsTable.createdAt));
  } else {
    query = db.select().from(datasetsTable)
      .where(eq(datasetsTable.isDemo, true))
      .orderBy(desc(datasetsTable.createdAt));
  }
  const rows = await query;
  res.json(rows.map(fmtDataset));
});

// POST /api/datasets
router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { name, fileName, rowCount, columns } = req.body;
  const id = uuidv4();
  await db.insert(datasetsTable).values({
    id, userId: user.id, name, fileName: fileName ?? null,
    rowCount: rowCount ?? 0, columns: columns ?? [], status: "ready", isDemo: false,
  });
  const row = await db.select().from(datasetsTable).where(eq(datasetsTable.id, id)).limit(1);
  res.status(201).json(fmtDataset(row[0]!));
});

// GET /api/datasets/preview?datasetId=...&limit=100&offset=0&filters={...}
router.get("/preview", optionalAuth, async (req, res): Promise<void> => {
  const parsedQuery = GetDatasetPreviewQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }

  const { datasetId, limit, offset, filters: rawFilters } = parsedQuery.data;
  const datasetRows = await db.select().from(datasetsTable)
    .where(eq(datasetsTable.id, datasetId))
    .limit(1);
  const dataset = datasetRows[0];
  if (!dataset) {
    res.status(404).json({ error: "Dataset not found" });
    return;
  }

  const user = (req as any).user;
  if (!dataset.isDemo && (!user || (dataset.userId !== user.id && user.role !== "admin"))) {
    res.status(user ? 403 : 401).json({ error: user ? "Forbidden" : "Authentication required" });
    return;
  }

  let filters: Record<string, string> = {};
  if (rawFilters) {
    try {
      const parsedFilters: unknown = JSON.parse(rawFilters);
      if (!parsedFilters || typeof parsedFilters !== "object" || Array.isArray(parsedFilters)) {
        res.status(400).json({ error: "filters must be a JSON object" });
        return;
      }
      filters = Object.fromEntries(
        Object.entries(parsedFilters).filter(([, value]) => typeof value === "string" && value.trim() !== ""),
      );
    } catch {
      res.status(400).json({ error: "filters must contain valid JSON" });
      return;
    }
  }

  const datasetColumns = new Set(dataset.columns ?? []);
  const conditions: SQL[] = [eq(salesTransactionsTable.datasetId, datasetId)];
  for (const [excelColumn, value] of Object.entries(filters)) {
    if (!datasetColumns.has(excelColumn)) {
      res.status(400).json({ error: `Unknown dataset column: ${excelColumn}` });
      return;
    }

    const dbColumn = EXCEL_TO_DB[excelColumn];
    const search = `%${value.trim()}%`;
    if (dbColumn) {
      const column = (salesTransactionsTable as any)[camel(dbColumn)];
      if (column) {
        conditions.push(sql`CAST(${column} AS TEXT) ILIKE ${search}`);
      }
    } else {
      conditions.push(sql`COALESCE(${salesTransactionsTable.extra}->>${excelColumn}, '') ILIKE ${search}`);
    }
  }

  const where = and(...conditions);
  const [totalRow] = await db.select({ total: count() })
    .from(salesTransactionsTable)
    .where(where);
  const rawRows = await db.select()
    .from(salesTransactionsTable)
    .where(where)
    .limit(limit)
    .offset(offset);

  const columns = dataset.columns ?? [];
  const rows = rawRows.map((row: any) => {
    const extra = row.extra && typeof row.extra === "object" ? row.extra : {};
    return Object.fromEntries(columns.map((column) => {
      const dbColumn = EXCEL_TO_DB[column];
      const value = dbColumn ? row[camel(dbColumn)] : extra[column] ?? null;
      return [column, value ?? null];
    }));
  });

  const response = {
    datasetId,
    columns,
    rows,
    total: Number(totalRow?.total ?? 0),
    limit,
    offset,
  };
  res.json(GetDatasetPreviewResponse.parse(response));
});

// GET /api/datasets/:datasetId
router.get("/:datasetId", optionalAuth, async (req, res) => {
  const datasetId = req.params.datasetId as string;
  const rows = await db.select().from(datasetsTable).where(eq(datasetsTable.id, datasetId)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "Dataset not found" }); return; }
  res.json(fmtDataset(rows[0]));
});

// DELETE /api/datasets/:datasetId
router.delete("/:datasetId", requireAuth, async (req, res) => {
  const datasetId = req.params.datasetId as string;
  const user = (req as any).user;
  const rows = await db.select().from(datasetsTable).where(eq(datasetsTable.id, datasetId)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "Dataset not found" }); return; }
  if (rows[0].userId !== user.id && user.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(datasetsTable).where(eq(datasetsTable.id, datasetId));
  await logAction({ req, action: "delete_dataset", entityType: "dataset", entityId: datasetId });
  res.json({ message: "Dataset deleted" });
});

// GET /api/datasets/:datasetId/summary
router.get("/:datasetId/summary", optionalAuth, async (req, res) => {
  const datasetId = req.params.datasetId as string;
  const [totals] = await db.select({
    totalRevenue: sql<number>`COALESCE(SUM(${salesTransactionsTable.revenueNet}), 0)`,
    totalGrossProfit: sql<number>`COALESCE(SUM(${salesTransactionsTable.grossProfit}), 0)`,
    totalEbitda: sql<number>`COALESCE(SUM(${salesTransactionsTable.ebitda}), 0)`,
    totalRoi: sql<number>`COALESCE(AVG(${salesTransactionsTable.roi}), 0)`,
    countRows: count(),
  }).from(salesTransactionsTable).where(eq(salesTransactionsTable.datasetId, datasetId));

  const countries = await db.selectDistinct({ country: salesTransactionsTable.country })
    .from(salesTransactionsTable).where(eq(salesTransactionsTable.datasetId, datasetId));
  const years = await db.selectDistinct({ year: salesTransactionsTable.year })
    .from(salesTransactionsTable).where(eq(salesTransactionsTable.datasetId, datasetId));
  const categories = await db.selectDistinct({ category: salesTransactionsTable.category })
    .from(salesTransactionsTable).where(eq(salesTransactionsTable.datasetId, datasetId));

  res.json({
    datasetId,
    totalRevenue: Number(totals?.totalRevenue ?? 0),
    totalGrossProfit: Number(totals?.totalGrossProfit ?? 0),
    totalEbitda: Number(totals?.totalEbitda ?? 0),
    totalRoi: Number(totals?.totalRoi ?? 0),
    countRows: Number(totals?.countRows ?? 0),
    countries: countries.map((r) => r.country).filter(Boolean),
    years: years.map((r) => r.year).filter(Boolean),
    categories: categories.map((r) => r.category).filter(Boolean),
  });
});

// POST /api/datasets/upload
router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  const user = (req as any).user;
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }

  const { read, utils } = await import("xlsx");
  const workbook = read(req.file.buffer, { type: "buffer" });
  const rawSheet = req.body?.sheet;
  const sheetName = (Array.isArray(rawSheet) ? rawSheet[0] : rawSheet) ?? workbook.SheetNames[0] ?? "";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) { res.status(400).json({ error: `Sheet '${sheetName}' not found` }); return; }

  const data: any[] = utils.sheet_to_json(sheet, { defval: null });
  if (data.length === 0) { res.status(400).json({ error: "Sheet is empty" }); return; }

  const columns = Object.keys(data[0] ?? {});
  const datasetId = uuidv4();
  const rawName = req.body?.name;
  const name = (Array.isArray(rawName) ? rawName[0] : rawName) ?? req.file.originalname;

  await db.insert(datasetsTable).values({
    id: datasetId,
    userId: user.id,
    name,
    fileName: req.file.originalname,
    rowCount: data.length,
    columns,
    status: "importing",
    isDemo: false,
  });

  // Parse and insert rows in batches
  const BATCH = 500;
  const rows = data.map((row: any) => {
    const txn: any = { id: uuidv4(), datasetId };
    const extra: any = {};

    for (const [excelCol, val] of Object.entries(row)) {
      const dbCol = EXCEL_TO_DB[excelCol];
      if (dbCol) {
        const numVal = typeof val === "number" ? val : (val !== null && val !== "" ? Number(val) : null);
        // String columns
        if (["country", "branch", "category", "sku", "bcg_quadrant"].includes(dbCol)) {
          txn[camel(dbCol)] = val !== null ? String(val) : null;
        } else if (["year", "month"].includes(dbCol)) {
          txn[camel(dbCol)] = numVal !== null && !isNaN(numVal) ? Math.round(numVal) : null;
        } else {
          txn[camel(dbCol)] = numVal !== null && !isNaN(numVal) ? numVal : null;
        }
      } else {
        extra[excelCol] = val;
      }
    }
    if (Object.keys(extra).length > 0) txn.extra = extra;
    txn.createdAt = new Date();
    return txn;
  });

  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(salesTransactionsTable).values(rows.slice(i, i + BATCH));
  }

  await db.update(datasetsTable).set({ status: "ready", updatedAt: new Date() }).where(eq(datasetsTable.id, datasetId));
  const dataset = await db.select().from(datasetsTable).where(eq(datasetsTable.id, datasetId)).limit(1);
  await logAction({ req, action: "upload_dataset", entityType: "dataset", entityId: datasetId });
  res.status(201).json(fmtDataset(dataset[0]!));
});

function camel(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function fmtDataset(d: any) {
  return {
    id: d.id, name: d.name, userId: d.userId, fileName: d.fileName ?? null,
    rowCount: d.rowCount, columns: d.columns ?? [], status: d.status,
    isDemo: d.isDemo, createdAt: d.createdAt?.toISOString() ?? "",
  };
}

export default router;
