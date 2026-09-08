"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Download, Factory, Beaker, Eye, Search, ArrowUpRight, FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface ReportsClientProps {
  formulas: any[];
  batches: any[];
  ingredients: any[];
}

export function ReportsClient({ formulas, batches, ingredients }: ReportsClientProps) {
  const [activeReport, setActiveReport] = useState<"formulas" | "batches" | "ingredients" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const exportFormulasCsv = () => {
    if (formulas.length === 0) {
      toast.error("No formulas to export");
      return;
    }
    const headers = ["Formula Name", "Product Type", "Category", "Market", "Status", "Version", "Target Weight (g)", "Total Ingredients"];
    const rows = formulas.map((f) => [
      `"${f.name}"`,
      `"${f.productType}"`,
      `"${f.applicationCategory || ""}"`,
      `"${f.market || ""}"`,
      `"${f.status}"`,
      f.versions[0]?.versionNumber ?? 1,
      f.versions[0]?.targetWeight ?? 0,
      f.versions[0]?.ingredients?.length ?? 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `olfacta_formulas_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Formulas report exported");
  };

  const exportBatchesCsv = () => {
    if (batches.length === 0) {
      toast.error("No batches to export");
      return;
    }
    const headers = ["Batch Number", "Formula", "Target Quantity (g)", "Scale Factor", "Status", "Created At"];
    const rows = batches.map((b) => [
      `"${b.batchNumber}"`,
      `"${b.formula.name}"`,
      b.targetQuantity,
      b.scaleFactor,
      `"${b.status}"`,
      `"${new Date(b.createdAt).toISOString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `olfacta_batches_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Batches report exported");
  };

  const exportIngredientsCsv = () => {
    if (ingredients.length === 0) {
      toast.error("No ingredients to export");
      return;
    }
    const headers = ["Ingredient Name", "CAS Number", "INCI Name", "Material Type", "Density", "Cost Per Unit", "Currency", "Status"];
    const rows = ingredients.map((i) => [
      `"${i.name}"`,
      `"${i.casNumber || ""}"`,
      `"${i.inciName || ""}"`,
      `"${i.materialType}"`,
      i.density || "",
      i.costPerUnit || "",
      `"${i.costCurrency || "USD"}"`,
      `"${i.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `olfacta_ingredients_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Ingredients catalog exported");
  };

  // Filtered datasets for preview modal
  const filteredFormulas = formulas.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.market && f.market.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (f.productType && f.productType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredBatches = batches.filter((b) =>
    b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.formula.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.casNumber && i.casNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (i.materialType && i.materialType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <PageHeader
        title="Reports & Exports"
        description="Generate, review, and export regulatory, formula, and production data"
      />

      {/* Reports Catalog Grid (12-column grid: 3 x 4 cols) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Formulation Catalog Card */}
        <Card className="flex flex-col justify-between col-span-12 md:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 mb-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Formulation Catalog</CardTitle>
            <CardDescription className="text-xs">
              Complete inventory of all formula specifications, versions, targets, and statuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <Button
              className="w-full h-9 text-xs font-medium"
              onClick={() => {
                setSearchQuery("");
                setActiveReport("formulas");
              }}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" /> View Report ({formulas.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={exportFormulasCsv}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          </CardContent>
        </Card>

        {/* Batch Production Log Card */}
        <Card className="flex flex-col justify-between col-span-12 md:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 mb-2">
              <Factory className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Batch Production Log</CardTitle>
            <CardDescription className="text-xs">
              Historical production batches, scaled target sizes, status flows, and dispensing metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <Button
              className="w-full h-9 text-xs font-medium"
              onClick={() => {
                setSearchQuery("");
                setActiveReport("batches");
              }}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" /> View Report ({batches.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={exportBatchesCsv}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          </CardContent>
        </Card>

        {/* Raw Material Master Card */}
        <Card className="flex flex-col justify-between col-span-12 md:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 mb-2">
              <Beaker className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Raw Material Master</CardTitle>
            <CardDescription className="text-xs">
              Full library of aroma chemicals, essential oils, CAS numbers, and physical properties.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <Button
              className="w-full h-9 text-xs font-medium"
              onClick={() => {
                setSearchQuery("");
                setActiveReport("ingredients");
              }}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" /> View Report ({ingredients.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={exportIngredientsCsv}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Preview Dialog: Formulation Catalog ── */}
      <Dialog open={activeReport === "formulas"} onOpenChange={(open) => !open && setActiveReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Formulation Catalog</span>
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Viewing {filteredFormulas.length} of {formulas.length} formulas in workspace
                </DialogDescription>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs shrink-0 gap-1.5" onClick={exportFormulasCsv}>
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </div>

            <div className="pt-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter formulas by name, product type, or market..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto -mx-6 px-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 border-b">
                <tr className="text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Formula Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Target Batch</th>
                  <th className="py-2.5 px-3">Ingredients</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFormulas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No matching formulas found.
                    </td>
                  </tr>
                ) : (
                  filteredFormulas.map((f) => {
                    const version = f.versions?.[0];
                    return (
                      <tr key={f.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-3 font-medium text-foreground">
                          {f.name}
                          {f.market && <span className="block text-[11px] text-muted-foreground">{f.market}</span>}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {f.productType?.replace(/_/g, " ") || "EDP"}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          v{version?.versionNumber ?? 1}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={f.status} />
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {version?.targetWeight ?? 1000} g
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {version?.ingredients?.length ?? 0}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2 text-primary">
                            <Link href={`/formulas/${f.id}`}>
                              Open <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Preview Dialog: Batch Production Log ── */}
      <Dialog open={activeReport === "batches"} onOpenChange={(open) => !open && setActiveReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Factory className="h-5 w-5 text-primary" />
                  <span>Batch Production Log</span>
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Viewing {filteredBatches.length} of {batches.length} manufacturing runs
                </DialogDescription>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs shrink-0 gap-1.5" onClick={exportBatchesCsv}>
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </div>

            <div className="pt-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter batches by lot number, formula name, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto -mx-6 px-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 border-b">
                <tr className="text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Batch Number</th>
                  <th className="py-2.5 px-3">Formula</th>
                  <th className="py-2.5 px-3">Target Size</th>
                  <th className="py-2.5 px-3">Scale Factor</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No matching batch logs found.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-foreground">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">
                        {b.formula?.name || "—"}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {b.targetQuantity} {b.unit || "g"}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {b.scaleFactor ? `${b.scaleFactor.toFixed(2)}x` : "1.00x"}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {formatDate(b.createdAt)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2 text-primary">
                          <Link href={`/batches/${b.id}`}>
                            View <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Preview Dialog: Raw Material Master ── */}
      <Dialog open={activeReport === "ingredients"} onOpenChange={(open) => !open && setActiveReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-primary" />
                  <span>Raw Material Master</span>
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Viewing {filteredIngredients.length} of {ingredients.length} raw materials and accords
                </DialogDescription>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs shrink-0 gap-1.5" onClick={exportIngredientsCsv}>
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </div>

            <div className="pt-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter materials by name, CAS number, or material type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto -mx-6 px-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 border-b">
                <tr className="text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Material Name</th>
                  <th className="py-2.5 px-3">CAS Number</th>
                  <th className="py-2.5 px-3">Material Type</th>
                  <th className="py-2.5 px-3">Density</th>
                  <th className="py-2.5 px-3">Unit Cost</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No matching materials found.
                    </td>
                  </tr>
                ) : (
                  filteredIngredients.map((i) => (
                    <tr key={i.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-foreground">
                        {i.name}
                        {i.inciName && <span className="block text-[11px] text-muted-foreground font-mono truncate max-w-xs">{i.inciName}</span>}
                      </td>
                      <td className="py-3 px-3 font-mono text-muted-foreground">
                        {i.casNumber || "—"}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-[11px] py-0">
                          {i.materialType?.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {i.density ? `${i.density} g/ml` : "—"}
                      </td>
                      <td className="py-3 px-3 font-mono text-foreground font-medium">
                        {i.costPerUnit ? `$${i.costPerUnit.toFixed(2)} / ${i.costUnit || "g"}` : "—"}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2 text-primary">
                          <Link href={`/ingredients/${i.id}`}>
                            Inspect <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
