import React, { useRef, useState } from "react";
import { AppLayout } from "@/components/layout";
import { useListDatasets } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Database, Trash2, Eye, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

function fmt(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);
}

export default function DatasetsPage() {
  const { isDemo } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data: datasetsData, refetch } = useListDatasets({}, { query: { enabled: !isDemo } });

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

  const items = isDemo ? demoDatasets : (datasetsData?.datasets ?? []);

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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-3 h-3 mr-1" /> View
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
    </AppLayout>
  );
}
