import React, { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useGetKpiSummary, useGetKpiScorecard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Users, Target, BarChart2, Activity
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DEMO_DATASET_ID = "demo";

const demoKpiData = [
  { month: "Jan", revenue: 420000, gp: 168000, ebitda: 84000, orders: 1240 },
  { month: "Feb", revenue: 390000, gp: 156000, ebitda: 78000, orders: 1150 },
  { month: "Mar", revenue: 510000, gp: 204000, ebitda: 102000, orders: 1520 },
  { month: "Apr", revenue: 480000, gp: 192000, ebitda: 96000, orders: 1430 },
  { month: "May", revenue: 560000, gp: 224000, ebitda: 112000, orders: 1670 },
  { month: "Jun", revenue: 620000, gp: 248000, ebitda: 124000, orders: 1840 },
  { month: "Jul", revenue: 590000, gp: 236000, ebitda: 118000, orders: 1760 },
  { month: "Aug", revenue: 650000, gp: 260000, ebitda: 130000, orders: 1930 },
  { month: "Sep", revenue: 680000, gp: 272000, ebitda: 136000, orders: 2010 },
  { month: "Oct", revenue: 720000, gp: 288000, ebitda: 144000, orders: 2140 },
  { month: "Nov", revenue: 780000, gp: 312000, ebitda: 156000, orders: 2320 },
  { month: "Dec", revenue: 840000, gp: 336000, ebitda: 168000, orders: 2500 },
];

const demoScorecard = [
  { label: "Revenue Net", value: "$6.24M", change: +12.4, icon: DollarSign, color: "text-blue-600" },
  { label: "Gross Profit", value: "$2.50M", change: +8.7, icon: TrendingUp, color: "text-green-600" },
  { label: "EBITDA", value: "$1.24M", change: +15.2, icon: Activity, color: "text-purple-600" },
  { label: "Orders", value: "20,510", change: +21.3, icon: ShoppingCart, color: "text-orange-600" },
  { label: "Avg Order Value", value: "$304", change: -3.1, icon: Target, color: "text-pink-600" },
  { label: "GP Margin", value: "40%", change: +1.2, icon: BarChart2, color: "text-teal-600" },
  { label: "EBITDA Margin", value: "20%", change: +0.8, icon: TrendingUp, color: "text-indigo-600" },
  { label: "Return Customers", value: "68%", change: +4.5, icon: Users, color: "text-red-600" },
];

const demoCategoryData = [
  { category: "Electronics", revenue: 2100000, gp: 840000 },
  { category: "Clothing", revenue: 1540000, gp: 770000 },
  { category: "Food", revenue: 980000, gp: 294000 },
  { category: "Home", revenue: 760000, gp: 304000 },
  { category: "Sports", revenue: 520000, gp: 182000 },
  { category: "Other", revenue: 340000, gp: 136000 },
];

function KpiCard({ label, value, change, icon: Icon, color }: any) {
  const isPositive = change >= 0;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={cn("p-2 rounded-lg bg-muted/50", color)}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium", isPositive ? "text-green-600" : "text-red-600")}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isPositive ? "+" : ""}{change}% vs last year</span>
        </div>
      </CardContent>
    </Card>
  );
}

const fmt = (v: number) => v >= 1_000_000
  ? `$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}K` : `$${v}`;

export default function Dashboard() {
  const { t } = useI18n();
  const [chartView, setChartView] = useState<"revenue" | "gp" | "ebitda" | "orders">("revenue");

  const chartConfig: Record<string, { key: string; color: string; name: string }> = {
    revenue: { key: "revenue", color: "#3b82f6", name: "Revenue Net" },
    gp: { key: "gp", color: "#10b981", name: "Gross Profit" },
    ebitda: { key: "ebitda", color: "#8b5cf6", name: "EBITDA" },
    orders: { key: "orders", color: "#f59e0b", name: "Orders" },
  };

  const cfg = chartConfig[chartView];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
            <p className="text-sm text-muted-foreground">Full Year 2024 · Demo Dataset</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Demo Mode</Badge>
            <Select defaultValue="2024">
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Scorecard Grid */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {demoScorecard.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Charts */}
        <Tabs defaultValue="trend">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="trend">Trend</TabsTrigger>
              <TabsTrigger value="categories">By Category</TabsTrigger>
              <TabsTrigger value="area">Cumulative</TabsTrigger>
            </TabsList>
            <Select value={chartView} onValueChange={(v) => setChartView(v as any)}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue Net</SelectItem>
                <SelectItem value="gp">Gross Profit</SelectItem>
                <SelectItem value="ebitda">EBITDA</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="trend">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{cfg.name} by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={demoKpiData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={chartView === "orders" ? (v) => v.toLocaleString() : fmt} tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v: any) => chartView === "orders" ? v.toLocaleString() : fmt(v)} />
                    <Line
                      type="monotone" dataKey={cfg.key} name={cfg.name}
                      stroke={cfg.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue vs GP by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={demoCategoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="gp" name="Gross Profit" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="area">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue & EBITDA — Cumulative</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={demoKpiData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ebitdaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="ebitda" name="EBITDA" stroke="#8b5cf6" fill="url(#ebitdaGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom row: KPI side panel hint */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Samsung Galaxy S24", revenue: 380000, gp_margin: "32%" },
                  { name: "Nike Air Max", revenue: 220000, gp_margin: "55%" },
                  { name: "Apple AirPods Pro", revenue: 180000, gp_margin: "41%" },
                  { name: "Sony WH-1000XM5", revenue: 150000, gp_margin: "38%" },
                  { name: "Levi's 501 Jeans", revenue: 120000, gp_margin: "62%" },
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5">{i + 1}.</span>
                      <span className="font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{fmt(p.revenue)}</span>
                      <Badge variant="secondary" className="font-mono text-xs">{p.gp_margin}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">KPI Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "ROI", value: "28.4%", status: "good" },
                  { label: "NPS Score", value: "72", status: "good" },
                  { label: "Churn Rate", value: "3.2%", status: "warning" },
                  { label: "LTV/CAC", value: "4.8×", status: "good" },
                  { label: "Conversion", value: "6.1%", status: "good" },
                  { label: "Avg. Rep Sales", value: "$2.4M", status: "warning" },
                ].map((kpi, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{kpi.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{kpi.value}</span>
                      <div className={cn("w-2 h-2 rounded-full", kpi.status === "good" ? "bg-green-500" : "bg-yellow-500")} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
