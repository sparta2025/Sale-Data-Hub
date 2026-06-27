import React, { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, TrendingUp, Search, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message { role: "user" | "assistant"; content: string; }

export default function AgentsPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI Sales Analyst. I can analyze your KPIs, identify trends, run scenario analysis, and provide strategic recommendations. What would you like to explore?\n\nExample queries:\n• \"What are the main revenue growth drivers?\"\n• \"Which product categories are underperforming?\"\n• \"Generate a 12-month sales forecast\"\n• \"Compare Q3 vs Q4 performance\"",
    }
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!prompt.trim() || loading) return;
    const userMsg = prompt.trim();
    setPrompt("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("sbi_token");
      const res = await fetch("/api/agents/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ datasetId: "demo", prompt: userMsg, language: "en" }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.result ?? data.insights ?? JSON.stringify(data, null, 2),
      }]);
    } catch {
      toast({ title: "Agent error", description: "Unable to reach AI agent", variant: "destructive" });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm currently running in demo mode. In production, I'll analyze your actual sales data using Claude AI.\n\n**Demo insight:** Based on typical patterns, Q4 shows 25-35% higher revenue than Q1. Gross profit margins tend to compress in high-volume periods due to promotional pricing. I recommend focusing on high-margin SKUs during peak seasons.",
      }]);
    } finally {
      setLoading(false);
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
            <Card key={a.title} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${a.color}`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
              </CardContent>
            </Card>
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
                <CardDescription className="text-xs">Powered by Claude AI</CardDescription>
              </div>
              <Badge variant="secondary" className="ml-auto text-xs">Demo</Badge>
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
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about KPIs, trends, forecasts, or strategy…"
                className="resize-none text-sm"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
              />
              <Button onClick={sendMessage} disabled={!prompt.trim() || loading} size="icon" className="self-end h-10 w-10">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
