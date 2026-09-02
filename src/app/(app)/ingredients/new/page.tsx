"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { createIngredient } from "@/services/ingredient/actions";
import { toast } from "sonner";

export default function CreateIngredientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createIngredient(formData);
    setLoading(false);

    if (result.success && result.data) {
      toast.success("Ingredient created");
      router.push(`/ingredients/${result.data.id}`);
    } else {
      toast.error(result.error || "Failed to create ingredient");
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Add Ingredient</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Add a new ingredient to your library</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Ingredient Name</Label>
              <Input id="name" name="name" placeholder="e.g. Bergamot Oil" required autoFocus />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="casNumber">CAS Number</Label>
                <Input id="casNumber" name="casNumber" placeholder="e.g. 8007-75-8" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inciName">INCI Name</Label>
                <Input id="inciName" name="inciName" placeholder="e.g. CITRUS AURANTIUM BERGAMIA" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialType">Material Type</Label>
              <Select name="materialType" defaultValue="AROMA_CHEMICAL">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRAGRANCE">Fragrance</SelectItem>
                  <SelectItem value="ESSENTIAL_OIL">Essential Oil</SelectItem>
                  <SelectItem value="AROMA_CHEMICAL">Aroma Chemical</SelectItem>
                  <SelectItem value="EXTRACT">Extract</SelectItem>
                  <SelectItem value="SOLVENT">Solvent</SelectItem>
                  <SelectItem value="BASE">Base</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dilutionPercentage">Stock Dilution (%)</Label>
                <Input id="dilutionPercentage" name="dilutionPercentage" type="number" min="0.001" max="100" step="any" defaultValue="100" placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diluentSolvent">Carrier / Diluent Solvent</Label>
                <select
                  id="diluentSolvent"
                  name="diluentSolvent"
                  defaultValue="None (Pure)"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="None (Pure)">None (Pure Neat Material)</option>
                  <option value="DPG">DPG (Dipropylene Glycol)</option>
                  <option value="TEC">TEC (Triethyl Citrate)</option>
                  <option value="IPM">IPM (Isopropyl Myristate)</option>
                  <option value="Ethanol 96%">Ethanol 96% / Perfumers Alcohol</option>
                  <option value="Jojoba / FCO">Carrier Oil (FCO / Jojoba)</option>
                  <option value="Other">Other Solvent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="density">Density (g/mL)</Label>
                <Input id="density" name="density" type="number" step="0.001" placeholder="e.g. 0.87" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPerUnit">Cost per g (USD)</Label>
                <Input id="costPerUnit" name="costPerUnit" type="number" step="0.01" placeholder="e.g. 0.50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                placeholder="Notes about this ingredient..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" loading={loading}>Add Ingredient</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
