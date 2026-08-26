import React, { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Globe2, MapPin, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useGetMapDrilldown, useListDatasets } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const demoCountries = [
  { id: "russia", label: "Россия", level: "country", value: 1840000, growthPct: 18.4, children: 5, lat: 61.5, lng: 105.3 },
  { id: "germany", label: "Германия", level: "country", value: 1260000, growthPct: 11.2, children: 4, lat: 51.2, lng: 10.4 },
  { id: "france", label: "Франция", level: "country", value: 980000, growthPct: 7.9, children: 3, lat: 46.2, lng: 2.2 },
  { id: "usa", label: "США", level: "country", value: 820000, growthPct: -2.1, children: 5, lat: 37.1, lng: -95.7 },
  { id: "china", label: "Китай", level: "country", value: 690000, growthPct: 22.5, children: 6, lat: 35.9, lng: 104.2 },
  { id: "uk", label: "Великобритания", level: "country", value: 540000, growthPct: 5.3, children: 2, lat: 55.4, lng: -3.4 },
];

const fmtMoney = (value: number) =>
  value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(1)}M` :
  value >= 1_000 ? `$${Math.round(value / 1_000)}K` : `$${Math.round(value)}`;

const countryPosition: Record<string, { left: number; top: number }> = {
  Россия: { left: 74, top: 30 }, Германия: { left: 48, top: 42 }, Франция: { left: 45, top: 49 },
  США: { left: 22, top: 55 }, Китай: { left: 76, top: 55 }, Великобритания: { left: 44, top: 35 },
};

export default function SalesMapPage() {
  const { isDemo } = useAuth();
  const { data: datasets = [] } = useListDatasets({ query: { enabled: !isDemo } as any });
  const [datasetId, setDatasetId] = useState(isDemo ? "demo-1" : "");
  const [metric, setMetric] = useState("revenue");
  const [level, setLevel] = useState("country");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const mapMutation = useGetMapDrilldown();

  useEffect(() => {
    if (!isDemo && datasets[0]?.id && !datasetId) setDatasetId(datasets[0].id);
  }, [datasets, datasetId, isDemo]);

  useEffect(() => {
    if (!datasetId || isDemo) return;
    void mapMutation.mutateAsync({ data: { datasetId, level, metric, parentCountry: level === "country" ? null : selectedCountry } });
  }, [datasetId, isDemo, level, metric, selectedCountry]);

  const items = isDemo ? demoCountries : (mapMutation.data?.items ?? []);
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const loading = !isDemo && mapMutation.isPending;

  const reload = () => {
    if (!datasetId || isDemo) return;
    void mapMutation.mutateAsync({ data: { datasetId, level, metric, parentCountry: level === "country" ? null : selectedCountry } });
  };

  const mapItems = useMemo(() => items.filter((item) => item.lat !== null && item.lng !== null), [items]);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Карта продаж</h1>
            <p className="text-sm text-muted-foreground mt-1">География выручки и динамика продаж по странам</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isDemo && datasets.length > 0 && <Select value={datasetId} onValueChange={setDatasetId}><SelectTrigger className="h-9 w-44 text-xs"><SelectValue placeholder="Набор данных" /></SelectTrigger><SelectContent>{datasets.map((dataset) => <SelectItem key={dataset.id} value={dataset.id}>{dataset.name}</SelectItem>)}</SelectContent></Select>}
            <Select value={metric} onValueChange={setMetric}><SelectTrigger className="h-9 w-36 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="revenue">Выручка</SelectItem><SelectItem value="grossProfit">Валовая прибыль</SelectItem><SelectItem value="ebitda">EBITDA</SelectItem><SelectItem value="units">Количество</SelectItem></SelectContent></Select>
            <Button variant="outline" size="icon" onClick={reload} disabled={loading}><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></Button>
          </div>
        </div>

        {!isDemo && datasets.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground"><Globe2 className="mx-auto mb-3 h-10 w-10 opacity-30" /><p className="font-medium">Нет наборов данных</p><p className="mt-1 text-sm">Загрузите данные, чтобы увидеть географию продаж.</p></CardContent></Card>}

        {(isDemo || datasets.length > 0) && <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Всего на карте</p><p className="mt-2 text-2xl font-bold">{fmtMoney(total)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Лидирующий рынок</p><p className="mt-2 text-2xl font-bold">{items[0]?.label ?? "—"}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Рынков</p><p className="mt-2 text-2xl font-bold">{items.length}</p></CardContent></Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-sm">Интерактивная карта</CardTitle><div className="flex items-center gap-2"><Select value={level} onValueChange={(value) => { setLevel(value); setSelectedCountry(null); }}><SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="country">Страны</SelectItem><SelectItem value="branch">Филиалы</SelectItem><SelectItem value="category">Категории</SelectItem></SelectContent></Select></div></CardHeader>
              <CardContent>
                <div className="relative h-[390px] overflow-hidden rounded-xl border bg-sky-500/[0.04]">
                  <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "10% 20%" }} />
                  <div className="absolute left-[8%] top-[39%] h-[29%] w-[22%] rounded-[45%] bg-emerald-500/10 blur-[2px]" />
                  <div className="absolute left-[38%] top-[29%] h-[25%] w-[27%] rounded-[50%] bg-emerald-500/10 blur-[2px]" />
                  <div className="absolute left-[65%] top-[36%] h-[29%] w-[25%] rounded-[45%] bg-emerald-500/10 blur-[2px]" />
                  <div className="absolute bottom-3 left-3 rounded-md bg-background/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">Размер точки = объём продаж</div>
                  {mapItems.map((item) => {
                    const pos = countryPosition[item.label] ?? { left: 50, top: 50 };
                    const size = 18 + Math.round((item.value / maxValue) * 28);
                    const growth = item.growthPct ?? null;
                    return <button key={item.id} onClick={() => setSelectedCountry(item.label)} className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary" style={{ left: `${pos.left}%`, top: `${pos.top}%` }}>
                      <span className="absolute inset-0 animate-pulse rounded-full bg-primary/20" style={{ transform: "scale(1.45)" }} />
                      <span className={cn("relative flex items-center justify-center rounded-full border-2 border-background bg-primary text-[9px] font-bold text-primary-foreground shadow-lg", growth !== null && growth < 0 && "bg-amber-500")} style={{ width: size, height: size }}><MapPin className="h-3 w-3" /></span>
                      <span className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] text-background shadow-lg group-hover:block">{item.label} · {fmtMoney(item.value)}</span>
                    </button>;
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Рейтинг рынков</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {items.map((item, index) => { const growth = item.growthPct ?? null; return <button key={item.id} onClick={() => setSelectedCountry(item.label)} className={cn("w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50", selectedCountry === item.label && "border-primary bg-primary/5")}>
                  <div className="flex items-center gap-2"><span className="w-5 text-xs font-bold text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><span className="flex-1 truncate text-xs font-semibold">{item.label}</span><Badge variant="outline" className={cn("text-[10px]", growth !== null && growth >= 0 ? "text-emerald-600" : "text-red-600")}>{growth !== null && growth >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}{growth === null ? "—" : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}</Badge></div>
                  <div className="mt-2 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(item.value / maxValue) * 100}%` }} /></div><span className="w-12 text-right text-xs font-bold">{fmtMoney(item.value)}</span></div>
                </button>; })}
              </CardContent>
            </Card>
          </div>
        </>}
      </div>
    </AppLayout>
  );
}