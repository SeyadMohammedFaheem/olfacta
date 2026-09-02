"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, CheckCircle, XCircle, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateBatchStatus, updateBatchIngredientActual } from "@/services/batch/actions";
import { decimalRound, calculateBatchDifference } from "@/lib/calculations";
import { formatDate } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import type { SessionUser } from "@/types";
import { toast } from "sonner";

interface BatchDetailClientProps {
  batch: any;
  user: SessionUser;
}

export function BatchDetailClient({ batch, user }: BatchDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [ingredients, setIngredients] = useState(
    batch.ingredients.map((bi: any) => ({
      id: bi.id,
      name: bi.ingredient.name,
      materialType: bi.ingredient.materialType,
      targetQuantity: bi.targetQuantity,
      actualQuantity: bi.actualQuantity ?? "",
      difference: bi.difference ?? null,
      unit: bi.unit,
    }))
  );

  const canEdit =
    (user.role === "ADMIN" || user.role === "PRODUCTION") &&
    (batch.status === "PLANNED" || batch.status === "IN_PRODUCTION" || batch.status === "QC");

  const handleActualChange = (index: number, val: string) => {
    const num = val === "" ? "" : parseFloat(val);
    setIngredients((prev: any[]) => {
      const updated = [...prev];
      const target = updated[index].targetQuantity;
      const actual = typeof num === "number" ? num : null;
      const diff = actual !== null ? calculateBatchDifference(actual, target).difference : null;

      updated[index] = {
        ...updated[index],
        actualQuantity: val,
        difference: diff,
      };
      return updated;
    });
  };

  const handleSaveRow = async (index: number) => {
    const item = ingredients[index];
    if (item.actualQuantity === "") return;
    const actual = parseFloat(item.actualQuantity);

    startTransition(async () => {
      const res = await updateBatchIngredientActual(item.id, actual);
      if (res.success) {
        toast.success(`Updated ${item.name}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update quantity");
      }
    });
  };

  const handleStatusChange = (status: "IN_PRODUCTION" | "QC" | "COMPLETED" | "CANCELLED") => {
    startTransition(async () => {
      const res = await updateBatchStatus(batch.id, status);
      if (res.success) {
        toast.success(`Batch status updated to ${status}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update batch status");
      }
    });
  };

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/batches" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{batch.batchNumber}</h1>
              <StatusBadge status={batch.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Formula: <Link href={`/formulas/${batch.formula.id}`} className="hover:underline font-medium">{batch.formula.name}</Link> (v{batch.formulaVersion.versionNumber})
            </p>
          </div>
        </div>

        {/* Workflow actions */}
        <div className="flex items-center gap-2">
          {batch.status === "PLANNED" && hasPermission(user.role, "batch:edit") && (
            <Button size="sm" onClick={() => handleStatusChange("IN_PRODUCTION")} disabled={isPending}>
              <Play className="mr-1.5 h-3.5 w-3.5" /> Start Production
            </Button>
          )}
          {batch.status === "IN_PRODUCTION" && hasPermission(user.role, "batch:edit") && (
            <Button size="sm" onClick={() => handleStatusChange("QC")} disabled={isPending}>
              <AlertCircle className="mr-1.5 h-3.5 w-3.5" /> Send to QC
            </Button>
          )}
          {batch.status === "QC" && hasPermission(user.role, "batch:complete") && (
            <Button size="sm" className="bg-compliant hover:bg-compliant/90" onClick={() => handleStatusChange("COMPLETED")} disabled={isPending}>
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Complete Batch
            </Button>
          )}
          {batch.status !== "COMPLETED" && batch.status !== "CANCELLED" && hasPermission(user.role, "batch:cancel") && (
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleStatusChange("CANCELLED")} disabled={isPending}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Cancel Batch
            </Button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Target Batch Size</span>
            <p className="text-lg font-semibold tabular-nums mt-0.5">{batch.targetQuantity.toLocaleString()} {batch.unit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Formula Size</span>
            <p className="text-lg font-semibold tabular-nums mt-0.5">{batch.formulaVersion.targetWeight} {batch.unit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Scaling Factor</span>
            <p className="text-lg font-semibold tabular-nums mt-0.5">{batch.scaleFactor}×</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Created At</span>
            <p className="text-sm font-semibold mt-0.5">{formatDate(batch.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Ingredients Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Batch Sheet & Dispensing Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Ingredient</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium text-right">Target Qty</th>
                  <th className="px-5 py-3 font-medium w-40">Actual Qty ({batch.unit})</th>
                  <th className="px-5 py-3 font-medium text-right">Difference</th>
                  <th className="px-5 py-3 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item: any, idx: number) => {
                  const hasDiff = item.difference !== null && item.difference !== 0;
                  return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-5 py-3 font-medium">{item.name}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{item.materialType.replace(/_/g, " ")}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-mono">{decimalRound(item.targetQuantity, 2)} {item.unit}</td>
                      <td className="px-5 py-3">
                        {canEdit ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.actualQuantity}
                            onChange={(e) => handleActualChange(idx, e.target.value)}
                            placeholder="0.00"
                            className="h-8 w-32 font-mono text-sm"
                          />
                        ) : (
                          <span className="font-mono">{item.actualQuantity !== "" ? `${item.actualQuantity} ${item.unit}` : "—"}</span>
                        )}
                      </td>
                      <td className={`px-5 py-3 text-right tabular-nums font-mono text-xs ${hasDiff ? (item.difference > 0 ? "text-warning" : "text-violation") : "text-muted-foreground"}`}>
                        {item.difference !== null ? `${item.difference > 0 ? "+" : ""}${decimalRound(item.difference, 2)} ${item.unit}` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {canEdit && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveRow(idx)} disabled={isPending || item.actualQuantity === ""}>
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                        )}
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
