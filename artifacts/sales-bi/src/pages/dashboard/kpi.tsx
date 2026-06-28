import React, { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { CheckCircle, AlertCircle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const kpiGroups = [
  {
    title: "Выручка и прибыль",
    kpis: [
      { name: "Revenue Net", value: "$6.24M", target: "$6.00M", actual: 6.24, tgt: 6.0, unit: "M", change: +12.4, status: "good" },
      { name: "Gross Profit", value: "$2.50M", target: "$2.40M", actual: 2.50, tgt: 2.4, unit: "M", change: +8.7, status: "good" },
      { name: "EBITDA", value: "$1.24M", target: "$1.10M", actual: 1.24, tgt: 1.1, unit: "M", change: +15.2, status: "good" },
      { name: "Net Profit", value: "$0.87M", target: "$0.90M", actual: 0.87, tgt: 0.9, unit: "M", change: -3.3, status: "warn" },
    ]
  },
  {
    title: "Маржинальность",
    kpis: [
      { name: "GP Margin", value: "40.1%", target: "40%", actual: 40.1, tgt: 40, unit: "%", change: +1.2, status: "good" },
      { name: "EBITDA Margin", value: "19.9%", target: "20%", actual: 19.9, tgt: 20, unit: "%", change: +0.8, status: "good" },
      { name: "Net Margin", value: "13.9%", target: "15%", actual: 13.9, tgt: 15, unit: "%", change: -1.1, status: "warn" },
      { name: "Contribution Margin", value: "52.3%", target: "50%", actual: 52.3, tgt: 50, unit: "%", change: +2.3, status: "good" },
    ]
  },
  {
    title: "Продажи и клиенты",
    kpis: [
      { name: "Orders", value: "20,510", target: "19,000", actual: 20510, tgt: 19000, unit: "", change: +21.3, status: "good" },
      { name: "Avg Order Value", value: "$304", target: "$320", actual: 304, tgt: 320, unit: "$", change: -3.1, status: "warn" },
      { name: "Returning Customers", value: "68%", target: "65%", actual: 68, tgt: 65, unit: "%", change: +4.5, status: "good" },
      { name: "Conversion Rate", value: "6.1%", target: "5.5%", actual: 6.1, tgt: 5.5, unit: "%", change: +0.9, status: "good" },
    ]
  },
  {
    title: "Операционные",
    kpis: [
      { name: "ROI", value: "28.4%", target: "25%", actual: 28.4, tgt: 25, unit: "%", change: +3.2, status: "good" },
      { name: "CAC", value: "$48", target: "$45", actual: 48, tgt: 45, unit: "$", change: +6.7, status: "warn" },
      { name: "LTV/CAC", value: "4.8×", target: "4.0×", actual: 4.8, tgt: 4.0, unit: "×", change: +20, status: "good" },
      { name: "Churn Rate", value: "3.2%", target: "3%", actual: 3.2, tgt: 3.0, unit: "%", change: +0.2, status: "warn" },
    ]
  }
];

const radarData = [
  { metric: "Выручка", score: 88 },
  { metric: "Маржа", score: 78 },
  { metric: "Рост", score: 92 },
  { metric: "Операц.", score: 71 },
  { metric: "Клиенты", score: 85 },
  { metric: "Прогноз", score: 80 },
];

const attainmentData = kpiGroups.flatMap(g =>
  g.kpis.map(k => ({
    name: k.name,
    attainment: Math.min(150, Math.round((k.actual / k.tgt) * 100)),
    status: k.status,
  }))
);

function StatusIcon({ s }: { s: string }) {
  if (s === "good") return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (s === "warn") return <AlertCircle className="w-4 h-4 text-amber-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

export default function KpiAnalyticsPage() {
  const { t } = useI18n();
  const [period, setPeriod] = useState("2024");

  const good = attainmentData.filter(d => d.status === "good").length;
  const warn = attainmentData.filter(d => d.status === "warn").length;
  const bad = attainmentData.filter(d => d.status === "bad").length;

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t("nav.kpi")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">16 метрик · Demo Dataset</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="font-semibold">{good}</span>
            <span className="text-muted-foreground">в норме</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">{warn}</span>
            <span className="text-muted-foreground">внимание</span>
          </div>
          {bad > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="font-semibold">{bad}</span>
              <span className="text-muted-foreground">критично</span>
            </div>
          )}
        </div>

        {/* Charts row */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">KPI Радар</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Выполнение плана (%)</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={attainmentData.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" domain={[0, 150]} tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(v: unknown) => [`${v}%`, "Выполнение"]} />
                  <Bar dataKey="attainment" radius={[0, 4, 4, 0]}
                    fill="#3b82f6"
                    label={{ position: "right", fontSize: 10, formatter: (v: number) => `${v}%` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* KPI Groups */}
        <div className="grid gap-4 md:grid-cols-2">
          {kpiGroups.map((group) => (
            <Card key={group.title}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {group.kpis.map((kpi) => {
                    const pct = Math.round((kpi.actual / kpi.tgt) * 100);
                    return (
                      <div key={kpi.name} className="flex items-center gap-3 py-1 group cursor-pointer hover:bg-muted/40 rounded-lg px-2 -mx-2 transition-colors">
                        <StatusIcon s={kpi.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate">{kpi.name}</span>
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                              <span className="text-xs font-bold">{kpi.value}</span>
                              <span className={cn("text-[10px] font-medium", kpi.change >= 0 ? "text-green-600" : "text-red-600")}>
                                {kpi.change >= 0 ? <TrendingUp className="w-2.5 h-2.5 inline" /> : <TrendingDown className="w-2.5 h-2.5 inline" />}
                                {" "}{kpi.change >= 0 ? "+" : ""}{kpi.change}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", kpi.status === "good" ? "bg-green-500" : kpi.status === "warn" ? "bg-amber-500" : "bg-red-500")}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
