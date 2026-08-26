import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ArrowDown, ArrowUp, Minus, RefreshCw } from "lucide-react";
import { useGetKpiCompare, useListDatasets } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const demoItems = [
  { label: "Германия", valueA: 1840000, valueB: 2180000, delta: 340000, deltaPct: 18.5 },
  { label: "Франция", valueA: 1420000, valueB: 1510000, delta: 90000, deltaPct: 6.3 },
  { label: "Польша", valueA: 980000, valueB: 1240000, delta: 260000, deltaPct: 26.5 },
  { label: "Италия", valueA: 1160000, valueB: 1030000, delta: -130000, deltaPct: -11.2 },
  { label: "Испания", valueA: 760000, valueB: 910000, delta: 150000, deltaPct: 19.7 },
  { label: "Нидерланды", valueA: 640000, valueB: 590000, delta: -50000, deltaPct: -7.8 },
];

const metricOptions = [
  { value: "revenue", label: "Выручка" },
  { value: "grossProfit", label: "Валовая прибыль" },
  { value: "ebitda", label: "EBITDA" },
  { value: "netProfit", label: "Чистая прибыль" },
  { value: "units", label: "Проданные единицы" },
];

const dimensionOptions = [
  { value: "country", label: "Страны" },
  { value: "category", label: "Категории" },
  { value: "branch", label: "Филиалы" },
  { value: "sku", label: "SKU" },
];

function formatMoney(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M €`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K €`;
  return `${value.toFixed(0)} €`;
}

function formatValue(value: number, metric: string) {
  return metric === "units" ? value.toLocaleString("ru-RU") : formatMoney(value);
}

export default function ComparePage() {
  const { isDemo } = useAuth();
  const { toast } = useToast();
  const { data: datasets = [] } = useListDatasets({
    query: { enabled: !isDemo, queryKey: ["listDatasets"] } as any,
  });
  const compare = useGetKpiCompare();
  const [datasetId, setDatasetId] = useState("demo");
  const [dimension, setDimension] = useState("country");
  const [metric, setMetric] = useState("revenue");
  const [periodCol, setPeriodCol] = useState("year");
  const [periodA, setPeriodA] = useState("2023");
  const [periodB, setPeriodB] = useState("2024");
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (!isDemo && datasets[0]?.id && datasetId === "demo") {
      setDatasetId(datasets[0].id);
    }
  }, [datasets, datasetId, isDemo]);

  const runCompare = () => {
    if (isDemo) {
      setHasRun(true);
      return;
    }
    compare.mutate(
      { data: { datasetId, dimension, metric, periodCol, periodA, periodB, limit: 15 } },
      {
        onSuccess: () => setHasRun(true),
        onError: (error) => toast({
          title: "Не удалось выполнить сравнение",
          description: error instanceof Error ? error.message : "Проверьте набор данных и периоды",
          variant: "destructive",
        }),
      },
    );
  };

  const items = isDemo
    ? demoItems
    : (hasRun ? (compare.data?.items ?? []) : []);
  const maxValue = Math.max(...items.flatMap((item) => [item.valueA, item.valueB]), 1);
  const selectedMetric = metricOptions.find((item) => item.value === metric)?.label ?? metric;
  const selectedDimension = dimensionOptions.find((item) => item.value === dimension)?.label ?? dimension;
  const growth = useMemo(() => {
    if (!items.length) return 0;
    return items.reduce((sum, item) => sum + (item.deltaPct ?? 0), 0) / items.length;
  }, [items]);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Сравнение</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Сопоставление показателей по двум периодам и сегментам
            </p>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            {isDemo ? "Demo Dataset" : "Ваш набор данных"}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
              {!isDemo && (
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-medium">Набор данных</label>
                  <Select value={datasetId} onValueChange={setDatasetId}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Выберите набор" /></SelectTrigger>
                    <SelectContent>
                      {datasets.map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id}>{dataset.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Измерение</label>
                <Select value={dimension} onValueChange={setDimension}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{dimensionOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Метрика</label>
                <Select value={metric} onValueChange={setMetric}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{metricOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Период A</label>
                <Select value={periodA} onValueChange={setPeriodA}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{["2022", "2023", "2024", "2025"].map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Период B</label>
                <Select value={periodB} onValueChange={setPeriodB}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{["2022", "2023", "2024", "2025"].map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={runCompare} disabled={compare.isPending || (!isDemo && !datasetId)} className="h-9 gap-1.5 text-xs">
                <RefreshCw className={cn("w-3.5 h-3.5", compare.isPending && "animate-spin")} />
                {compare.isPending ? "Считаю…" : "Сравнить"}
              </Button>
            </div>
            <input type="hidden" value={periodCol} readOnly aria-label="period column" />
          </CardContent>
        </Card>

        {!hasRun && !isDemo ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Настройте параметры и запустите сравнение</p>
              <p className="text-xs mt-1">Результаты появятся здесь после запроса к API.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Сегментов</p><p className="text-2xl font-bold mt-1">{items.length}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Средняя динамика</p><p className={cn("text-2xl font-bold mt-1", growth >= 0 ? "text-emerald-600" : "text-red-600")}>{growth >= 0 ? "+" : ""}{growth.toFixed(1)}%</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Метрика</p><p className="text-2xl font-bold mt-1">{selectedMetric}</p></CardContent></Card>
            </div>

            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">{selectedMetric} по {selectedDimension.toLowerCase()}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Нет данных для выбранных периодов.</p>}
                {items.map((item) => {
                  const deltaPct = item.deltaPct ?? 0;
                  const positive = deltaPct > 0;
                  const neutral = Math.abs(deltaPct) < 0.05;
                  return (
                    <div key={item.label} className="space-y-1.5" data-testid={`row-compare-${item.label}`}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium truncate">{item.label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-muted-foreground">{formatValue(item.valueA, metric)} → {formatValue(item.valueB, metric)}</span>
                          <span className={cn("inline-flex items-center gap-0.5 font-semibold w-16 justify-end", neutral ? "text-muted-foreground" : positive ? "text-emerald-600" : "text-red-600")}>
                            {neutral ? <Minus className="w-3 h-3" /> : positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {neutral ? "0.0" : `${positive ? "+" : ""}${deltaPct.toFixed(1)}`}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 h-2">
                        <div className="bg-muted rounded-full overflow-hidden"><div className="h-full bg-slate-400 rounded-full" style={{ width: `${Math.max(2, (item.valueA / maxValue) * 100)}%` }} /></div>
                        <div className="bg-muted rounded-full overflow-hidden"><div className={cn("h-full rounded-full", positive ? "bg-emerald-500" : "bg-primary")} style={{ width: `${Math.max(2, (item.valueB / maxValue) * 100)}%` }} /></div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between pt-2 text-[11px] text-muted-foreground border-t">
                  <span>{periodA}</span><span>{periodB}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}