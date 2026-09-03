"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createBatch } from "@/services/batch/actions";
import { getFormula } from "@/services/formula/actions";
import { calculateScaleFactor, calculateScaledQuantity, decimalRound } from "@/lib/calculations";
import { toast } from "sonner";

interface CreateBatchClientProps {
  initialFormulaId: string;
  initialVersionId: string;
}

export function CreateBatchClient({ initialFormulaId, initialVersionId }: CreateBatchClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formula, setFormula] = useState<any>(null);
  const [targetQuantity, setTargetQuantity] = useState(25000);

  useEffect(() => {
    if (initialFormulaId) {
      getFormula(initialFormulaId)
        .then(setFormula)
        .catch(() => toast.error("Formula not found or insufficient permissions"));
    }
  }, [initialFormulaId]);

  const version =
    formula?.versions?.find((v: any) => v.id === initialVersionId) ||
    formula?.versions?.[0];
  const scaleFactor = version ? calculateScaleFactor(targetQuantity, version.targetWeight) : 0;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createBatch(formData);
    setLoading(false);

    if (result.success && result.data) {
      toast.success("Batch created successfully");
      router.push(`/batches/${result.data.id}`);
    } else {
      toast.error(result.error || "Failed to create batch");
    }
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Create Production Batch</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Scale an approved formula for production dispensing</p>
      </div>

      {formula && version && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <form action={handleSubmit} className="space-y-5">
                <input type="hidden" name="formulaId" value={formula.id} />
                <input type="hidden" name="formulaVersionId" value={version.id} />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Formula</p>
                    <p className="font-semibold text-base">{formula.name} (v{version.versionNumber})</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Original Formula Size</p>
                    <p className="font-semibold text-base tabular-nums">{version.targetWeight} {version.weightUnit}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetQuantity">Target Batch Size (g)</Label>
                    <Input
                      id="targetQuantity"
                      name="targetQuantity"
                      type="number"
                      step="0.01"
                      value={targetQuantity}
                      onChange={(e) => setTargetQuantity(parseFloat(e.target.value) || 0)}
                      min="0.01"
                      required
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mt-6">Calculated Scale Factor</p>
                    <p className="text-xl font-bold tabular-nums text-primary">{decimalRound(scaleFactor, 2)}×</p>
                  </div>
                </div>

                <input type="hidden" name="unit" value={version.weightUnit} />

                <div className="space-y-2">
                  <Label htmlFor="notes">Batch Instructions / Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    placeholder="E.g., Lot allocation, special maceration period, quality instructions..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                  <Button type="submit" loading={loading}>Create Batch Sheet</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Scaled Ingredients Preview */}
          {version.ingredients && version.ingredients.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="px-5 py-3 font-medium">Ingredient</th>
                      <th className="px-5 py-3 font-medium text-right">Formula Qty</th>
                      <th className="px-5 py-3 font-medium text-right">Formula %</th>
                      <th className="px-5 py-3 font-medium text-right">Target Batch Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {version.ingredients.map((fi: any) => (
                      <tr key={fi.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-2.5 font-medium">{fi.ingredient.name}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground font-mono">
                          {decimalRound(fi.quantity, 2)} {fi.unit}
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
                          {fi.percentage ? `${decimalRound(fi.percentage, 2)}%` : "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums font-semibold font-mono text-foreground">
                          {decimalRound(calculateScaledQuantity(fi.quantity, scaleFactor), 2)} {fi.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!initialFormulaId && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Please select an approved formula from the <Link href="/formulas" className="text-primary underline">Formulas</Link> list to scale for batch production.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
