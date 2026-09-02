"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ShieldCheck, Factory, Beaker } from "lucide-react";
import { toast } from "sonner";

interface ReportsClientProps {
  formulas: any[];
  batches: any[];
  ingredients: any[];
}

export function ReportsClient({ formulas, batches, ingredients }: ReportsClientProps) {
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

  return (
    <div className="p-6 space-y-6 w-full">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Reports & Exports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate, review, and export regulatory, formula, and production data
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 mb-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Formulation Catalog</CardTitle>
            <CardDescription className="text-xs">
              Complete inventory of all formula specifications, versions, targets, and statuses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full" onClick={exportFormulasCsv}>
              <Download className="mr-2 h-4 w-4" /> Export CSV ({formulas.length})
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 mb-2">
              <Factory className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Batch Production Log</CardTitle>
            <CardDescription className="text-xs">
              Historical production batches, scaled target sizes, status flows, and dispensing metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full" onClick={exportBatchesCsv}>
              <Download className="mr-2 h-4 w-4" /> Export CSV ({batches.length})
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 mb-2">
              <Beaker className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Raw Material Master</CardTitle>
            <CardDescription className="text-xs">
              Full library of aroma chemicals, essential oils, CAS numbers, and physical properties.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full" onClick={exportIngredientsCsv}>
              <Download className="mr-2 h-4 w-4" /> Export CSV ({ingredients.length})
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
