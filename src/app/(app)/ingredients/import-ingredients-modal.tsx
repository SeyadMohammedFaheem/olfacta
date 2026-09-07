"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Upload, Download, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { bulkImportIngredientsFromSheet, SheetIngredientInput } from "@/services/import/actions";
import { toast } from "sonner";

interface ImportIngredientsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportIngredientsModal({ open, onOpenChange }: ImportIngredientsModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rawText, setRawText] = useState("");
  const [previewRows, setPreviewRows] = useState<SheetIngredientInput[]>([]);
  const [step, setStep] = useState<"paste" | "preview">("paste");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      parseAndPreview(content);
    };
    reader.readAsText(file);
  };

  const parseAndPreview = (text: string) => {
    const parsed = parseSheetData(text);
    if (parsed.rows.length === 0) {
      toast.error("Could not find any material rows in data.");
      return;
    }

    const rows: SheetIngredientInput[] = parsed.rows.map((r) => {
      const name = findColumnValue(r, ["name", "ingredient", "material", "oil", "oilname", "rawmaterial", "chemical"]);
      const cas = findColumnValue(r, ["cas", "casnumber", "casno"]);
      const inci = findColumnValue(r, ["inci", "inciname"]);
      const type = findColumnValue(r, ["type", "materialtype", "category", "class"]);
      const dilution = findColumnValue(r, ["dilution", "dilutionpercentage", "strength"]);
      const solvent = findColumnValue(r, ["solvent", "carrier", "diluentsolvent"]);
      const cost = findColumnValue(r, ["cost", "price", "costperunit", "costperg"]);
      const desc = findColumnValue(r, ["description", "notes", "odor", "profile"]);

      const dilutionNum = parseFloat(dilution.replace(/[^0-9.]/g, ""));
      const costNum = parseFloat(cost.replace(/[^0-9.]/g, ""));

      return {
        name: name || "Unknown Material",
        casNumber: cas || undefined,
        inciName: inci || undefined,
        materialType: type || "FRAGRANCE",
        dilutionPercentage: !isNaN(dilutionNum) ? dilutionNum : 100,
        diluentSolvent: solvent || "None (Pure)",
        costPerUnit: !isNaN(costNum) ? costNum : undefined,
        description: desc || undefined,
      };
    }).filter((r) => r.name && r.name !== "Unknown Material");

    if (rows.length === 0) {
      toast.error("Could not parse column headers. Make sure you have at least an 'Ingredient' or 'Name' column.");
      return;
    }

    setPreviewRows(rows);
    setStep("preview");
  };

  const handleProceedToPreview = () => {
    if (!rawText.trim()) {
      toast.error("Please paste your spreadsheet data or upload a file.");
      return;
    }
    parseAndPreview(rawText);
  };

  const handleConfirmImport = () => {
    if (previewRows.length === 0) {
      toast.error("No valid material rows to import.");
      return;
    }

    startTransition(async () => {
      const res = await bulkImportIngredientsFromSheet(previewRows);
      if (res.success && res.data) {
        toast.success(`Import complete! ${res.data.created} new materials added, ${res.data.updated} updated.`);
        onOpenChange(false);
        resetState();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to import materials.");
      }
    });
  };

  const resetState = () => {
    setRawText("");
    setPreviewRows([]);
    setStep("paste");
  };

  const downloadSampleCsv = () => {
    const csv = `Name,CAS Number,Material Type,Dilution %,Solvent,Cost per g,Description\nBergamot Oil (FCF),8007-75-8,ESSENTIAL_OIL,100,None (Pure),0.45,Sparkling Italian citrus top note\nIso E Super,54464-57-2,AROMA_CHEMICAL,100,None (Pure),0.12,Velvety cedarwood and amber\nHedione,24851-98-7,AROMA_CHEMICAL,100,None (Pure),0.18,Transparent radiant jasmine floralcy\nAmbroxan,6790-58-5,AROMA_CHEMICAL,10,DPG,1.20,Rich warm mineral ambergris\nRose Absolute (Morocco),8007-01-0,EXTRACT,100,None (Pure),4.50,Deep honeyed damask rose heart`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "olfacta_materials_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Bulk Import Raw Materials & Oils</DialogTitle>
              <DialogDescription>
                Quickly import your laboratory inventory from Google Sheets, Excel, or CSV.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === "paste" ? (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            {/* File Upload Dropzone / Paste Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rawText">Paste table from Sheets / Excel:</Label>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3 w-3" /> Download Sample CSV Template
                </button>
              </div>

              <textarea
                id="rawText"
                rows={9}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Name\tCAS\tType\tDilution\tCost\nBergamot Oil\t8007-75-8\tESSENTIAL_OIL\t100%\t0.45\nIso E Super\t54464-57-2\tAROMA_CHEMICAL\t100%\t0.12\nHedione\t24851-98-7\tAROMA_CHEMICAL\t100%\t0.18\nAmbroxan\t6790-58-5\tAROMA_CHEMICAL\t10%\t1.20`}
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
                <span className="text-muted-foreground">Detected Materials:</span>{" "}
                <strong className="text-foreground">{previewRows.length} items</strong>
              </div>
              <p className="text-muted-foreground">
                Existing items matching by name will be safely updated without duplicates.
              </p>
            </div>

            <div className="border rounded-lg overflow-y-auto max-h-[320px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted border-b text-muted-foreground text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Material Name</th>
                    <th className="px-3 py-2 font-medium">CAS #</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium text-right">Dilution</th>
                    <th className="px-3 py-2 font-medium text-right">Cost/g</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewRows.map((r, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-3 py-1.5 text-muted-foreground font-mono">{i + 1}</td>
                      <td className="px-3 py-1.5 font-medium">{r.name}</td>
                      <td className="px-3 py-1.5 text-muted-foreground font-mono">{r.casNumber || "—"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.materialType}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{r.dilutionPercentage}%</td>
                      <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">
                        {typeof r.costPerUnit === "number" ? `$${r.costPerUnit.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-3 flex items-center justify-between sm:justify-between">
          {step === "preview" ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setStep("paste")} disabled={isPending}>
                Back to Edit
              </Button>
              <Button size="sm" onClick={handleConfirmImport} loading={isPending} className="gap-1.5">
                <Check className="h-3.5 w-3.5" /> Import {previewRows.length} Materials
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleProceedToPreview} className="gap-1.5">
                Preview Mapped Materials <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
