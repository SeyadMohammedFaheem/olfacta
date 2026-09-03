import { getIngredient } from "@/services/ingredient/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, ComplianceBadge, DemoBadge } from "@/components/ui/status-badge";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  Droplets,
  DollarSign,
  ShieldCheck,
  Building2,
  Layers,
  Sparkles,
  Scale,
  ExternalLink,
  Plus,
  Info,
  Percent,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Raw Material Detail — Olfacta" };

const materialTypeLabels: Record<string, { label: string; color: string }> = {
  FRAGRANCE: { label: "Fragrance Accord", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  ESSENTIAL_OIL: { label: "Essential Oil (Natural)", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  AROMA_CHEMICAL: { label: "Aroma Chemical / Isolate", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  EXTRACT: { label: "Extract / Absolute", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  SOLVENT: { label: "Solvent / Carrier", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  BASE: { label: "Base Carrier", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  OTHER: { label: "Specialty Material", color: "bg-muted text-muted-foreground border-border" },
};

export default async function IngredientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let ingredient: any;
  try {
    ingredient = await getIngredient(id);
  } catch {
    redirect("/ingredients");
  }

  const matType = materialTypeLabels[ingredient.materialType] || {
    label: ingredient.materialType,
    color: "bg-muted text-muted-foreground",
  };

  const preferredSupplier = ingredient.ingredientSuppliers?.find((is: any) => is.isPreferred) || ingredient.ingredientSuppliers?.[0];
  const uniqueFormulas = ingredient.formulaIngredients || [];

  let parsedComposition: Array<{ name: string; percentage: number }> = [];
  if (ingredient.compositionBreakdown) {
    try {
      parsedComposition = JSON.parse(ingredient.compositionBreakdown);
    } catch {
      // fallback
    }
  }

  return (
    <div className="p-6 space-y-6 w-full">
      {/* ─── Breadcrumb Navigation ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/ingredients"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer text-xs font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Raw Materials & Oils</span>
          </Link>
          <span className="text-muted-foreground/40 text-xs">/</span>
          <span className="text-foreground font-semibold text-xs truncate max-w-[200px] sm:max-w-xs">{ingredient.name}</span>
        </div>

        <Button variant="outline" size="sm" asChild className="cursor-pointer">
          <Link href="/formulas/new">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Use in New Formula
          </Link>
        </Button>
      </div>

      {/* ─── Hero Header Card ───────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${matType.color}`}>
                <Droplets className="mr-1.5 h-3 w-3" />
                {matType.label}
              </span>
              {ingredient.casNumber && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-muted/60 text-muted-foreground border border-border">
                  CAS: {ingredient.casNumber}
                </span>
              )}
              <Badge variant={ingredient.status === "ACTIVE" ? "compliant" : "draft"} className="text-xs">
                {ingredient.status}
              </Badge>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono border ${
                ingredient.dilutionPercentage && ingredient.dilutionPercentage < 100
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              }`}>
                {ingredient.dilutionPercentage && ingredient.dilutionPercentage < 100
                  ? `${ingredient.dilutionPercentage}% in ${ingredient.diluentSolvent || "DPG"}`
                  : "100% Pure (Neat)"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {ingredient.name}
            </h1>

            {ingredient.inciName && (
              <p className="text-xs font-mono text-muted-foreground tracking-wide uppercase">
                INCI: {ingredient.inciName}
              </p>
            )}
          </div>
        </div>

        {ingredient.description && (
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p>{ingredient.description}</p>
          </div>
        )}
      </div>

      {/* ─── Key Metrics Highlight Strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5 text-primary" /> Dilution Ratio
          </span>
          <p className="text-xl font-bold font-mono text-foreground">
            {ingredient.dilutionPercentage ? `${ingredient.dilutionPercentage}%` : "100%"}
          </p>
          <span className="text-[11px] text-muted-foreground block truncate">
            {ingredient.dilutionPercentage && ingredient.dilutionPercentage < 100
              ? `Carrier: ${ingredient.diluentSolvent || "DPG"}`
              : "Pure (Neat) Stock"}
          </span>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-primary" /> Cost per Gram
          </span>
          <p className="text-xl font-bold font-mono text-foreground">
            {ingredient.costPerUnit ? `$${ingredient.costPerUnit.toFixed(2)}` : "—"}
          </p>
          {ingredient.costPerUnit ? (
            <span className="text-[11px] text-muted-foreground block font-mono">
              ${(ingredient.costPerUnit * 1000).toFixed(2)} / kg
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground block">
              Not specified
            </span>
          )}
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-primary" /> Density
          </span>
          <p className="text-xl font-bold font-mono text-foreground">
            {ingredient.density ? `${ingredient.density} g/mL` : "1.000 g/mL"}
          </p>
          <span className="text-[11px] text-muted-foreground block">
            {ingredient.density ? "Calibrated at 20°C" : "Default specific gravity"}
          </span>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" /> Active Formulas
          </span>
          <p className="text-xl font-bold font-mono text-foreground">
            {uniqueFormulas.length}
          </p>
          <span className="text-[11px] text-muted-foreground block">
            Formulas in laboratory
          </span>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" /> Primary Source
          </span>
          <p className="text-sm font-semibold truncate text-foreground mt-1">
            {preferredSupplier?.supplier?.name || "Self-sourced / Lab"}
          </p>
          <span className="text-[11px] text-muted-foreground block">
            {preferredSupplier?.isPreferred ? "Preferred Supplier" : "Standard Source"}
          </span>
        </div>
      </div>

      {/* ─── Detailed Grid Sections ─────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chemical & Olfactory Profile */}
        <Card>
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" /> Chemical & Physical Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3.5 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Chemical Identifier</span>
              <span className="font-semibold text-foreground">{ingredient.name}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Stock Dilution</span>
              <span className="font-mono font-semibold text-foreground">
                {ingredient.dilutionPercentage ? `${ingredient.dilutionPercentage}%` : "100%"} {ingredient.dilutionPercentage && ingredient.dilutionPercentage < 100 ? `in ${ingredient.diluentSolvent || "DPG"}` : "(Pure Neat)"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Carrier / Solvent</span>
              <span className="font-medium text-foreground">{ingredient.diluentSolvent || "None (Pure)"}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">CAS Registry Number</span>
              <span className="font-mono font-medium text-foreground">{ingredient.casNumber || "Unassigned / Natural Complex"}</span>
            </div>
            <div className="flex items-start justify-between py-1 border-b border-border/50 gap-4">
              <span className="text-muted-foreground shrink-0">INCI Nomenclature</span>
              <span className="font-mono text-xs text-foreground text-right">{ingredient.inciName || ingredient.name}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Material Classification</span>
              <span className="font-medium text-foreground">{matType.label}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Cost Currency</span>
              <span className="font-mono font-medium text-foreground">{ingredient.costCurrency || "USD ($)"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Accord / Blend Formula Composition (Mixing of What) */}
        {(parsedComposition.length > 0 || ingredient.materialType === "FRAGRANCE") && (
          <Card className="md:col-span-2 border-primary/20 bg-primary/[0.01]">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Accord Mixing Formula & Sub-Components
                </CardTitle>
                <CardDescription className="text-xs">
                  Detailed breakdown of raw materials and percentage ratios that create this compound accord / blend
                </CardDescription>
              </div>
              {parsedComposition.length > 0 && (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border bg-primary/10 text-primary border-primary/20">
                  {parsedComposition.length} Components • {parsedComposition.reduce((sum, c) => sum + c.percentage, 0)}% Total
                </span>
              )}
            </CardHeader>
            <CardContent className="p-5">
              {parsedComposition.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {parsedComposition.map((comp, idx) => (
                    <div key={idx} className="rounded-lg border bg-card p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground">{comp.name}</span>
                        <span className="font-mono font-bold text-sm text-primary">{comp.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(5, comp.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground space-y-1">
                  <p className="text-xs font-medium text-foreground">Proprietary or monolithic accord formula</p>
                  <p className="text-[11px] text-muted-foreground">No individual component materials recorded for this blend.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Safety & Regulatory Rules */}
        <Card>
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Safety & Regulatory Rules ({ingredient.regulatoryRules?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {ingredient.regulatoryRules && ingredient.regulatoryRules.length > 0 ? (
              <div className="space-y-2.5">
                {ingredient.regulatoryRules.map((rule: any) => (
                  <div key={rule.id} className="rounded-lg border p-3 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ComplianceBadge status={rule.severity} />
                        <span className="text-xs font-semibold">{rule.ruleType.replace(/_/g, " ")}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {rule.standard || rule.market || "IFRA Standard"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground">Configured Maximum Limit:</span>
                      <span className="font-bold font-mono text-foreground">
                        {rule.limitValue !== null ? `${rule.limitValue}%` : "Prohibited"}
                      </span>
                    </div>
                    {rule.message && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">{rule.message}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground space-y-2">
                <ShieldCheck className="h-6 w-6 mx-auto text-compliant" />
                <p className="text-xs font-medium text-foreground">No specific ingredient restrictions</p>
                <p className="text-[11px] text-muted-foreground">
                  Evaluates under general category limits when formulated.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commercial Suppliers & Sourcing */}
        <Card>
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Sourcing & Suppliers ({ingredient.ingredientSuppliers?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {ingredient.ingredientSuppliers?.length > 0 ? (
              <div className="space-y-3">
                {ingredient.ingredientSuppliers.map((is: any) => (
                  <div key={is.id} className="flex items-center justify-between rounded-lg border p-3.5 hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{is.supplier.name}</span>
                        {is.isPreferred && <Badge variant="compliant" className="text-[10px] py-0 px-1.5">Preferred</Badge>}
                      </div>
                      {is.supplierSku && (
                        <span className="text-xs font-mono text-muted-foreground block mt-0.5">SKU: {is.supplierSku}</span>
                      )}
                    </div>

                    {is.supplier.email && (
                      <span className="text-xs text-muted-foreground">{is.supplier.email}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                No specific suppliers linked to this material.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Formulas Using This Ingredient */}
        <Card>
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Used in Formulas ({uniqueFormulas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {uniqueFormulas.length > 0 ? (
              <div className="space-y-2">
                {uniqueFormulas.map((fi: any) => (
                  <Link
                    key={fi.id}
                    href={`/formulas/${fi.formulaVersion.formula.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {fi.formulaVersion.formula.name}
                        </span>
                        <StatusBadge status={fi.formulaVersion.formula.status} />
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {fi.formulaVersion.formula.productType.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-foreground">{fi.quantity} {fi.unit}</span>
                      <span className="text-xs text-primary flex items-center justify-end gap-0.5 mt-0.5 group-hover:underline">
                        Open <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground space-y-2">
                <p className="text-xs">Not used in any active formulas yet.</p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/formulas/new">Create First Formula</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
