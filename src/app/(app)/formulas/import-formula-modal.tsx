"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Upload, Download, Check, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseSheetData, findColumnValue } from "@/lib/csv-parser";
import { importFormulaFromSheet, SheetFormulaInput } from "@/services/import/actions";
import { toast } from "sonner";

interface ImportFormulaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportFormulaModal({ open, onOpenChange }: ImportFormulaModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rawText, setRawText] = useState("");
  const [formulaName, setFormulaName] = useState("");
  const [productType, setProductType] = useState("EAU_DE_PARFUM");
  const [previewRows, setPreviewRows] = useState<Array<{ name: string; quantity: number; casNumber?: string }>>([]);
  const [step, setStep] = useState<"paste" | "preview">("paste");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto set formula name from file name if blank
    if (!formulaName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setFormulaName(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      parseAndPreview(content, formulaName || file.name.replace(/\.[^/.]+$/, ""));
    };
    reader.readAsText(file);
  };

  const parseAndPreview = (text: string, defaultName?: string) => {
    const parsed = parseSheetData(text);
    if (parsed.rows.length === 0) {
      toast.error("Could not find any ingredient rows in data.");
      return;
    }

    const rows = parsed.rows.map((r) => {
      const name = findColumnValue(r, ["ingredient", "name", "material", "oil", "item", "rawmaterial"]);
      const qtyStr = findColumnValue(r, ["quantity", "grams", "weight", "amount", "qty", "parts", "dosage"]);
      const cas = findColumnValue(r, ["cas", "casnumber", "casno"]);

      const qty = parseFloat(qtyStr.replace(/[^0-9.]/g, "")) || 0;
      return {
        name: name || "Unknown Material",
        quantity: qty,
        casNumber: cas || undefined,
      };
    }).filter((r) => r.name && r.name !== "Unknown Material");

    if (rows.length === 0) {
      toast.error("Could not parse column headers. Make sure you have 'Ingredient' and 'Quantity' columns.");
      return;
    }

    setPreviewRows(rows);
    if (!formulaName && defaultName) {
      setFormulaName(defaultName);
    }
    setStep("preview");
  };

  const handleProceedToPreview = () => {
    if (!rawText.trim()) {
      toast.error("Please paste your spreadsheet data or upload a file.");
      return;
    }
    parseAndPreview(rawText, formulaName || "Imported Formula");
  };

  const handleConfirmImport = () => {
    if (!formulaName.trim()) {
      toast.error("Please enter a name for this formula.");
      return;
    }

    if (previewRows.length === 0) {
      toast.error("No valid ingredient rows to import.");
      return;
    }

    const payload: SheetFormulaInput = {
      formulaName: formulaName.trim(),
      productType,
      ingredients: previewRows,
    };

    startTransition(async () => {
      const res = await importFormulaFromSheet(payload);
      if (res.success && res.data) {
        toast.success(`Formula "${formulaName}" imported with ${res.data.ingredientCount} ingredients!`);
        onOpenChange(false);
        resetState();
        router.push(`/formulas/${res.data.formulaId}`);
      } else {
        toast.error(res.error || "Failed to import formula.");
      }
    });
  };

  const resetState = () => {
    setRawText("");
    setFormulaName("");
    setPreviewRows([]);
    setStep("paste");
  };

  const downloadSampleCsv = () => {
    const csv = `Ingredient,Quantity,CAS Number\nBergamot Oil,120.5,8007-75-8\nIso E Super,250.0,54464-57-2\nHedione,180.0,24851-98-7\nAmbroxan,35.0,6790-58-5\nLinalool,45.0,78-70-6\nSandalwood Oil,80.0,8006-87-9\nEthanol 96%,289.5,64-17-5`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "olfacta_formula_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalGrams = previewRows.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Import Formula from Spreadsheet</DialogTitle>
              <DialogDescription>
                Migrate formulations seamlessly from Google Sheets, Microsoft Excel, or CSV files.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === "paste" ? (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="formulaName">Formula Name</Label>
                <Input
                  id="formulaName"
                  placeholder="e.g. Santal Royale (2026)"
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="productType">Concentration Type</Label>
                <select
                  id="productType"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="EAU_DE_PARFUM">Eau de Parfum (EDP)</option>
                  <option value="PARFUM">Extrait de Parfum</option>
                  <option value="EAU_DE_TOILETTE">Eau de Toilette (EDT)</option>
                  <option value="EAU_DE_COLOGNE">Eau de Cologne (EDC)</option>
                  <option value="CANDLE">Candle Fragrance</option>
                  <option value="ROOM_SPRAY">Room Spray</option>
                </select>
              </div>
            </div>

            {/* File Upload Dropzone / Paste Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rawText">Paste from Google Sheets / Excel or CSV:</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={downloadSampleCsv}
                  className="h-auto p-0 text-xs text-primary inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3 w-3" /> Download Sample Template (.csv)
                </Button>
              </div>

              <textarea
                id="rawText"
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Ingredient\tQuantity (g)\tCAS\nBergamot Oil\t120.5\t8007-75-8\nIso E Super\t250\t54464-57-2\nHedione\t180\t24851-98-7\nAmbroxan\t35\t6790-58-5`}
                className="w-full rounded-md border border-input bg-background p-3 text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="flex items-center justify-center border border-dashed border-input rounded-lg p-3 bg-muted/20">
              <label className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <span>Or upload file (<strong>.csv</strong>, <strong>.tsv</strong>, <strong>.txt</strong>)</span>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        ) : (
          /* Preview step */
          <div className="space-y-3 py-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border text-xs">
              <div>
                <span className="text-muted-foreground">Formula:</span>{" "}
                <strong className="text-foreground">{formulaName}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Detected Ingredients:</span>{" "}
                <strong>{previewRows.length}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Total Batch Weight:</span>{" "}
                <strong>{totalGrams.toFixed(2)} g</strong>
              </div>
            </div>

            <div className="border rounded-lg overflow-y-auto max-h-[320px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted border-b text-muted-foreground text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Ingredient Name</th>
                    <th className="px-3 py-2 font-medium text-right">Quantity (g)</th>
                    <th className="px-3 py-2 font-medium text-right">Dosage (%)</th>
                    <th className="px-3 py-2 font-medium">CAS #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewRows.map((r, i) => {
                    const pct = totalGrams > 0 ? (r.quantity / totalGrams) * 100 : 0;
                    return (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-3 py-1.5 text-muted-foreground font-mono">{i + 1}</td>
                        <td className="px-3 py-1.5 font-medium">{r.name}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{r.quantity.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{pct.toFixed(2)}%</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{r.casNumber || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Note: Missing ingredients will be registered automatically in your library and available for IFRA compliance checks.
            </p>
          </div>
        )}

        <DialogFooter className="border-t pt-3 flex items-center justify-between sm:justify-between">
          {step === "preview" ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setStep("paste")} disabled={isPending}>
                Back to Edit
              </Button>
              <Button size="sm" onClick={handleConfirmImport} loading={isPending} className="gap-1.5">
                <Check className="h-3.5 w-3.5" /> Import {previewRows.length} Ingredients
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleProceedToPreview} className="gap-1.5">
                Preview Mapped Data <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
