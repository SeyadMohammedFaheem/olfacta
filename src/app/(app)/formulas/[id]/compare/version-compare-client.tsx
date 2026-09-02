"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, GitCompare, ArrowRight, Plus, Minus, Equal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculatePercentage, decimalRound } from "@/lib/calculations";

interface VersionCompareClientProps {
  formula: any;
  initialV1?: number;
  initialV2?: number;
}

export function VersionCompareClient({ formula, initialV1, initialV2 }: VersionCompareClientProps) {
  const versions = formula.versions || [];

  const defaultV1 = initialV1 || versions[versions.length - 1]?.versionNumber || 1;
  const defaultV2 = initialV2 || versions[0]?.versionNumber || 1;

  const [v1Num, setV1Num] = useState<number>(defaultV1);
  const [v2Num, setV2Num] = useState<number>(defaultV2);

  const versionA = versions.find((v: any) => v.versionNumber === v1Num) || versions[0];
  const versionB = versions.find((v: any) => v.versionNumber === v2Num) || versions[0];

  // Calculate total weights for each version
  const totalWeightA = versionA?.ingredients?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
  const totalWeightB = versionB?.ingredients?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;

  // Build unified ingredient map
  const ingredientMap = new Map<string, {
    id: string;
    name: string;
    casNumber?: string;
    materialType: string;
    qtyA: number | null;
    pctA: number | null;
    qtyB: number | null;
    pctB: number | null;
  }>();

  // Populate from A
  versionA?.ingredients?.forEach((fi: any) => {
    const pct = totalWeightA > 0 ? calculatePercentage(fi.quantity, totalWeightA) : 0;
    ingredientMap.set(fi.ingredient.id, {
      id: fi.ingredient.id,
      name: fi.ingredient.name,
      casNumber: fi.ingredient.casNumber,
      materialType: fi.ingredient.materialType,
      qtyA: fi.quantity,
      pctA: pct,
      qtyB: null,
      pctB: null,
    });
  });

  // Populate from B
  versionB?.ingredients?.forEach((fi: any) => {
    const pct = totalWeightB > 0 ? calculatePercentage(fi.quantity, totalWeightB) : 0;
    const existing = ingredientMap.get(fi.ingredient.id);
    if (existing) {
      existing.qtyB = fi.quantity;
      existing.pctB = pct;
    } else {
      ingredientMap.set(fi.ingredient.id, {
        id: fi.ingredient.id,
        name: fi.ingredient.name,
        casNumber: fi.ingredient.casNumber,
        materialType: fi.ingredient.materialType,
        qtyA: null,
        pctA: null,
        qtyB: fi.quantity,
        pctB: pct,
      });
    }
  });

  const diffRows = Array.from(ingredientMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/formulas/${formula.id}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Version Comparison: {formula.name}</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inspect formulation evolution, material additions, removals, and dosage deltas
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href={`/formulas/${formula.id}`}>Return to Workspace</Link>
        </Button>
      </div>

      {/* Version Pickers Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Base:</span>
              <Select value={String(v1Num)} onValueChange={(val) => setV1Num(parseInt(val))}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v: any) => (
                    <SelectItem key={v.id} value={String(v.versionNumber)}>
                      v{v.versionNumber} ({v.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <StatusBadge status={versionA?.status || "DRAFT"} />
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Compare with:</span>
              <Select value={String(v2Num)} onValueChange={(val) => setV2Num(parseInt(val))}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v: any) => (
                    <SelectItem key={v.id} value={String(v.versionNumber)}>
                      v{v.versionNumber} ({v.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <StatusBadge status={versionB?.status || "DRAFT"} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Ingredient Formulation Delta</CardTitle>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-compliant">
                <Plus className="h-3.5 w-3.5" /> Added Material
              </span>
              <span className="flex items-center gap-1 text-violation">
                <Minus className="h-3.5 w-3.5" /> Removed Material
              </span>
              <span className="flex items-center gap-1 text-warning">
                <Equal className="h-3.5 w-3.5" /> Dosage Modified
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b bg-muted/20">
                  <th className="px-5 py-3 font-medium">Ingredient</th>
                  <th className="px-5 py-3 font-medium">Material Type</th>
                  <th className="px-5 py-3 font-medium text-right">v{versionA?.versionNumber} Qty (g)</th>
                  <th className="px-5 py-3 font-medium text-right">v{versionA?.versionNumber} %</th>
                  <th className="px-5 py-3 font-medium text-right">v{versionB?.versionNumber} Qty (g)</th>
                  <th className="px-5 py-3 font-medium text-right">v{versionB?.versionNumber} %</th>
                  <th className="px-5 py-3 font-medium text-right">Quantity Delta</th>
                  <th className="px-5 py-3 font-medium text-right">Percentage Delta</th>
                </tr>
              </thead>
              <tbody>
                {diffRows.map((row) => {
                  const isAdded = row.qtyA === null && row.qtyB !== null;
                  const isRemoved = row.qtyA !== null && row.qtyB === null;
                  const qtyDelta = (row.qtyB ?? 0) - (row.qtyA ?? 0);
                  const pctDelta = (row.pctB ?? 0) - (row.pctA ?? 0);
                  const isModified = !isAdded && !isRemoved && qtyDelta !== 0;

                  return (
                    <tr
                      key={row.id}
                      className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${
                        isAdded ? "bg-compliant-bg/30" : isRemoved ? "bg-violation-bg/30" : isModified ? "bg-warning-bg/20" : ""
                      }`}
                    >
                      <td className="px-5 py-3 font-medium">
                        {row.name}
                        {row.casNumber && (
                          <span className="text-xs font-mono text-muted-foreground ml-2">CAS: {row.casNumber}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{row.materialType.replace(/_/g, " ")}</td>
                      <td className="px-5 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {row.qtyA !== null ? `${decimalRound(row.qtyA, 2)} g` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {row.pctA !== null ? `${decimalRound(row.pctA, 2)}%` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs tabular-nums font-medium">
                        {row.qtyB !== null ? `${decimalRound(row.qtyB, 2)} g` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs tabular-nums font-medium">
                        {row.pctB !== null ? `${decimalRound(row.pctB, 2)}%` : "—"}
                      </td>
                      <td className={`px-5 py-3 text-right font-mono text-xs tabular-nums font-semibold ${
                        isAdded ? "text-compliant" : isRemoved ? "text-violation" : isModified ? (qtyDelta > 0 ? "text-warning" : "text-primary") : "text-muted-foreground"
                      }`}>
                        {isAdded ? `+${decimalRound(row.qtyB ?? 0, 2)} g (Added)` :
                         isRemoved ? `-${decimalRound(row.qtyA ?? 0, 2)} g (Removed)` :
                         qtyDelta === 0 ? "0.00 g" :
                         `${qtyDelta > 0 ? "+" : ""}${decimalRound(qtyDelta, 2)} g`}
                      </td>
                      <td className={`px-5 py-3 text-right font-mono text-xs tabular-nums font-semibold ${
                        pctDelta > 0 ? "text-compliant" : pctDelta < 0 ? "text-violation" : "text-muted-foreground"
                      }`}>
                        {pctDelta === 0 ? "0.00%" : `${pctDelta > 0 ? "+" : ""}${decimalRound(pctDelta, 2)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
