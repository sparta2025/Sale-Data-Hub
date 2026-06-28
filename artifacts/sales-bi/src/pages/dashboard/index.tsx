import React, { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Users, Target, BarChart2, Activity, ChevronRight,
  Download, RefreshCw, SlidersHorizontal,
  CheckCircle, AlertCircle, XCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const monthlyData = [
  { month: "Янв", revenue: 420000, gp: 168000, ebitda: 84000, orders: 1240 },
  { month: "Фев", revenue: 390000, gp: 156000, ebitda: 78000, orders: 1150 },
  { month: "Мар", revenue: 510000, gp: 204000, ebitda: 102000, orders: 1520 },
  { month: "Апр", revenue: 480000, gp: 192000, ebitda: 96000, orders: 1430 },
  { month: "Май", revenue: 560000, gp: 224000, ebitda: 112000, orders: 1670 },
  { month: "Июн", revenue: 620000, gp: 248000, ebitda: 124000, orders: 1840 },
  { month: "Июл", revenue: 590000, gp: 236000, ebitda: 118000, orders: 1760 },
  { month: "Авг", revenue: 650000, gp: 260000, ebitda: 130000, orders: 1930 },
  { month: "Сен", revenue: 680000, gp: 272000, ebitda: 136000, orders: 2010 },
  { month: "Окт", revenue: 720000, gp: 288000, ebitda: 144000, orders: 2140 },
  { month: "Ноя", revenue: 780000, gp: 312000, ebitda: 156000, orders: 2320 },
  { month: "Дек", revenue: 840000, gp: 336000, ebitda: 168000, orders: 2500 },
];

const categoryData = [
  { category: "Электроника", revenue: 2100000, gp: 840000 },
  { category: "Одежда", revenue: 1540000, gp: 770000 },
  { category: "Продукты", revenue: 980000, gp: 294000 },
  { category: "Дом и сад", revenue: 760000, gp: 304000 },
  { category: "Спорт", revenue: 520000, gp: 182000 },
  { category: "Прочее", revenue: 340000, gp: 136000 },
];

const topProducts = [
  { name: "Samsung Galaxy S24", revenue: 380000, margin: "32%", trend: +14 },
  { name: "Nike Air Max 2024", revenue: 220000, margin: "55%", trend: +8 },
  { name: "Apple AirPods Pro", revenue: 180000, margin: "41%", trend: -3 },
  { name: "Sony WH-1000XM5", revenue: 150000, margin: "38%", trend: +22 },
  { name: "Levi's 501 Jeans", revenue: 120000, margin: "62%", trend: +5 },
  { name: "Bosch Drill Set", revenue: 98000, margin: "44%", trend: -7 },
];

const kpiPanelData = [
  { label: "ROI", value: "28.4%", status: "good", change: "+3.2%" },
  { label: "NPS Score", value: "72", status: "good", change: "+5" },
  { label: "Churn Rate", value: "3.2%", status: "warn", change: "-0.4%" },
  { label: "LTV / CAC", value: "4.8×", status: "good", change: "+0.6" },
  { label: "Конверсия", value: "6.1%", status: "good", change: "+0.9%" },
  { label: "CAC", value: "$48", status: "warn", change: "+$12" },
  { label: "Avg Rep Sales", value: "$2.4M", status: "warn", change: "-8%" },
  { label: "Win Rate", value: "64%", status: "good", change: "+2%" },
  { label: "Sales Velocity", value: "$18K/d", status: "good", change: "+11%" },
];

const fmt = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}K`
  : `$${v}`;

function StatusIcon({ status }: { status: string }) {
  if (status === "good") return <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />;
  if (status === "warn") return <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
  return <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
}

function KpiCard({ label, value, change, icon: Icon, color }: {
  label: string; value: string; change: number; icon: React.ElementType; color: string;
}) {
  const isPos = change >= 0;
  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/30 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground leading-tight">{label}</p>
          <div className={cn("p-1.5 rounded-md bg-muted/60 group-hover:scale-110 transition-transform", color)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-xl font-bold tracking-tight mb-1">{value}</p>
        <div className={cn("flex items-center gap-1 text-xs font-medium", isPos ? "text-green-600" : "text-red-600")}>
          {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isPos ? "+" : ""}{change}%</span>
          <span className="text-muted-foreground font-normal ml-0.5">vs LY</span>
        </div>
      </CardContent>
    </Card>
  );
}

type ChartMetric = "revenue" | "gp" | "ebitda" | "orders";

export default function Dashboard() {
  const { t } = useI18n();
  const [chartMetric, setChartMetric] = useState<ChartMetric>("revenue");
  const [period, setPeriod] = useState("2024");
  const [kpiOpen, setKpiOpen] = useState(true);

  const scorecard = [
    { label: t("kpi.revenue"), value: "$6.24M", change: +12.4, icon: DollarSign, color: "text-blue-600" },
    { label: t("kpi.gp"), value: "$2.50M", change: +8.7, icon: TrendingUp, color: "text-green-600" },
    { label: t("kpi.ebitda"), value: "$1.24M", change: +15.2, icon: Activity, color: "text-purple-600" },
    { label: t("kpi.orders"), value: "20,510", change: +21.3, icon: ShoppingCart, color: "text-orange-600" },
    { label: t("kpi.aov"), value: "$304", change: -3.1, icon: Target, color: "text-pink-600" },
    { label: t("kpi.margin"), value: "40%", change: +1.2, icon: BarChart2, color: "text-teal-600" },
    { label: t("kpi.ebitdaMargin"), value: "20%", change: +0.8, icon: TrendingUp, color: "text-indigo-600" },
    { label: t("kpi.returning"), value: "68%", change: +4.5, icon: Users, color: "text-red-600" },
  ];

  const chartCfgMap: Record<ChartMetric, { key: string; color: string; name: string }> = {
    revenue: { key: "revenue", color: "#3b82f6", name: t("kpi.revenue") },
    gp: { key: "gp", color: "#10b981", name: t("kpi.gp") },
    ebitda: { key: "ebitda", color: "#8b5cf6", name: t("kpi.ebitda") },
    orders: { key: "orders", color: "#f59e0b", name: t("kpi.orders") },
  };
  const cfg = chartCfgMap[chartMetric];

  const tickFmt = (v: number) => chartMetric === "orders" ? v.toLocaleString() : fmt(v);
  const tooltipFmt = (v: number) => chartMetric === "orders" ? v.toLocaleString() : fmt(v);

  return (
    <AppLayout>
      <div className="flex gap-5 min-h-0">

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t("dash.title")}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dash.subtitle")} · Demo</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Обновить</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button
                variant={kpiOpen ? "secondary" : "outline"}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setKpiOpen((v) => !v)}
              >
                <SlidersHorizontal className="w-3 h-3" />
                KPI
              </Button>
            </div>
          </div>

          {/* KPI Scorecard */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {scorecard.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>

          {/* Charts */}
          <Tabs defaultValue="trend">
            <Card>
              <CardHeader className="pb-0 pt-4 px-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <TabsList className="h-8">
                    <TabsTrigger value="trend" className="text-xs px-3">{t("dash.trend")}</TabsTrigger>
                    <TabsTrigger value="categories" className="text-xs px-3">{t("dash.byCategory")}</TabsTrigger>
                    <TabsTrigger value="area" className="text-xs px-3">{t("dash.cumulative")}</TabsTrigger>
                  </TabsList>
                  <Select value={chartMetric} onValueChange={(v) => setChartMetric(v as ChartMetric)}>
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">{t("kpi.revenue")}</SelectItem>
                      <SelectItem value="gp">{t("kpi.gp")}</SelectItem>
                      <SelectItem value="ebitda">{t("kpi.ebitda")}</SelectItem>
                      <SelectItem value="orders">{t("kpi.orders")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="pt-3 px-2 pb-4">
                <TabsContent value="trend">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tickFormatter={tickFmt} tick={{ fontSize: 10 }} width={56} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        formatter={(v: unknown) => [tooltipFmt(v as number), cfg.name]} />
                      <Line type="monotone" dataKey={cfg.key} name={cfg.name}
                        stroke={cfg.color} strokeWidth={2.5} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="categories">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={90} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: unknown) => fmt(v as number)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="revenue" name={t("kpi.revenue")} fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="gp" name={t("kpi.gp")} fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="area">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ebitdaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={56} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: unknown) => fmt(v as number)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="revenue" name={t("kpi.revenue")} stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="ebitda" name={t("kpi.ebitda")} stroke="#8b5cf6" fill="url(#ebitdaGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>

          {/* Top Products */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">{t("dash.topProducts")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-1">
                {topProducts.map((p, i) => (
                  <div key={i}
                    className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                    <span className="text-xs text-muted-foreground w-4 text-right font-mono">{i + 1}</span>
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#14b8a6"][i] }} />
                    <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                    <span className="text-sm text-muted-foreground font-mono hidden sm:block">{fmt(p.revenue)}</span>
                    <Badge variant="secondary" className="text-xs font-mono px-1.5">{p.margin}</Badge>
                    <span className={cn("text-xs font-medium w-10 text-right",
                      p.trend >= 0 ? "text-green-600" : "text-red-600")}>
                      {p.trend >= 0 ? "+" : ""}{p.trend}%
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right KPI Panel ── */}
        {kpiOpen && (
          <div className="w-60 flex-shrink-0 hidden lg:block">
            <div className="sticky top-0 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t("dash.kpiPanel")}</h3>
                <Badge variant="outline" className="text-[10px] px-1.5">Live</Badge>
              </div>

              <Card>
                <CardContent className="p-2 space-y-0.5">
                  {kpiPanelData.map((kpi, i) => (
                    <div key={i}
                      className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <StatusIcon status={kpi.status} />
                        <span className="text-xs text-muted-foreground truncate">{kpi.label}</span>
                      </div>
                      <div className="flex flex-col items-end ml-2 flex-shrink-0">
                        <span className="text-xs font-bold tabular-nums">{kpi.value}</span>
                        <span className={cn("text-[10px] font-medium",
                          kpi.change.startsWith("-") ? "text-red-500" : "text-green-600")}>
                          {kpi.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Mini sparkline */}
              <Card>
                <CardHeader className="pb-1 pt-3 px-3">
                  <CardTitle className="text-xs text-muted-foreground">Выручка, 6 мес.</CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={monthlyData.slice(-6)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      <XAxis dataKey="month" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, padding: "3px 6px" }}
                        formatter={(v: unknown) => [fmt(v as number), ""]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Legend */}
              <div className="space-y-1 text-xs px-1">
                {[
                  { icon: <CheckCircle className="w-3.5 h-3.5 text-green-500" />, label: "Норма" },
                  { icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />, label: "Внимание" },
                  { icon: <XCircle className="w-3.5 h-3.5 text-red-500" />, label: "Критично" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    {icon}
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
