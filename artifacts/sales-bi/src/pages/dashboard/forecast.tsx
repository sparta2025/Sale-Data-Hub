import React, { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ComposedChart, Line, Area, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const historicalData = [
  { month: "Янв", actual: 420, forecast: null, lower: null, upper: null },
  { month: "Фев", actual: 390, forecast: null, lower: null, upper: null },
  { month: "Мар", actual: 510, forecast: null, lower: null, upper: null },
  { month: "Апр", actual: 480, forecast: null, lower: null, upper: null },
  { month: "Май", actual: 560, forecast: null, lower: null, upper: null },
  { month: "Июн", actual: 620, forecast: null, lower: null, upper: null },
  { month: "Июл", actual: 590, forecast: null, lower: null, upper: null },
  { month: "Авг", actual: 650, forecast: null, lower: null, upper: null },
  { month: "Сен", actual: 680, forecast: null, lower: null, upper: null },
  { month: "Окт", actual: 720, forecast: null, lower: null, upper: null },
  { month: "Ноя", actual: 780, forecast: null, lower: null, upper: null },
  { month: "Дек", actual: 840, forecast: 840, lower: 800, upper: 880 },
  { month: "Янв+", actual: null, forecast: 890, lower: 840, upper: 940 },
  { month: "Фев+", actual: null, forecast: 860, lower: 800, upper: 920 },
  { month: "Мар+", actual: null, forecast: 970, lower: 900, upper: 1040 },
  { month: "Апр+", actual: null, forecast: 930, lower: 860, upper: 1000 },
  { month: "Май+", actual: null, forecast: 1050, lower: 970, upper: 1130 },
  { month: "Июн+", actual: null, forecast: 1120, lower: 1030, upper: 1210 },
];

const forecastSummary = [
  { label: "Прогноз выручки (H1 25)", value: "$5.82M", change: "+13.4%", positive: true },
  { label: "Прогноз EBITDA (H1 25)", value: "$1.16M", change: "+11.8%", positive: true },
  { label: "CAGR (2Y)", value: "18.2%", change: null, positive: true },
  { label: "Точность модели (MAE)", value: "4.2%", change: null, positive: true },
];

const seasonality = [
  { month: "Янв", index: 0.82 }, { month: "Фев", index: 0.79 },
  { month: "Мар", index: 0.98 }, { month: "Апр", index: 0.95 },
  { month: "Май", index: 1.06 }, { month: "Июн", index: 1.16 },
  { month: "Июл", index: 1.11 }, { month: "Авг", index: 1.19 },
  { month: "Сен", index: 1.22 }, { month: "Окт", index: 1.28 },
  { month: "Ноя", index: 1.35 }, { month: "Дек", index: 1.44 },
];

export default function ForecastPage() {
  const { t } = useI18n();
  const [metric, setMetric] = useState("revenue");
  const [horizon, setHorizon] = useState("6m");

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t("nav.forecast")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Трендовый прогноз с сезонностью · Demo Dataset</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Выручка</SelectItem>
                <SelectItem value="gp">Валовая прибыль</SelectItem>
                <SelectItem value="orders">Заказы</SelectItem>
              </SelectContent>
            </Select>
            <Select value={horizon} onValueChange={setHorizon}>
              <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 мес.</SelectItem>
                <SelectItem value="6m">6 мес.</SelectItem>
                <SelectItem value="12m">12 мес.</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {forecastSummary.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
                {s.change && (
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs font-medium text-green-600">{s.change}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main forecast chart */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Прогноз выручки (тыс. $)</CardTitle>
              <Badge variant="secondary" className="text-xs gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                MAE 4.2%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} width={50} tickLine={false} tickFormatter={(v) => `$${v}K`} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v: unknown, name: string) => [`$${v}K`, name]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine x="Дек" stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "Сейчас", fontSize: 10 }} />
                <Area dataKey="upper" name="Верхняя граница" fill="#3b82f6" fillOpacity={0.1} stroke="transparent" legendType="none" />
                <Area dataKey="lower" name="Нижняя граница" fill="#ffffff" fillOpacity={1} stroke="transparent" legendType="none" />
                <Line type="monotone" dataKey="actual" name="Факт" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls={false} />
                <Line type="monotone" dataKey="forecast" name="Прогноз" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Seasonality */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Сезонные индексы</CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Лето — сезонный спад
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={140}>
              <ComposedChart data={seasonality} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis domain={[0.6, 1.6]} tick={{ fontSize: 10 }} tickLine={false} width={36} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: unknown) => [`${v}`, "Индекс"]} />
                <ReferenceLine y={1.0} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "1.0", fontSize: 9, position: "right" }} />
                <Bar dataKey="index" name="Сезонный индекс" fill="#3b82f6" radius={[3, 3, 0, 0]}
                  label={{ position: "top", fontSize: 8, formatter: (v: number) => v.toFixed(2) }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
