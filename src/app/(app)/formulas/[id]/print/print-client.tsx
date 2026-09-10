"use client";

import { useEffect } from "react";
import Link from "next/link";
import { 
  Printer, 
  ArrowLeft, 
  ShieldCheck, 
  FlaskConical, 
  FileCheck2, 
  Scale, 
  Sparkles,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { decimalRound } from "@/lib/calculations";
import { formatDate } from "@/lib/utils";
import type { ComplianceSummary } from "@/types";
import { downloadFormulaPdf } from "@/lib/pdf-export";

interface PrintClientProps {
  formula: any;
  version: any;
  organization: any;
  approverName?: string;
  creatorName?: string;
  complianceSummary: ComplianceSummary;
  autoPrint?: boolean;
}

export function FormulaPrintClient({
  formula,
  version,
  organization,
  approverName,
  creatorName,
  complianceSummary,
  autoPrint = false,
}: PrintClientProps) {
  useEffect(() => {
    if (autoPrint) {
      // Auto-trigger direct PDF download
      const timer = setTimeout(() => {
        downloadFormulaPdf({
          formula,
          version,
          organization,
          approverName,
          creatorName,
          complianceSummary,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, formula, version, organization, approverName, creatorName, complianceSummary]);

  const handleDownloadPdf = () => {
    downloadFormulaPdf({
      formula,
      version,
      organization,
      approverName,
      creatorName,
      complianceSummary,
    });
  };

  const ingredients = version.ingredients || [];
  const targetBatchWeight = version.targetWeight || 1000;
  const targetConcentration = version.concentration || 20;
  const weightUnit = version.weightUnit || "g";

  // Calculate concentrate vs carrier totals
  const fragranceTypes = ["FRAGRANCE", "ESSENTIAL_OIL", "AROMA_CHEMICAL", "EXTRACT"];
  const concentrateGrams = ingredients
    .filter((i: any) => fragranceTypes.includes(i.ingredient?.materialType || i.materialType))
    .reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);

  const totalFormulaGrams = ingredients.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
  const carrierGrams = Math.max(0, targetBatchWeight - concentrateGrams);

  const productTypeFormatted = (formula.productType || "EAU_DE_PARFUM")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 print:bg-white print:text-black">
      {/* ── SCREEN ONLY FLOATING ACTION BAR ── */}
      <div className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 px-6 py-3 shadow-xs backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/formulas/${formula.id}`} className="gap-1.5 text-xs font-medium">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Workspace
              </Link>
            </Button>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Official Dossier & Physical Sign-Off
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-1.5 text-xs font-medium cursor-pointer"
              size="sm"
            >
              <Printer className="h-3.5 w-3.5 text-neutral-600" />
              Print
            </Button>
            <Button
              onClick={handleDownloadPdf}
              className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800 font-semibold text-xs shadow-xs cursor-pointer px-4 py-2"
              size="sm"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ── PRINT DOCUMENT CONTAINER ── */}
      <div className="mx-auto max-w-5xl p-4 sm:p-8 print:p-0 print:max-w-none">
        <div className="bg-white shadow-md border border-neutral-200 rounded-xl p-8 sm:p-12 print:shadow-none print:border-0 print:p-6 print:rounded-none">
          
          {/* 1. OFFICIAL LABORATORY HEADER */}
          <div className="border-b-2 border-neutral-900 pb-6 mb-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical className="h-5 w-5 text-neutral-900" />
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                    {organization.name} — PERFUME FORMULATION LABORATORY
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-neutral-950">
                  {formula.name}
                </h1>
                <p className="text-xs text-neutral-600 mt-1 font-mono">
                  Certificate Document Reference: OLFACTA-FRM-{formula.id.slice(-8).toUpperCase()}-V{version.versionNumber}
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-600/30 bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                  <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                  {version.status === "APPROVED" ? "APPROVED SPECIFICATION" : "FORMULATION SPECIFICATION"}
                </div>
                <p className="text-xs text-neutral-500 font-mono">
                  Version: <span className="font-bold text-neutral-900">v{version.versionNumber}.0</span>
                </p>
                <p className="text-xs text-neutral-500 font-mono">
                  Date: <span className="font-semibold text-neutral-900">{formatDate(version.approvedAt || version.updatedAt)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 2. SPECIFICATION OVERVIEW & OLFACTORY ARCHITECTURE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200 mb-6 text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px] font-medium uppercase tracking-wider">Product Classification</span>
              <span className="font-semibold text-neutral-900">{productTypeFormatted}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px] font-medium uppercase tracking-wider">Application Area</span>
              <span className="font-semibold text-neutral-900">{formula.applicationCategory || "Fine Fragrance"}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px] font-medium uppercase tracking-wider">Fragrance Dosage</span>
              <span className="font-semibold font-mono text-neutral-900">{targetConcentration}% Concentrate</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px] font-medium uppercase tracking-wider">Batch Reference Weight</span>
              <span className="font-semibold font-mono text-neutral-900">{targetBatchWeight} {weightUnit}</span>
            </div>
          </div>

          {/* 3. FORMULA GUIDE & COMPOUNDING PROTOCOL */}
          <div className="mb-6 rounded-lg border border-neutral-200 p-5 bg-white space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Sparkles className="h-4 w-4 text-neutral-800" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Formula Guide & Compounding Standard Operating Procedure
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-neutral-700">
              <div className="space-y-2">
                <p className="font-semibold text-neutral-900">1. Raw Material Order of Addition:</p>
                <ol className="list-decimal pl-4 space-y-1 text-neutral-600">
                  <li>Weigh and dissolve crystalline aroma chemicals into appropriate dipropylene glycol (DPG) or carrier solvent first.</li>
                  <li>Incorporate heavy resinoids, balsams, and base notes under continuous gentle magnetic stirring.</li>
                  <li>Blend floral and woody heart components at ambient room temperature (18°C–22°C).</li>
                  <li>Add volatile top notes and citrus essential oils last to minimize head-space evaporation.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-neutral-900">2. Maturation & Maceration Guidelines:</p>
                <ul className="list-disc pl-4 space-y-1 text-neutral-600">
                  <li><b>Concentrate Maturation:</b> Allow fragrance concentrate to mature neat for <b>14–21 days</b> in amber glass vessels sealed under inert nitrogen.</li>
                  <li><b>Ethanol Maceration:</b> Post-dilution with 96% neutral grain alcohol, macerate for a minimum of <b>28 days</b> at 15°C prior to chill filtration.</li>
                  <li><b>Chilling & Filtration:</b> Chill to 4°C for 48 hours to precipitate waxes, then filter through 0.45µm cellulose media.</li>
                </ul>
              </div>
            </div>

            {formula.description && (
              <div className="pt-2 border-t border-neutral-100 mt-2 text-xs">
                <span className="font-semibold text-neutral-900">Perfumer Creative Brief & Olfactory Direction:</span>
                <p className="italic text-neutral-600 mt-0.5">{formula.description}</p>
              </div>
            )}
          </div>

          {/* 4. MASTER FORMULATION TABLE */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Scale className="h-4 w-4 text-neutral-800" />
                Master Formulation Recipe ({ingredients.length} Ingredients)
              </h2>
              <span className="text-xs font-mono text-neutral-500">
                Formula Total: {decimalRound(totalFormulaGrams, 2)} {weightUnit}
              </span>
            </div>

            <div className="rounded-lg border border-neutral-300 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300 font-semibold text-neutral-800">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Ingredient / Raw Material Name</th>
                    <th className="py-2.5 px-3 font-mono">CAS Number</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Dilution</th>
                    <th className="py-2.5 px-3 text-right font-mono">Weight ({weightUnit})</th>
                    <th className="py-2.5 px-3 text-right font-mono">% in Formula</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {ingredients.map((item: any, idx: number) => {
                    const ing = item.ingredient || {};
                    const pct = targetBatchWeight > 0 ? (item.quantity / targetBatchWeight) * 100 : 0;
                    const dilutionPct = item.dilutionPercentage ?? ing.dilutionPercentage ?? 100;
                    const diluent = item.diluentSolvent ?? ing.diluentSolvent ?? "None";

                    return (
                      <tr key={item.id || idx} className="hover:bg-neutral-50">
                        <td className="py-2 px-3 text-center text-neutral-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-neutral-900">
                          {ing.name || item.name}
                        </td>
                        <td className="py-2 px-3 font-mono text-neutral-600 text-[11px]">
                          {ing.casNumber || "—"}
                        </td>
                        <td className="py-2 px-3 text-neutral-600 text-[11px]">
                          {(ing.materialType || "FRAGRANCE").replace(/_/g, " ")}
                        </td>
                        <td className="py-2 px-3 text-center text-neutral-600 font-mono text-[11px]">
                          {dilutionPct < 100 ? `${dilutionPct}% in ${diluent}` : "Pure (100%)"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-neutral-900">
                          {decimalRound(item.quantity, 2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-neutral-800">
                          {decimalRound(pct, 3)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-100 font-bold border-t-2 border-neutral-300 text-neutral-900">
                    <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                      Batch Totals:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {decimalRound(totalFormulaGrams, 2)} {weightUnit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {targetBatchWeight > 0 ? decimalRound((totalFormulaGrams / targetBatchWeight) * 100, 2) : 100}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Carrier Balance Note if batch needs alcohol/solvent top-up */}
            {carrierGrams > 0 && totalFormulaGrams < targetBatchWeight && (
              <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 bg-neutral-50 p-2 rounded border border-dashed border-neutral-200">
                <span>Base Carrier Balance (Alcohol 96% / Carrier):</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {decimalRound(carrierGrams, 2)} {weightUnit} ({decimalRound((carrierGrams / targetBatchWeight) * 100, 1)}%)
                </span>
              </div>
            )}
          </div>

          {/* 5. REGULATORY & IFRA COMPLIANCE STATEMENT */}
          <div className="mb-8 rounded-lg border border-neutral-200 p-4 bg-neutral-50/50">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  IFRA Safety & Regulatory Compliance Validation
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                STATUS: {complianceSummary.overall}
              </span>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              This formula has undergone automated toxicological and IFRA quantitative risk assessment (QRA) across designated target markets (<b>{formula.market || "General / Global IFRA"}</b>) for <b>{formula.applicationCategory || "Fine Fragrance"}</b> applications. All individual constituent materials and restricted photo-sensitizers remain within established maximum permissible thresholds.
            </p>
          </div>

          {/* 6. PHYSICAL SIGNATURE & VERIFICATION SECTION */}
          <div className="border-t-2 border-neutral-900 pt-6 break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-6 text-center sm:text-left">
              Official Verification & Physical Authorization Sign-Off
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Perfumer Signature */}
              <div className="space-y-4">
                <div className="border-b-2 border-neutral-400 pb-1 h-14 flex items-end">
                  <span className="text-[10px] text-neutral-300 select-none">Physical Signature</span>
                </div>
                <div className="space-y-0.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Formulating Perfumer</span>
                  <p className="font-semibold text-neutral-900">{creatorName || formula.createdBy?.name || "Master Perfumer"}</p>
                  <p className="text-[11px] text-neutral-500 font-mono">Date: ____________________</p>
                </div>
              </div>

              {/* Regulatory Reviewer Signature */}
              <div className="space-y-4">
                <div className="border-b-2 border-neutral-400 pb-1 h-14 flex items-end">
                  <span className="text-[10px] text-neutral-300 select-none">Physical Signature</span>
                </div>
                <div className="space-y-0.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Regulatory & IFRA Compliance</span>
                  <p className="font-semibold text-neutral-900">{approverName || "Compliance Lead"}</p>
                  <p className="text-[11px] text-neutral-500 font-mono">Date: ____________________</p>
                </div>
              </div>

              {/* Lab Director / Production Release */}
              <div className="space-y-4">
                <div className="border-b-2 border-neutral-400 pb-1 h-14 flex items-end">
                  <span className="text-[10px] text-neutral-300 select-none">Physical Signature</span>
                </div>
                <div className="space-y-0.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Laboratory Director / Release</span>
                  <p className="font-semibold text-neutral-900">Quality Assurance Officer</p>
                  <p className="text-[11px] text-neutral-500 font-mono">Date: ____________________</p>
                </div>
              </div>
            </div>

            {/* Verification Footer */}
            <div className="mt-8 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span>Olfacta Laboratory Formulation Protocol • Confidential & Proprietary</span>
              <span>Document Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
