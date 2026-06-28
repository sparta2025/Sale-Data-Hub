import React, { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, Play } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const BASE = {
  revenue: 6240,
  gp: 2496,
  ebitda: 1248,
  orders: 20510,
};

function calcScenario(params: { priceChange: number; volumeChange: number; costChange: number }) {
  const { priceChange, volumeChange, costChange } = params;
  const revenueMultiplier = (1 + priceChange / 100) * (1 + volumeChange / 100);
  const revenue = Math.round(BASE.revenue * revenueMultiplier);
  const costMultiplier = 1 + costChange / 100;
  const gp = Math.round(revenue - BASE.revenue * (1 - BASE.gp / BASE.revenue) * costMultiplier);
  const ebitda = Math.round(gp * (BASE.ebitda / BASE.gp) * (1 - costChange / 100 * 0.3));
  const orders = Math.round(BASE.orders * (1 + volumeChange / 100));
  return { revenue, gp, ebitda, orders };
}

const PRESETS = [
  { name: "Пессимистичный", price: -5, volume: -10, cost: 5, color: "text-red-600" },
  { name: "Базовый", price: 0, volume: 0, cost: 0, color: "text-muted-foreground" },
  { name: "Оптимистичный", price: 5, volume: 10, cost: -3, color: "text-green-600" },
  { name: "Агрессивный рост", price: 8, volume: 20, cost: 2, color: "text-blue-600" },
];

function fmtK(v: number) { return `$${(v / 1000).toFixed(1)}M`; }

export default function ScenarioPage() {
  const { t } = useI18n();
  const [priceChange, setPriceChange] = useState(0);
  const [volumeChange, setVolumeChange] = useState(0);
  const [costChange, setCostChange] = useState(0);

  const result = calcScenario({ priceChange, volumeChange, costChange });

  const metrics = [
    { label: "Выручка", base: BASE.revenue, result: result.revenue, good: result.revenue >= BASE.revenue },
    { label: "Валовая прибыль", base: BASE.gp, result: result.gp, good: result.gp >= BASE.gp },
    { label: "EBITDA", base: BASE.ebitda, result: result.ebitda, good: result.ebitda >= BASE.ebitda },
    { label: "Заказы", base: BASE.orders, result: result.orders, good: result.orders >= BASE.orders },
  ];

  const chartData = [
    { name: "Базовый", revenue: BASE.revenue, gp: BASE.gp, ebitda: BASE.ebitda },
    { name: "Сценарий", revenue: result.revenue, gp: result.gp, ebitda: result.ebitda },
  ];

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setPriceChange(preset.price);
    setVolumeChange(preset.volume);
    setCostChange(preset.cost);
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t("nav.scenario")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Моделирование сценариев · Demo Dataset</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
            onClick={() => { setPriceChange(0); setVolumeChange(0); setCostChange(0); }}>
            <RefreshCw className="w-3 h-3" />
            Сброс
          </Button>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Готовые сценарии:</span>
          {PRESETS.map((p) => (
            <Button key={p.name} variant="outline" size="sm" className={cn("h-7 text-xs", p.color)}
              onClick={() => applyPreset(p)}>
              {p.name}
            </Button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Controls */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Параметры сценария</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Изменение цен</label>
                  <Badge variant={priceChange >= 0 ? "default" : "destructive"} className="font-mono text-xs">
                    {priceChange >= 0 ? "+" : ""}{priceChange}%
                  </Badge>
                </div>
                <Slider
                  value={[priceChange]}
                  onValueChange={(v) => setPriceChange(v[0])}
                  min={-30} max={30} step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>−30%</span>
                  <span>0</span>
                  <span>+30%</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Изменение объёма</label>
                  <Badge variant={volumeChange >= 0 ? "default" : "destructive"} className="font-mono text-xs">
                    {volumeChange >= 0 ? "+" : ""}{volumeChange}%
                  </Badge>
                </div>
                <Slider
                  value={[volumeChange]}
                  onValueChange={(v) => setVolumeChange(v[0])}
                  min={-30} max={50} step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>−30%</span>
                  <span>0</span>
                  <span>+50%</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Изменение затрат</label>
                  <Badge variant={costChange <= 0 ? "default" : "destructive"} className="font-mono text-xs">
                    {costChange >= 0 ? "+" : ""}{costChange}%
                  </Badge>
                </div>
                <Slider
                  value={[costChange]}
                  onValueChange={(v) => setCostChange(v[0])}
                  min={-20} max={30} step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>−20%</span>
                  <span>0</span>
                  <span>+30%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Результаты сценария</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {metrics.map((m) => {
                    const delta = ((m.result - m.base) / m.base) * 100;
                    return (
                      <div key={m.label} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="text-sm text-muted-foreground">{m.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground font-mono">{fmtK(m.base)}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-sm font-bold">{fmtK(m.result)}</span>
                          <span className={cn("text-xs font-medium flex items-center gap-0.5 w-14 justify-end",
                            delta >= 0 ? "text-green-600" : "text-red-600")}>
                            {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">База vs Сценарий</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}M`} tick={{ fontSize: 10 }} width={48} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: unknown) => fmtK(v as number)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="revenue" name="Выручка" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="gp" name="GP" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="ebitda" name="EBITDA" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
