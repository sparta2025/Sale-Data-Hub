import React, { useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout";
import { useGetDatasetPreview, useListDatasets, type GetDatasetPreviewParams } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Database,
  Trash2,
  Eye,
  FileSpreadsheet,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

function fmt(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const demoPreviewRows: Record<string, Record<string, unknown>[]> = {
  "demo-1": [
    { date: "2024-01-05", product: "Wireless Headphones", category: "Electronics", country: "Germany", revenue: "€12,450", units: 124 },
    { date: "2024-01-08", product: "Running Shoes", category: "Sportswear", country: "France", revenue: "€8,920", units: 86 },
    { date: "2024-01-12", product: "Coffee Machine", category: "Home", country: "Italy", revenue: "€6,740", units: 42 },
  ],
  "demo-2": [
    { month: "October", rep: "Anna Schmidt", region: "DACH", target: "€42,000", actual: "€46,850", gp: "31.4%" },
    { month: "November", rep: "Jean Martin", region: "France", target: "€38,000", actual: "€35,420", gp: "28.9%" },
    { month: "December", rep: "Marco Rossi", region: "Italy", target: "€45,000", actual: "€49,210", gp: "33.1%" },
  ],
};

function buildDemoRows(datasetId: string, limit: number) {
  const templates = demoPreviewRows[datasetId] ?? [];
  if (templates.length === 0) return [];

  return Array.from({ length: limit }, (_, index) => {
    const template = templates[index % templates.length];
    const row = { ...template };

    if (datasetId === "demo-1") {
      const countries = ["Germany", "France", "Italy", "Spain", "Poland"];
      const categories = ["Electronics", "Sportswear", "Home", "Beauty"];
      row.date = `2024-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`;
      row.product = `${template.product} ${Math.floor(index / templates.length) + 1}`;
      row.category = categories[index % categories.length];
      row.country = countries[index % countries.length];
      row.revenue = `€${(6740 + ((index * 1370) % 18500)).toLocaleString("en-US")}`;
      row.units = 42 + ((index * 17) % 180);
    } else if (datasetId === "demo-2") {
      const reps = ["Anna Schmidt", "Jean Martin", "Marco Rossi", "Olga Petrova"];
      const regions = ["DACH", "France", "Italy", "CEE"];
      const months = ["October", "November", "December"];
      row.month = months[index % months.length];
      row.rep = reps[index % reps.length];
      row.region = regions[index % regions.length];
      row.target = `€${(36000 + ((index * 2100) % 16000)).toLocaleString("en-US")}`;
      row.actual = `€${(34200 + ((index * 2750) % 21000)).toLocaleString("en-US")}`;
      row.gp = `${(27 + ((index * 1.7) % 9)).toFixed(1)}%`;
    }

    return row;
  });
}

export default function DatasetsPage() {
  const { isDemo } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewDataset, setPreviewDataset] = useState<any | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCountByDataset, setPreviewCountByDataset] = useState<Record<string, string>>({});
  const [previewLimitDraft, setPreviewLimitDraft] = useState("100");
  const [previewLimit, setPreviewLimit] = useState(100);
  const [previewOffset, setPreviewOffset] = useState(0);
  const [filterDraft, setFilterDraft] = useState<Record<string, string>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const { data: datasetsData, refetch } = useListDatasets({ query: { enabled: !isDemo, queryKey: ["listDatasets"] } as any });

  const demoDatasets = [
    {
      id: "demo-1", name: "Global Sales 2024", rowCount: 48520, status: "ready",
      columns: ["date", "product", "category", "country", "revenue", "units"],
      isDemo: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      fileName: "global_sales_2024.xlsx",
    },
    {
      id: "demo-2", name: "Q4 Performance", rowCount: 12300, status: "ready",
      columns: ["month", "rep", "region", "target", "actual", "gp"],
      isDemo: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      fileName: "q4_performance.csv",
    },
  ];

  const items = isDemo ? demoDatasets : (datasetsData ?? []);
  const previewParams = useMemo<GetDatasetPreviewParams>(() => {
    const params: GetDatasetPreviewParams = {
      datasetId: previewDataset?.id ?? "",
      limit: previewLimit,
      offset: previewOffset,
    };
    if (Object.keys(appliedFilters).length > 0) {
      params.filters = JSON.stringify(appliedFilters);
    }
    return params;
  }, [appliedFilters, previewDataset?.id, previewLimit, previewOffset]);
  const previewQuery = useGetDatasetPreview(previewParams, {
    query: {
      enabled: previewOpen && Boolean(previewDataset) && !previewDataset?.isDemo,
      retry: false,
      keepPreviousData: true,
    } as any,
  });

  const demoRows = useMemo(() => {
    if (!previewDataset?.isDemo) return [];
    const rows = buildDemoRows(previewDataset.id, previewLimit);
    return rows.filter((row) =>
      Object.entries(appliedFilters).every(([column, value]) =>
        String(row[column] ?? "").toLowerCase().includes(value.toLowerCase()),
      ),
    );
  }, [appliedFilters, previewDataset, previewLimit]);
  const previewData = previewDataset?.isDemo
    ? {
        datasetId: previewDataset.id,
        columns: previewDataset.columns,
        rows: demoRows,
        total: demoRows.length,
        limit: previewLimit,
        offset: 0,
      }
    : previewQuery.data;
  const previewColumns: string[] = previewData?.columns ?? previewDataset?.columns ?? [];
  const activeFilterCount = Object.keys(appliedFilters).length;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.[^.]+$/, ""));
      const res = await fetch("/api/datasets/upload", { method: "POST", body: form,
        headers: { Authorization: `Bearer ${localStorage.getItem("sbi_token")}` }
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Upload successful" });
      refetch();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function openPreview(dataset: any, requestedLimit?: string) {
    const initialLimit = Math.min(1000, Math.max(1, Number(requestedLimit) || 100));
    setPreviewDataset(dataset);
    setPreviewOpen(true);
    setPreviewLimitDraft(String(initialLimit));
    setPreviewLimit(initialLimit);
    setPreviewOffset(0);
    setFilterDraft({});
    setAppliedFilters({});
  }

  function closePreview() {
    setPreviewOpen(false);
    setPreviewDataset(null);
    setFilterDraft({});
    setAppliedFilters({});
    setPreviewOffset(0);
  }

  function applyPreviewSettings() {
    const parsedLimit = Number(previewLimitDraft);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      toast({ title: "Invalid row count", description: "Enter a whole number from 1 to 1000.", variant: "destructive" });
      return;
    }
    const normalizedFilters = Object.fromEntries(
      Object.entries(filterDraft)
        .map(([column, value]) => [column, value.trim()])
        .filter(([, value]) => value !== ""),
    );
    setPreviewLimit(parsedLimit);
    setPreviewOffset(0);
    setAppliedFilters(normalizedFilters);
  }

  function resetPreviewFilters() {
    setFilterDraft({});
    setAppliedFilters({});
    setPreviewOffset(0);
  }

  const displayedRowStart = previewData && previewData.total > 0 ? previewData.offset + 1 : 0;
  const displayedRowEnd = previewData ? Math.min(previewData.offset + previewData.rows.length, previewData.total) : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Datasets</h1>
            <p className="text-sm text-muted-foreground">Upload Excel/CSV files and manage your sales data</p>
          </div>
          <Button onClick={() => fileRef.current?.click()} disabled={uploading || isDemo}>
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading…" : "Upload Excel / CSV"}
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
        </div>

        {isDemo && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground">
            You are in demo mode. Upload is disabled. Log in to upload your own data.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((ds: any) => (
            <Card key={ds.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">{ds.name}</CardTitle>
                  </div>
                  <Badge variant={ds.status === "ready" ? "secondary" : "outline"} className="text-xs">
                    {ds.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs truncate">{ds.fileName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground">Rows</span>
                  <span className="font-medium">{fmt(ds.rowCount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-muted-foreground">Columns</span>
                  <span className="font-medium">{ds.columns?.length ?? 0}</span>
                </div>
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`preview-count-${ds.id}`} className="mb-1 block text-[11px] text-muted-foreground">
                      Rows to preview
                    </label>
                    <Input
                      id={`preview-count-${ds.id}`}
                      type="number"
                      min={1}
                      max={1000}
                      value={previewCountByDataset[ds.id] ?? "100"}
                      onChange={(event) =>
                        setPreviewCountByDataset((current) => ({ ...current, [ds.id]: event.target.value }))
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openPreview(ds, previewCountByDataset[ds.id] ?? "100")}
                  >
                    <Eye className="w-3 h-3 mr-1" /> Preview
                  </Button>
                  {!ds.isDemo && (
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Database className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">No datasets yet</p>
              <p className="text-sm">Upload an Excel or CSV file to get started</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={(open) => (open ? setPreviewOpen(true) : closePreview())}>
        <DialogContent
          aria-label="Dataset preview"
          className="flex h-[82vh] min-h-[420px] min-w-0 w-[96vw] max-h-[92vh] max-w-none resize flex-col gap-0 overflow-hidden p-0 sm:max-w-[96vw]"
        >
          <DialogHeader className="border-b px-6 py-4 pr-12">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              {previewDataset?.name ?? "Dataset preview"}
            </DialogTitle>
            <DialogDescription>
              Просмотр строк из базы данных. Значения в фильтрах ищутся по совпадению внутри выбранной колонки.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-end gap-3 border-b bg-muted/20 px-6 py-3">
            <div className="w-36">
              <label htmlFor="preview-limit" className="mb-1 block text-xs font-medium">
                Rows to show
              </label>
              <Input
                id="preview-limit"
                type="number"
                min={1}
                max={1000}
                value={previewLimitDraft}
                onChange={(event) => setPreviewLimitDraft(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && applyPreviewSettings()}
                className="h-9"
              />
            </div>
            <Button onClick={applyPreviewSettings} disabled={previewQuery.isFetching && !previewDataset?.isDemo}>
              {previewQuery.isFetching && !previewDataset?.isDemo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Filter className="h-4 w-4" />
              )}
              Apply filters
            </Button>
            <Button variant="outline" onClick={resetPreviewFilters} disabled={activeFilterCount === 0}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <span className="pb-2 text-xs text-muted-foreground">
              {activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}` : "No filters"}
            </span>
          </div>

          <div className="px-6 pt-3 text-xs text-muted-foreground">
            {previewDataset?.isDemo ? (
              "Demo mode: displayed rows are examples."
            ) : previewData ? (
              `Showing ${displayedRowStart}-${displayedRowEnd} of ${previewData.total.toLocaleString()} matching rows`
            ) : (
              "Loading rows…"
            )}
          </div>

          <div className="mx-6 my-3 min-h-0 flex-1 overflow-x-auto overflow-y-scroll rounded-md border">
            {previewQuery.isError && !previewDataset?.isDemo ? (
              <div className="flex min-h-40 items-center justify-center p-6 text-sm text-destructive">
                Не удалось загрузить строки dataset. Попробуйте ещё раз.
              </div>
            ) : previewQuery.isLoading && !previewDataset?.isDemo ? (
              <div className="flex min-h-40 items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading rows…
              </div>
            ) : (
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow className="bg-muted/70 hover:bg-muted/70">
                    {previewColumns.map((column) => (
                      <TableHead key={column} className="sticky top-0 z-10 min-w-[170px] bg-muted/90 text-xs font-semibold">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow className="bg-background hover:bg-background">
                    {previewColumns.map((column) => (
                      <TableHead key={`${column}-filter`} className="sticky top-10 z-10 min-w-[170px] bg-background p-1">
                        <Input
                          aria-label={`Filter ${column}`}
                          placeholder="Filter…"
                          value={filterDraft[column] ?? ""}
                          onChange={(event) =>
                            setFilterDraft((current) => ({ ...current, [column]: event.target.value }))
                          }
                          onKeyDown={(event) => event.key === "Enter" && applyPreviewSettings()}
                          className="h-8 text-xs font-normal"
                        />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(previewData?.rows ?? []).map((row, rowIndex) => (
                    <TableRow key={`${previewDataset?.id}-${rowIndex}`}>
                      {previewColumns.map((column) => (
                        <TableCell key={`${rowIndex}-${column}`} className="max-w-[280px] truncate text-xs" title={formatCell(row[column])}>
                          {formatCell(row[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {previewData && previewData.rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={Math.max(previewColumns.length, 1)} className="h-24 text-center text-sm text-muted-foreground">
                        No matching rows found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="border-t px-6 py-3">
            <div className="mr-auto text-xs text-muted-foreground">
              {previewDataset?.fileName ?? ""}
            </div>
            {!previewDataset?.isDemo && previewData && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={previewOffset === 0 || previewQuery.isFetching}
                  onClick={() => setPreviewOffset((offset) => Math.max(0, offset - previewLimit))}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={previewOffset + previewData.rows.length >= previewData.total || previewQuery.isFetching}
                  onClick={() => setPreviewOffset((offset) => offset + previewLimit)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="outline" onClick={closePreview}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
