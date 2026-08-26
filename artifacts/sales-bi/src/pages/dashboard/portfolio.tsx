import React, { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowDownRight, ArrowUpRight, BarChart3, CircleDollarSign, RefreshCw, Target, TrendingUp } from "lucide-react";
import { useGetBcg, useGetEva, useGetPayback, useListDatasets } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const demoBcg = [
  { sku: "Galaxy S24", category: "Электроника", revCurrent: 380000, revPrev: 331000, growthYoy: 14.8, marketShare: 12.1, bcgQuadrant: "Stars" },
  { sku: "Air Max 2024", category: "Спорт", revCurrent: 220000, revPrev: 204000, growthYoy: 7.8, marketShare: 7.0, bcgQuadrant: "Cash Cows" },
  { sku: "AirPods Pro", category: "Электроника", revCurrent: 180000, revPrev: 185000, growthYoy: -2.7, marketShare: 5.7, bcgQuadrant: "Cash Cows" },
  { sku: "WH-1000XM5", category: "Электроника", revCurrent: 150000, revPrev: 123000, growthYoy: 22.0, marketShare: 4.8, bcgQuadrant: "Question Marks" },
  { sku: "Levi's 501", category: "Одежда", revCurrent: 120000, revPrev: 114000, growthYoy: 5.3, marketShare: 3.8, bcgQuadrant: "Dogs" },
  { sku: "Bosch Drill Set", category: "Дом и сад", revCurrent: 98000, revPrev: 105000, growthYoy: -6.7, marketShare: 3.1, bcgQuadrant: "Dogs" },
];

const demoEva = [
  { dimensions: { category: "Электроника" }, ebit: 620000, ic: 2100000, nopat: 465000, wacc: 0.08, waccIc: 168000, eva: 297000, evaPositive: true },
  { dimensions: { category: "Одежда" }, ebit: 310000, ic: 980000, nopat: 232500, wacc: 0.08, waccIc: 78400, eva: 154100, evaPositive: true },
  { dimensions: { category: "Дом и сад" }, ebit: 92000, ic: 460000, nopat: 69000, wacc: 0.08, waccIc: 36800, eva: 32200, evaPositive: true },
  { dimensions: { category: "Продукты" }, ebit: 48000, ic: 420000, nopat: 36000, wacc: 0.08, waccIc: 33600, eva: 2400, evaPositive: true },
];

const demoPayback = demoBcg.map((item) => ({
  sku: item.sku,
  gpAnnual: item.revCurrent * 0.4,
  ic: item.revCurrent * 1.2,
  paybackYears: 3.0,
  bcgQuadrant: item.bcgQuadrant,
}));

const fmtMoney = (value: number) =>
  value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(1)}M` :
  value >= 1_000 ? `$${Math.round(value / 1_000)}K` : `$${Math.round(value)}`;

const fmtPct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

function quadrantLabel(quadrant: string) {
  return ({ Stars: "Звёзды", "Cash Cows": "Дойные коровы", "Question Marks": "Трудные дети", Dogs: "Собаки" } as Record<string, string>)[quadrant] ?? quadrant;
}

function quadrantClass(quadrant: string) {
  return quadrant === "Stars" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
    quadrant === "Cash Cows" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
    quadrant === "Question Marks" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
    "bg-slate-500/10 text-slate-600 border-slate-500/20";
}

export default function PortfolioPage() {
  const { isDemo } = useAuth();
  const { data: datasets = [] } = useListDatasets({ query: { enabled: !isDemo } as any });
  const [datasetId, setDatasetId] = useState(isDemo ? "demo-1" : "");
  const bcgMutation = useGetBcg();
  const evaMutation = useGetEva();
  const paybackMutation = useGetPayback();

  useEffect(() => {
    if (!isDemo && datasets[0]?.id && !datasetId) setDatasetId(datasets[0].id);
  }, [datasets, datasetId, isDemo]);

  useEffect(() => {
    if (!datasetId || isDemo) return;
    void Promise.all([
      bcgMutation.mutateAsync({ data: { datasetId } }),
      evaMutation.mutateAsync({ data: { datasetId, groupBy: ["category"] } }),
      paybackMutation.mutateAsync({ data: { datasetId } }),
    ]);
  }, [datasetId, isDemo]);

  const bcg = isDemo ? demoBcg : (bcgMutation.data?.items ?? []);
  const eva = isDemo ? demoEva : (evaMutation.data?.rows ?? []);
  const payback = isDemo ? demoPayback : (paybackMutation.data?.rows ?? []);
  const loading = !isDemo && (bcgMutation.isPending || evaMutation.isPending || paybackMutation.isPending);
  const [selectedQuadrant, setSelectedQuadrant] = useState("all");
  const filteredBcg = useMemo(() => selectedQuadrant === "all" ? bcg : bcg.filter((item) => item.bcgQuadrant === selectedQuadrant), [bcg, selectedQuadrant]);
  const avgPayback = isDemo ? 3.0 : paybackMutation.data?.avgPayback ?? 0;
  const totalEva = isDemo ? demoEva.reduce((sum, row) => sum + row.eva, 0) : evaMutation.data?.totalEva ?? 0;

  const reload = () => {
    if (!datasetId || isDemo) return;
    void Promise.all([
      bcgMutation.mutateAsync({ data: { datasetId } }),
      evaMutation.mutateAsync({ data: { datasetId, groupBy: ["category"] } }),
      paybackMutation.mutateAsync({ data: { datasetId } }),
    ]);
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Портфель</h1>
            <p className="text-sm text-muted-foreground mt-1">BCG-анализ, экономическая добавленная стоимость и окупаемость продуктов</p>
          </div>
          <div className="flex items-center gap-2">
            {!isDemo && datasets.length > 0 && (
              <Select value={datasetId} onValueChange={setDatasetId}>
                <SelectTrigger className="h-9 w-48 text-xs"><SelectValue placeholder="Выберите набор данных" /></SelectTrigger>
                <SelectContent>{datasets.map((dataset) => <SelectItem key={dataset.id} value={dataset.id}>{dataset.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {!isDemo && <Button variant="outline" size="icon" onClick={reload} disabled={loading}><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /></Button>}
          </div>
        </div>

        {!isDemo && datasets.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <BarChart3 className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="font-medium">Нет наборов данных</p>
            <p className="mt-1 text-sm">Загрузите Excel или CSV в разделе «Данные», чтобы построить портфельный анализ.</p>
          </CardContent></Card>
        )}

        {(isDemo || datasets.length > 0) && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Продуктов в портфеле", value: String(bcg.length), icon: Target, color: "text-blue-600" },
                { label: "Создают стоимость", value: String(eva.filter((row) => row.evaPositive).length), icon: TrendingUp, color: "text-emerald-600" },
                { label: "Общая EVA", value: fmtMoney(totalEva), icon: CircleDollarSign, color: "text-violet-600" },
                { label: "Средняя окупаемость", value: `${avgPayback.toFixed(1)} года`, icon: RefreshCw, color: "text-amber-600" },
              ].map((stat) => (
                <Card key={stat.label}><CardContent className="p-4">
                  <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{stat.label}</span><stat.icon className={cn("h-4 w-4", stat.color)} /></div>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                </CardContent></Card>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm">BCG-матрица продуктов</CardTitle>
                  <Select value={selectedQuadrant} onValueChange={setSelectedQuadrant}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все квадранты</SelectItem>
                      <SelectItem value="Stars">Звёзды</SelectItem>
                      <SelectItem value="Cash Cows">Дойные коровы</SelectItem>
                      <SelectItem value="Question Marks">Трудные дети</SelectItem>
                      <SelectItem value="Dogs">Собаки</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-5 h-64 overflow-hidden rounded-xl border bg-muted/20">
                    <div className="absolute inset-x-1/2 top-0 bottom-0 border-l border-dashed border-border" />
                    <div className="absolute inset-y-1/2 left-0 right-0 border-t border-dashed border-border" />
                    <span className="absolute left-3 top-2 text-[10px] font-medium text-muted-foreground">Высокий рост</span>
                    <span className="absolute bottom-2 left-3 text-[10px] font-medium text-muted-foreground">Низкий рост</span>
                    <span className="absolute right-3 top-2 text-[10px] font-medium text-muted-foreground">Высокая доля</span>
                    {filteredBcg.map((item, index) => {
                      const x = Math.min(88, Math.max(10, item.marketShare * 6 + 8));
                      const y = Math.min(88, Math.max(10, 52 - (item.growthYoy ?? 0) * 1.8));
                      return <div key={item.sku} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
                        <div className={cn("h-4 w-4 rounded-full border-2 border-background shadow-md transition-transform group-hover:scale-150", item.bcgQuadrant === "Stars" ? "bg-blue-500" : item.bcgQuadrant === "Cash Cows" ? "bg-emerald-500" : item.bcgQuadrant === "Question Marks" ? "bg-amber-500" : "bg-slate-400")} />
                        <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">{item.sku}</div>
                      </div>;
                    })}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {filteredBcg.map((item) => <div key={item.sku} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className={cn("h-2.5 w-2.5 rounded-full", item.bcgQuadrant === "Stars" ? "bg-blue-500" : item.bcgQuadrant === "Cash Cows" ? "bg-emerald-500" : item.bcgQuadrant === "Question Marks" ? "bg-amber-500" : "bg-slate-400")} />
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{item.sku}</p><p className="text-[11px] text-muted-foreground">{item.category} · {fmtMoney(item.revCurrent)}</p></div>
                      <span className={cn("text-xs font-medium", (item.growthYoy ?? 0) >= 0 ? "text-emerald-600" : "text-red-600")}>{fmtPct(item.growthYoy ?? 0)}</span>
                    </div>)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">EVA по категориям</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {eva.map((row, index) => {
                    const dimensions = row.dimensions as Record<string, unknown>;
                    const name = String(dimensions.category ?? dimensions.sku ?? `Группа ${index + 1}`);
                    return <div key={`${name}-${index}`} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold">{name}</span><Badge variant="outline" className={cn("text-[10px]", row.evaPositive ? "border-emerald-500/30 text-emerald-600" : "border-red-500/30 text-red-600")}>{row.evaPositive ? "Создаёт" : "Разрушает"}</Badge></div>
                      <div className="flex items-end justify-between"><span className="text-xs text-muted-foreground">NOPAT {fmtMoney(row.nopat)}</span><span className={cn("text-lg font-bold", row.evaPositive ? "text-emerald-600" : "text-red-600")}>{row.eva >= 0 ? "+" : ""}{fmtMoney(row.eva)}</span></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", row.evaPositive ? "bg-emerald-500" : "bg-red-500")} style={{ width: `${Math.min(100, Math.max(5, Math.abs(row.eva) / Math.max(1, Math.abs(totalEva)) * 100))}%` }} /></div>
                    </div>;
                  })}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-sm">Срок окупаемости инвестированного капитала</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="pb-3 font-medium">Продукт</th><th className="pb-3 font-medium">Валовая прибыль / год</th><th className="pb-3 font-medium">Инвестированный капитал</th><th className="pb-3 text-right font-medium">Окупаемость</th></tr></thead><tbody>
                  {payback.slice(0, 8).map((row) => { const years = row.paybackYears ?? null; return <tr key={row.sku} className="border-b last:border-0"><td className="py-3 font-medium">{row.sku}</td><td className="py-3 text-muted-foreground">{fmtMoney(row.gpAnnual)}</td><td className="py-3 text-muted-foreground">{fmtMoney(row.ic)}</td><td className="py-3 text-right"><span className={cn("inline-flex items-center gap-1 font-semibold", years !== null && years <= 3 ? "text-emerald-600" : "text-amber-600")}>{years === null ? "—" : `${years.toFixed(1)} года`}</span></td></tr>; })}
                </tbody></table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}