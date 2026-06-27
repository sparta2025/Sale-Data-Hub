// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/agents.ts
// Multi-agent system: Excel analysis + competitor price search
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db, agentTasksTable, salesTransactionsTable, datasetsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth.js";
import { AgentAnalyzeBody, AgentPriceSearchBody } from "@workspace/api-zod";
import { aggregateKpi } from "../lib/kpi-engine.js";

const router = Router();

// GET /api/agents/tasks
router.get("/tasks", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const rows = await db.select().from(agentTasksTable)
    .where(eq(agentTasksTable.userId, user.id))
    .orderBy(desc(agentTasksTable.createdAt))
    .limit(50);
  res.json(rows.map(fmtTask));
});

// GET /api/agents/tasks/:taskId
router.get("/tasks/:taskId", requireAuth, async (req, res) => {
  const taskId = req.params.taskId as string;
  const rows = await db.select().from(agentTasksTable).where(eq(agentTasksTable.id, taskId)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "Task not found" }); return; }
  res.json(fmtTask(rows[0]));
});

// POST /api/agents/analyze
router.post("/analyze", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = AgentAnalyzeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, prompt, language } = parsed.data;

  const taskId = uuidv4();
  await db.insert(agentTasksTable).values({
    id: taskId, userId: user.id, type: "analyze",
    status: "running", prompt, datasetId: datasetId ?? null,
  });

  // Run analysis asynchronously (fire-and-forget pattern)
  runAnalysis(taskId, datasetId, prompt, language ?? "ru").catch((err) => {
    req.log?.error({ err, taskId }, "Agent analyze failed");
  });

  res.json({ taskId, status: "running", result: null, insights: [] });
});

// POST /api/agents/price-search
router.post("/price-search", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = AgentPriceSearchBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, skus, country, maxResults } = parsed.data;

  const taskId = uuidv4();
  await db.insert(agentTasksTable).values({
    id: taskId, userId: user.id, type: "price_search",
    status: "running", prompt: `Price search: ${skus.join(", ")}`, datasetId: datasetId ?? null,
  });

  const items = skus.map((sku) => ({
    sku,
    ourPrice: 0,
    competitorOffers: [
      { source: "Demo", price: Math.random() * 200 + 50, currency: "EUR", url: "#" },
    ],
    pricePositioning: "competitive",
    recommendation: `Competitor price search for ${sku} requires external web search API integration (SerpAPI).`,
  }));

  await db.update(agentTasksTable).set({
    status: "completed",
    result: JSON.stringify(items),
    completedAt: new Date(),
  }).where(eq(agentTasksTable.id, taskId));

  res.json({ taskId, status: "completed", items });
});

async function runAnalysis(taskId: string, datasetId: string, prompt: string, language: string) {
  try {
    // Get KPI context for the AI
    const kpiRows = await aggregateKpi(datasetId, [], undefined).catch(() => []);
    const metrics = kpiRows[0]?.metrics ?? {};

    const kpiContext = `
Данные KPI:
- Выручка нетто: ${formatNum(metrics.revenue)} EUR
- Валовая прибыль: ${formatNum(metrics.grossProfit)} EUR (маржа: ${formatPct(metrics.grossMargin)})
- EBITDA: ${formatNum(metrics.ebitda)} EUR (маржа: ${formatPct(metrics.ebitdaMargin)})
- ROI: ${formatPct(metrics.roi)}
- EVA: ${formatNum(metrics.eva)} EUR
- Чистая прибыль: ${formatNum(metrics.netProfit)} EUR
    `.trim();

    // Try Anthropic/OpenAI if available
    let result = "";
    let insights: string[] = [];

    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({
        baseURL: process.env["ANTHROPIC_API_BASE_URL"],
        apiKey: process.env["ANTHROPIC_API_KEY"] ?? "placeholder",
        defaultHeaders: { "anthropic-beta": "interstitial-ignores-1" },
      });

      const systemPrompt = `Ты — аналитик данных продаж. Отвечай на ${language === "ru" ? "русском" : "английском"} языке. Предоставляй конкретные, действенные insights на основе данных.`;
      const userMessage = `${kpiContext}\n\nВопрос пользователя: ${prompt}`;

      const response = await client.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: userMessage }],
        system: systemPrompt,
      });

      result = response.content[0]?.type === "text" ? response.content[0].text : "";
      // Extract bullet points as insights
      insights = result.split("\n").filter((l) => l.trim().startsWith("•") || l.trim().startsWith("-") || l.trim().startsWith("*"))
        .map((l) => l.replace(/^[•\-\*]\s*/, "").trim()).filter((l) => l.length > 10).slice(0, 5);
    } catch {
      // Fallback: generate basic analysis without AI
      result = generateFallbackAnalysis(metrics, prompt, language);
      insights = generateFallbackInsights(metrics);
    }

    await db.update(agentTasksTable).set({
      status: "completed",
      result: JSON.stringify({ text: result, insights }),
      completedAt: new Date(),
    }).where(eq(agentTasksTable.id, taskId));
  } catch (err) {
    await db.update(agentTasksTable).set({
      status: "failed",
      error: String(err),
      completedAt: new Date(),
    }).where(eq(agentTasksTable.id, taskId));
  }
}

function generateFallbackAnalysis(metrics: any, prompt: string, language: string): string {
  const rev = Number(metrics.revenue ?? 0);
  const gm = Number(metrics.grossMargin ?? 0) * 100;
  const ebitda = Number(metrics.ebitda ?? 0);
  const roi = Number(metrics.roi ?? 0) * 100;

  if (language === "ru") {
    return `Анализ данных продаж:\n\n• Выручка составляет ${formatNum(rev)} EUR\n• Валовая маржа: ${gm.toFixed(1)}% ${gm > 30 ? "(хороший уровень)" : gm > 20 ? "(приемлемый)" : "(требует улучшения)"}\n• EBITDA: ${formatNum(ebitda)} EUR\n• ROI: ${roi.toFixed(1)}%\n\nДля получения ИИ-анализа настройте ANTHROPIC_API_KEY.`;
  }
  return `Sales data analysis:\n\n• Revenue: ${formatNum(rev)} EUR\n• Gross margin: ${gm.toFixed(1)}%\n• EBITDA: ${formatNum(ebitda)} EUR\n• ROI: ${roi.toFixed(1)}%\n\nSet ANTHROPIC_API_KEY for AI-powered analysis.`;
}

function generateFallbackInsights(metrics: any): string[] {
  const insights = [];
  const gm = Number(metrics.grossMargin ?? 0) * 100;
  const roi = Number(metrics.roi ?? 0) * 100;
  const eva = Number(metrics.eva ?? 0);

  if (gm > 30) insights.push("Высокая валовая маржа указывает на сильную ценовую позицию");
  else if (gm < 20) insights.push("Низкая валовая маржа требует оптимизации себестоимости");
  if (roi > 15) insights.push("ROI выше среднеотраслевого уровня");
  if (eva > 0) insights.push("Положительная EVA: компания создаёт ценность для акционеров");
  else if (eva < 0) insights.push("Отрицательная EVA: стоимость капитала превышает прибыль");
  return insights.slice(0, 3);
}

function formatNum(v: any): string {
  const n = Number(v ?? 0);
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

function formatPct(v: any): string {
  return `${(Number(v ?? 0) * 100).toFixed(1)}%`;
}

function fmtTask(t: any) {
  return {
    id: t.id, userId: t.userId, type: t.type, status: t.status,
    prompt: t.prompt ?? null, result: t.result ?? null, error: t.error ?? null,
    createdAt: t.createdAt?.toISOString() ?? "", completedAt: t.completedAt?.toISOString() ?? null,
  };
}

export default router;
