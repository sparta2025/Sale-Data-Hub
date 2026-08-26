// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/agents.ts
// Multi-agent system: Excel analysis + competitor price search
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db, agentTasksTable } from "@workspace/db";
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
router.post("/analyze", optionalAuth, async (req, res) => {
  const user = (req as any).user as { id: string } | undefined;
  const parsed = AgentAnalyzeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { datasetId, prompt, language } = parsed.data;

  const taskId = uuidv4();
  const result = await runAnalysis(datasetId, prompt, language ?? "ru");

  if (user) {
    await db.insert(agentTasksTable).values({
      id: taskId, userId: user.id, type: "analyze",
      status: result.status, prompt, datasetId: datasetId ?? null,
      result: JSON.stringify({ text: result.text, insights: result.insights }),
      error: result.error ?? null,
      completedAt: new Date(),
    });
  }

  if (result.status === "failed") {
    req.log?.error({ taskId, error: result.error }, "OpenRouter agent request failed");
  }
  res.status(result.status === "failed" ? 502 : 200).json({
    taskId,
    status: result.status,
    result: result.text,
    insights: result.insights,
    ...(result.error ? { error: result.error } : {}),
  });
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

// Free model availability is provider-dependent and can be rate-limited.
// Keep several current :free models so one busy upstream does not break the agent.
const FREE_OPENROUTER_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "minimax/minimax-m3:free",
  "z-ai/glm-5.2:free",
  "nvidia/nemotron-3.5-lightning:free",
];

async function runAnalysis(datasetId: string, prompt: string, language: string): Promise<{
  status: "completed" | "failed";
  text: string | null;
  insights: string[];
  error?: string;
}> {
  try {
    // Get KPI context for the AI
    const isDemo = datasetId.startsWith("demo");
    const kpiRows = isDemo ? [] : await aggregateKpi(datasetId, [], undefined).catch(() => []);
    const metrics = kpiRows[0]?.metrics ?? (isDemo ? {
      revenue: 6240000, grossProfit: 2496000, grossMargin: 0.4,
      ebitda: 1248000, ebitdaMargin: 0.2, roi: 0.284, eva: 420000, netProfit: 870000,
    } : {});

    const kpiContext = `
Данные KPI:
- Выручка нетто: ${formatNum(metrics.revenue)} EUR
- Валовая прибыль: ${formatNum(metrics.grossProfit)} EUR (маржа: ${formatPct(metrics.grossMargin)})
- EBITDA: ${formatNum(metrics.ebitda)} EUR (маржа: ${formatPct(metrics.ebitdaMargin)})
- ROI: ${formatPct(metrics.roi)}
- EVA: ${formatNum(metrics.eva)} EUR
- Чистая прибыль: ${formatNum(metrics.netProfit)} EUR
    `.trim();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { status: "failed", text: null, insights: [], error: "OPENROUTER_API_KEY is not configured" };
    }

    const messages = [
      {
        role: "system",
        content: `Ты — AI-аналитик продаж. Отвечай на ${language === "ru" ? "русском" : "английском"} языке. Используй только данные из контекста, не выдумывай отсутствующие значения. Дай краткий вывод, затем 3-5 конкретных действий.`,
      },
      { role: "user", content: `${kpiContext}\n\nВопрос пользователя: ${prompt}` },
    ];
    let lastError = "No free OpenRouter model responded";

    for (const model of FREE_OPENROUTER_MODELS) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://sales-bi.replit.app",
            "X-Title": "Sales BI Platform",
          },
          body: JSON.stringify({ model, max_tokens: 8192, temperature: 0.2, messages }),
          signal: AbortSignal.timeout(60_000),
        });

        if (response.ok) {
          const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
          const text = payload.choices?.[0]?.message?.content?.trim();
          if (text) {
            const insights = text.split("\n")
              .filter((line) => /^\s*(•|-|\*|\d+[.)])\s+/.test(line))
              .map((line) => line.replace(/^\s*(•|-|\*|\d+[.)])\s+/, "").trim())
              .filter((line) => line.length > 10)
              .slice(0, 5);
            return { status: "completed", text, insights };
          }
          lastError = `${model} returned an empty response`;
          break;
        }

        const errorText = await response.text();
        let providerMessage = errorText.slice(0, 240);
        try {
          const errorPayload = JSON.parse(errorText) as { error?: { message?: string; metadata?: { raw?: string } } };
          providerMessage = errorPayload.error?.metadata?.raw ?? errorPayload.error?.message ?? providerMessage;
        } catch {
          // Keep the bounded response text for diagnostics.
        }
        lastError = `OpenRouter ${response.status} (${model}): ${providerMessage.slice(0, 240)}`;
        const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        if (!retryable || attempt === 1) break;
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    throw new Error(lastError);
  } catch (err) {
    return { status: "failed", text: null, insights: [], error: String(err) };
  }
}

function generateFallbackAnalysis(metrics: any, prompt: string, language: string): string {
  const rev = Number(metrics.revenue ?? 0);
  const gm = Number(metrics.grossMargin ?? 0) * 100;
  const ebitda = Number(metrics.ebitda ?? 0);
  const roi = Number(metrics.roi ?? 0) * 100;

  if (language === "ru") {
      return `Анализ данных продаж:\n\n• Выручка составляет ${formatNum(rev)} EUR\n• Валовая маржа: ${gm.toFixed(1)}% ${gm > 30 ? "(хороший уровень)" : gm > 20 ? "(приемлемый)" : "(требует улучшения)"}\n• EBITDA: ${formatNum(ebitda)} EUR\n• ROI: ${roi.toFixed(1)}%`;
  }
  return `Sales data analysis:\n\n• Revenue: ${formatNum(rev)} EUR\n• Gross margin: ${gm.toFixed(1)}%\n• EBITDA: ${formatNum(ebitda)} EUR\n• ROI: ${roi.toFixed(1)}%`;
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
