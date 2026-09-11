"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createBatch } from "@/services/batch/actions";
import { getFormula } from "@/services/formula/actions";
import { calculateScaleFactor, calculateScaledQuantity, decimalRound } from "@/lib/calculations";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import {
  Factory,
  FlaskConical,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Scale,
  Sparkles,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  Search,
  Beaker,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";

interface CreateBatchClientProps {
  approvedFormulas?: any[];
  initialFormula?: any;
  initialFormulaId: string;
  initialVersionId: string;
}

export function CreateBatchClient({
  approvedFormulas = [],
  initialFormula = null,
  initialFormulaId,
  initialVersionId,
}: CreateBatchClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const hasFormulaSelected = !!initialFormulaId;

  const filteredFormulas = useMemo(() => {
    if (!searchTerm.trim()) return approvedFormulas;
    const term = searchTerm.toLowerCase();
    return approvedFormulas.filter(
      (f) =>
        f.name?.toLowerCase().includes(term) ||
        f.productType?.toLowerCase().includes(term) ||
        f.applicationCategory?.toLowerCase().includes(term)
    );
  }, [approvedFormulas, searchTerm]);

  // ── Step 1: Approved formula selection ──
  if (!hasFormulaSelected) {
    return (
      <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
        {/* Stepper indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
              1
            </span>
            Select Approved Formula
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          <div className="flex items-center gap-1.5 text-muted-foreground/70 px-3 py-1 rounded-full">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px]">
              2
            </span>
            Configure & Scale Batch
          </div>
        </div>

        {/* Page Header with Action bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Factory className="h-6 w-6 text-primary" />
              Create Production Batch
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select an approved laboratory formula specification to scale and initiate a manufacturing batch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search approved formulas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Link href="/formulas">
              <Button variant="outline" size="sm" className="h-9 text-xs">
                All Formulas
              </Button>
            </Link>
          </div>
        </div>

        {approvedFormulas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <FlaskConical className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base">No Approved Formulas Found</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Only formulas that have undergone review and received formal QA approval can be scaled for production compounding.
                </p>
              </div>
              <Link href="/formulas">
                <Button variant="default" size="sm" className="mt-2">
                  Go to Formulas Pipeline
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredFormulas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No formulas match &quot;{searchTerm}&quot;. Try adjusting your search term.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Showing {filteredFormulas.length} approved specification{filteredFormulas.length !== 1 ? "s" : ""}</span>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50">
                Production Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFormulas.map((f) => {
                const ver = f.versions?.[0];
                return (
                  <Link
                    key={f.id}
                    href={`/batches/new?formulaId=${f.id}&versionId=${ver?.id || ""}`}
                    className="group focus:outline-none"
                  >
                    <Card className="h-full border border-border/80 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col bg-card">
                      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 shadow-xs">
                              <FlaskConical className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="bg-emerald-50/80 text-emerald-700 border-emerald-200 font-semibold text-[10px] tracking-wide uppercase px-2 py-0.5 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Approved
                            </Badge>
                          </div>

                          <div>
                            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {f.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                v{ver?.versionNumber || 1}.0
                              </span>
                              {f.productType && (
                                <span className="text-xs text-muted-foreground capitalize">
                                  {f.productType.replace(/_/g, " ").toLowerCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border/60 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-muted/40 rounded-md p-2">
                              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                                Reference Size
                              </p>
                              <p className="font-bold font-mono text-sm text-foreground mt-0.5">
                                {ver?.targetWeight?.toLocaleString() || "1,000"} {ver?.weightUnit || "g"}
                              </p>
                            </div>
                            <div className="bg-muted/40 rounded-md p-2">
                              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                                Status
                              </p>
                              <p className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                                Ready to Scale
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-muted-foreground">Click to configure run</span>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                              Scale Batch <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Step 2: Batch creation form (formulaId is in URL) ──
  return (
    <BatchCreationForm
      approvedFormulas={approvedFormulas}
      initialFormula={initialFormula}
      initialFormulaId={initialFormulaId}
      initialVersionId={initialVersionId}
    />
  );
}

// ─────────────────────────────────────────────
// Batch Creation Form (Step 2: Scaling & Details)
// ─────────────────────────────────────────────
function BatchCreationForm({
  approvedFormulas,
  initialFormula,
  initialFormulaId,
  initialVersionId,
}: {
  approvedFormulas: any[];
  initialFormula: any;
  initialFormulaId: string;
  initialVersionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formula, setFormula] = useState<any>(initialFormula);
  const [targetQuantity, setTargetQuantity] = useState(25000);
  const [notes, setNotes] = useState(
    "Pilot production run. Compound neat concentrates in stainless steel vessel, rest for 48h before ethanol addition."
  );

  useEffect(() => {
    if (initialFormulaId && !formula) {
      getFormula(initialFormulaId)
        .then(setFormula)
        .catch(() => toast.error("Formula not found or insufficient permissions"));
    }
  }, [initialFormulaId]);

  const version =
    formula?.versions?.find((v: any) => v.id === initialVersionId) ||
    formula?.versions?.find((v: any) => v.status === "APPROVED") ||
    formula?.versions?.[0];

  const baseWeight = version?.targetWeight || 1000;
  const weightUnit = version?.weightUnit || "g";

  const scaleFactor = version
    ? calculateScaleFactor(targetQuantity, baseWeight)
    : 1;

  // Preset scaling chips
  const scalePresets = [
    { label: "1 kg", value: 1000 },
    { label: "5 kg", value: 5000 },
    { label: "10 kg", value: 10000 },
    { label: "25 kg", value: 25000 },
    { label: "50 kg", value: 50000 },
    { label: "100 kg", value: 100000 },
  ];

  // Calculate ingredients with fallback percentages
  const ingredientsList = useMemo(() => {
    if (!version?.ingredients) return [];
    return version.ingredients.map((fi: any, idx: number) => {
      // Calculate percentage fallback if not stored
      const percentage =
        fi.percentage ??
        (baseWeight > 0 ? (fi.quantity / baseWeight) * 100 : 0);
      const scaledQty = calculateScaledQuantity(fi.quantity, scaleFactor);
      return {
        ...fi,
        index: idx + 1,
        calculatedPercentage: percentage,
        scaledQuantity: scaledQty,
      };
    });
  }, [version, baseWeight, scaleFactor]);

  const totalFormulaQty = useMemo(() => {
    return ingredientsList.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0);
  }, [ingredientsList]);

  const totalScaledWeight = useMemo(() => {
    return ingredientsList.reduce((acc: number, item: any) => acc + (item.scaledQuantity || 0), 0);
  }, [ingredientsList]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formula || !version) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("formulaId", formula.id);
    formData.append("formulaVersionId", version.id);
    formData.append("targetQuantity", targetQuantity.toString());
    formData.append("unit", weightUnit);
    if (notes) formData.append("notes", notes);

    const result = await createBatch(formData);
    setLoading(false);

    if (result.success && result.data) {
      toast.success("Production batch created successfully");
      router.push(`/batches/${result.data.id}`);
    } else {
      toast.error(result.error || "Failed to create batch");
    }
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
      {/* Stepper Navigation */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/batches/new"
            className="flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1 rounded-md hover:bg-muted"
          >
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span>1. Formula: <strong className="text-foreground">{formula?.name || "Selected"}</strong></span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          <div className="flex items-center gap-1.5 font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
              2
            </span>
            <span>Configure & Scale Production Batch</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => router.push("/batches/new")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Change Formula
        </Button>
      </div>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl mt-0.5"
            onClick={() => router.push("/batches/new")}
            title="Back to Formula Selection"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Create Production Batch
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Scaling <strong className="text-foreground">&quot;{formula?.name}&quot;</strong> (v{version?.versionNumber || 1}) for commercial compounding & dispensing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 font-semibold text-xs flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Approved Specification
          </Badge>
        </div>
      </div>

      {formula && version ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): Scaling Controls */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Scale className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">
                          Batch Scaling & Target Volume
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Enter target output or select a commercial run preset
                        </CardDescription>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded">
                      Base: {baseWeight.toLocaleString()} {weightUnit}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Target Batch Size Input & Preset Chips */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="targetQuantity" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Target Production Batch Size ({weightUnit})
                      </Label>
                      <span className="text-xs font-mono font-medium text-primary">
                        = {(targetQuantity / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                      </span>
                    </div>

                    <div className="relative">
                      <Input
                        id="targetQuantity"
                        name="targetQuantity"
                        type="number"
                        step="1"
                        value={targetQuantity}
                        onChange={(e) => setTargetQuantity(parseFloat(e.target.value) || 0)}
                        min="1"
                        required
                        className="h-12 text-lg font-mono font-bold pl-4 pr-16 bg-background border-input focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                        <span>grams</span>
                      </div>
                    </div>

                    {/* Quick Scale Presets */}
                    <div className="pt-1">
                      <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">
                        Quick Presets:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {scalePresets.map((preset) => {
                          const isSelected = targetQuantity === preset.value;
                          const factor = (preset.value / baseWeight).toFixed(0);
                          return (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => setTargetQuantity(preset.value)}
                              className={`text-xs px-3 py-1.5 rounded-md font-mono transition-all cursor-pointer flex items-center gap-1.5 border ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                                  : "bg-background hover:bg-muted border-input text-foreground hover:border-muted-foreground/40"
                              }`}
                            >
                              <span>{preset.label}</span>
                              <span className={`text-[10px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                ({factor}×)
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Multiplier Highlight Banner */}
                  <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                        Automatic Scaling Multiplier
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono tracking-tight text-primary">
                          {decimalRound(scaleFactor, 2)}×
                        </span>
                        <span className="text-xs text-muted-foreground">
                          factor applied to all {ingredientsList.length} raw materials
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs hidden sm:block bg-background/80 px-3 py-2 rounded-lg border">
                      <p className="text-muted-foreground text-[10px] uppercase">Scaling Ratio</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {baseWeight} g &rarr; {targetQuantity.toLocaleString()} g
                      </p>
                    </div>
                  </div>

                  {/* Batch Instructions / Notes */}
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Batch Instructions & Lot Notes
                    </Label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none leading-relaxed"
                      placeholder="E.g., Pilot allocation, QA sign-off requirement, storage temperature 18-20°C, maceration period..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/batches/new")}
                      className="text-xs"
                    >
                      &larr; Choose Another Formula
                    </Button>

                    <Button
                      type="submit"
                      disabled={loading || targetQuantity <= 0}
                      className="gap-2 text-xs font-semibold px-5 h-10 shadow-sm"
                    >
                      <Factory className="h-4 w-4" />
                      {loading ? "Generating Batch Record..." : "Create Batch Sheet & Start Production"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (5 cols): Formula Specification Dossier */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border shadow-xs bg-card">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                        <FlaskConical className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          Formula Specification Dossier
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Approved Master Formulation Data
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background">
                      v{version.versionNumber}.0
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-xs">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {formula.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formula.description || "Fine fragrance composition approved for industrial manufacturing."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-2.5 rounded-lg border bg-muted/20 space-y-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Product Type
                      </p>
                      <p className="font-semibold text-foreground capitalize">
                        {formula.productType ? formula.productType.replace(/_/g, " ").toLowerCase() : "Eau de Parfum"}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-muted/20 space-y-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Application Category
                      </p>
                      <p className="font-semibold text-foreground">
                        {formula.applicationCategory || "Fine Fragrance"}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-muted/20 space-y-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Reference Formula Size
                      </p>
                      <p className="font-bold font-mono text-foreground">
                        {baseWeight.toLocaleString()} {weightUnit}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-muted/20 space-y-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Material Count
                      </p>
                      <p className="font-bold font-mono text-foreground">
                        {ingredientsList.length} Raw Materials
                      </p>
                    </div>
                  </div>

                  {/* Quality & Compliance Banner */}
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800/40 p-3 flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-[11px]">
                      <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                        IFRA &amp; Safety Compliance Verified
                      </p>
                      <p className="text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                        This formula version meets all regulatory concentration limits. Dispensing record will preserve exact batch lot traceability.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/40 p-3 flex items-start gap-2.5 text-[11px] text-muted-foreground">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <p className="leading-relaxed">
                      Creating this batch sheet will generate a unique Batch Number (e.g. <code>BAT-2026-XXXX</code>) and initialize tare scale verification for the compounding laboratory.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Scaled Ingredients Preview Table */}
          {ingredientsList.length > 0 && (
            <Card className="border shadow-xs overflow-hidden">
              <CardHeader className="p-4 bg-muted/30 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Scaled Material Dispensing Breakdown
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Target compounding quantities scaled by {decimalRound(scaleFactor, 2)}× for production dispensing
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Target Batch Output:</span>
                    <Badge variant="default" className="font-mono text-xs px-2.5 py-0.5 bg-primary text-primary-foreground">
                      {targetQuantity.toLocaleString()} {weightUnit} ({(targetQuantity / 1000).toFixed(2)} kg)
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b bg-muted/10 font-semibold">
                      <th className="px-4 py-3 w-12 text-center">#</th>
                      <th className="px-4 py-3 min-w-[200px]">Raw Material</th>
                      <th className="px-4 py-3">Material Type</th>
                      <th className="px-4 py-3 text-right font-mono">Formula Qty (1×)</th>
                      <th className="px-4 py-3 text-right font-mono min-w-[120px]">Formula %</th>
                      <th className="px-4 py-3 text-right font-mono bg-primary/5 min-w-[160px] text-primary">
                        Target Batch Quantity ({decimalRound(scaleFactor, 2)}×)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ingredientsList.map((item: any) => {
                      const pct = decimalRound(item.calculatedPercentage, 2);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/40 transition-colors group"
                        >
                          <td className="px-4 py-2.5 text-center font-mono text-muted-foreground text-[11px]">
                            {item.index}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-foreground text-xs group-hover:text-primary transition-colors">
                              {item.ingredient.name}
                            </div>
                            {item.ingredient.casNumber && (
                              <div className="text-[10px] font-mono text-muted-foreground">
                                CAS: {item.ingredient.casNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border">
                              {item.ingredient.materialType || "AROMA CHEMICAL"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                            {decimalRound(item.quantity, 2)} {item.unit}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
                                <div
                                  className="h-full bg-primary/70 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                                />
                              </div>
                              <span className="text-muted-foreground font-medium">
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-foreground bg-primary/5 text-sm">
                            <span className="text-primary">
                              {decimalRound(item.scaledQuantity, 2)}
                            </span>{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              {item.unit}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold bg-muted/20">
                      <td colSpan={3} className="px-4 py-3 text-xs uppercase tracking-wider text-foreground">
                        Total Formulation Output
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {decimalRound(totalFormulaQty, 2)} {weightUnit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        100.00%
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-primary bg-primary/10 text-sm">
                        {decimalRound(totalScaledWeight, 2)} {weightUnit}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          )}
        </form>
      ) : (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto animate-pulse">
              <FlaskConical className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Loading formula specification...</p>
            <p className="text-xs text-muted-foreground">Retrieving ingredients and batch scaling parameters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
