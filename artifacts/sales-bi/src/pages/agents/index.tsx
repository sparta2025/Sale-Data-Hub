import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, TrendingUp, Search, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAgentAnalyze } from "@workspace/api-client-react";

interface Message { role: "user" | "assistant"; content: string; }

export default function AgentsPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Здравствуйте! Я AI-аналитик продаж на бесплатной модели OpenRouter. Я могу разобрать KPI, найти тренды, оценить сценарии и дать практические рекомендации.\n\nПримеры:\n• «Какие факторы сильнее всего влияют на рост выручки?»\n• «Какие категории работают хуже всего?»\n• «Как улучшить EBITDA и маржу?»\n• «Сравни результаты 2023 и 2024 года»",
    }
  ]);
  const analyze = useAgentAnalyze();
  const loading = analyze.isPending;

  async function sendMessage() {
    if (!prompt.trim() || loading) return;
    const userMsg = prompt.trim();
    setPrompt("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);

    try {
      const data = await analyze.mutateAsync({
        data: { datasetId: "demo", prompt: userMsg, language: "ru" },
      });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.result ?? data.insights?.join("\n") ?? "AI-агент не вернул текстовый результат.",
      }]);
    } catch (error) {
      toast({ title: "Ошибка AI-агента", description: error instanceof Error ? error.message : "Не удалось получить ответ OpenRouter", variant: "destructive" });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Не удалось получить ответ от OpenRouter. Проверьте доступность бесплатной модели и повторите запрос.",
      }]);
    }
  }

  const agentCards = [
    { icon: TrendingUp, title: "KPI Analyst", desc: "Deep-dive into your 39 KPI metrics", color: "bg-blue-500/10 text-blue-600" },
    { icon: Sparkles, title: "Scenario Engine", desc: "What-if analysis & projections", color: "bg-purple-500/10 text-purple-600" },
    { icon: Search, title: "Price Scout", desc: "Competitor price intelligence", color: "bg-orange-500/10 text-orange-600" },
    { icon: Bot, title: "Strategy AI", desc: "BCG, EVA & portfolio analysis", color: "bg-green-500/10 text-green-600" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-sm text-muted-foreground">Multi-agent system for sales intelligence & strategy</p>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {agentCards.map((a) => (
            <button
              key={a.title}
              type="button"
              className="text-left"
              data-testid={`button-agent-${a.title.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setPrompt(a.title === "Price Scout"
                ? "Проанализируй ценовое позиционирование наших SKU и предложи, где можно увеличить маржу."
                : a.title === "Scenario Engine"
                  ? "Оцени ключевые риски и возможности для сценария роста продаж."
                  : a.title === "Strategy AI"
                    ? "Сформулируй стратегические рекомендации по портфелю продуктов и рынкам."
                    : "Найди главные драйверы выручки и KPI, которые требуют внимания.")}
            >
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${a.color}`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
              </CardContent>
            </Card>
            </button>
          ))}
        </div>

        <Card className="flex flex-col" style={{ height: 520 }}>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">Sales Intelligence Assistant</CardTitle>
               <CardDescription className="text-xs">OpenRouter · бесплатная модель</CardDescription>
               </div>
               <Badge variant="secondary" className="ml-auto text-xs">{loading ? "Работает" : "Готов"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Analyzing…</span>
                </div>
              </div>
            )}
          </CardContent>
          <div className="border-t p-4">
            <div className="flex gap-2">
               <Textarea
                 data-testid="input-agent-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about KPIs, trends, forecasts, or strategy…"
                className="resize-none text-sm"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
              />
               <Button data-testid="button-send-agent" onClick={sendMessage} disabled={!prompt.trim() || loading} size="icon" className="self-end h-10 w-10">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
