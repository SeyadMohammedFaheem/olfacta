"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Beaker, Droplets, Sparkles, DollarSign, Building, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { quickCreateOil, deleteIngredient, lookupMaterialApi } from "@/services/ingredient/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const MATERIAL_TYPES = [
  { id: "ALL", label: "All Materials" },
  { id: "ESSENTIAL_OIL", label: "Essential Oils (Naturals)" },
  { id: "AROMA_CHEMICAL", label: "Aroma Chemicals" },
  { id: "EXTRACT", label: "Extracts & Absolutes" },
  { id: "SOLVENT", label: "Solvents & Bases" },
  { id: "FRAGRANCE", label: "Accords & Blends" },
];

export function IngredientsClient({ ingredients, canCreate }: { ingredients: any[]; canCreate: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [addOilOpen, setAddOilOpen] = useState(false);

  // New oil form state
  const [oilForm, setOilForm] = useState({
    name: "",
    materialType: "ESSENTIAL_OIL",
    casNumber: "",
    dilutionPercentage: "100",
    diluentSolvent: "None (Pure)",
    supplierName: "",
    costPerUnit: "",
    description: "",
  });

  const filtered = ingredients.filter((ing) => {
    const matchesType = selectedType === "ALL" || ing.materialType === selectedType;
    const matchesSearch =
      search === "" ||
      ing.name.toLowerCase().includes(search.toLowerCase()) ||
      (ing.casNumber && ing.casNumber.toLowerCase().includes(search.toLowerCase())) ||
      (ing.ingredientSuppliers?.[0]?.supplier?.name &&
        ing.ingredientSuppliers[0].supplier.name.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteIngredient = async () => {
    if (!deleteConfirm) return;
    startTransition(async () => {
      const res = await deleteIngredient(deleteConfirm.id);
      if (res.success) {
        toast.success(`"${deleteConfirm.name}" removed from collection.`);
        setDeleteConfirm(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to remove material.");
      }
    });
  };

  // Auto-fill state
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleAutoFill = async () => {
    if (!oilForm.name.trim()) {
      toast.error("Please enter a material name first.");
      return;
    }
    setIsLookingUp(true);
    try {
      const results = await lookupMaterialApi(oilForm.name);
      if (results && results.length > 0) {
        const match = results[0];
        setOilForm((prev) => ({
          ...prev,
          name: match.name || prev.name,
          materialType: (match.materialType as any) || prev.materialType,
          casNumber: match.casNumber || prev.casNumber,
          description: match.description || prev.description,
        }));
        toast.success(`Found details for "${match.name}" via ${match.source === "PUBCHEM_API" ? "PubChem API" : "Perfumery Database"}!`);
      } else {
        toast.info("No matching material found in online fragrance databases.");
      }
    } catch {
      toast.error("Lookup failed. Check your network connection.");
    } finally {
      setIsLookingUp(false);
    }
  };

  // Accord blend components state
  const [accordComponents, setAccordComponents] = useState<Array<{ name: string; percentage: string }>>([
    { name: "", percentage: "" },
  ]);

  const addAccordComponent = () => {
    setAccordComponents((prev) => [...prev, { name: "", percentage: "" }]);
  };

  const removeAccordComponent = (index: number) => {
    setAccordComponents((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [{ name: "", percentage: "" }]));
  };

  const updateAccordComponent = (index: number, field: "name" | "percentage", value: string) => {
    setAccordComponents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const accordTotalPercentage = accordComponents.reduce(
    (sum, c) => sum + (parseFloat(c.percentage) || 0),
    0
  );

  const handleCreateOil = async () => {
    if (!oilForm.name.trim()) {
      toast.error("Please enter the oil name.");
      return;
    }

    const validComponents = accordComponents
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        percentage: parseFloat(c.percentage) || 0,
      }));

    startTransition(async () => {
      const res = await quickCreateOil({
        name: oilForm.name,
        materialType: oilForm.materialType,
        casNumber: oilForm.casNumber,
        dilutionPercentage: oilForm.dilutionPercentage ? parseFloat(oilForm.dilutionPercentage) : 100,
        diluentSolvent: oilForm.diluentSolvent,
        compositionBreakdown: validComponents.length > 0 ? JSON.stringify(validComponents) : undefined,
        supplierName: oilForm.supplierName,
        costPerUnit: oilForm.costPerUnit ? parseFloat(oilForm.costPerUnit) : undefined,
        description: oilForm.description,
      });

      if (res.success) {
        toast.success(`"${oilForm.name}" added to your collection!`);
        setAddOilOpen(false);
        setOilForm({
          name: "",
          materialType: "ESSENTIAL_OIL",
          casNumber: "",
          dilutionPercentage: "100",
          diluentSolvent: "None (Pure)",
          supplierName: "",
          costPerUnit: "",
          description: "",
        });
        setAccordComponents([{ name: "", percentage: "" }]);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to add oil.");
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">My Raw Materials & Oil Collection</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your laboratory organ of essential oils, aroma molecules, extracts, and carriers ({ingredients.length} total)
          </p>
        </div>

        {canCreate && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddOilOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Oil to Collection
            </Button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Type Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {MATERIAL_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedType === type.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search oils, CAS, supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      {/* Ingredients Grid / Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground space-y-3">
          <Beaker className="h-8 w-8 mx-auto text-muted-foreground/60" />
          <p className="text-sm font-medium">No materials found</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search ? `No materials matching "${search}".` : "Add oils to your collection to use them in your formulas."}
          </p>
          {canCreate && (
            <Button variant="outline" size="sm" onClick={() => setAddOilOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Oil to Collection
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b bg-muted/20">
                <th className="px-5 py-3 font-medium">Material / Oil Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Dilution</th>
                <th className="px-5 py-3 font-medium">CAS Number</th>
                <th className="px-5 py-3 font-medium">Supplier</th>
                <th className="px-5 py-3 font-medium text-right">Cost / g</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ingredient) => (
                <tr key={ingredient.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/ingredients/${ingredient.id}`} className="font-medium hover:underline block">
                      {ingredient.name}
                    </Link>
                    {ingredient.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ingredient.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {ingredient.materialType.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${
                      ingredient.dilutionPercentage && ingredient.dilutionPercentage < 100
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        : "bg-muted/50 text-muted-foreground border-border"
                    }`}>
                      {ingredient.dilutionPercentage && ingredient.dilutionPercentage < 100
                        ? `${ingredient.dilutionPercentage}% in ${ingredient.diluentSolvent || "DPG"}`
                        : "100% Pure"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                    {ingredient.casNumber || "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {ingredient.ingredientSuppliers?.[0]?.supplier?.name || "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-right font-mono">
                    {ingredient.costPerUnit ? `$${ingredient.costPerUnit.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/ingredients/${ingredient.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View Details →
                      </Link>
                      {canCreate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => setDeleteConfirm({ id: ingredient.id, name: ingredient.name })}
                          title="Delete or archive material"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Add Oil Dialog ───────────────────────────────────────── */}
      <Dialog open={addOilOpen} onOpenChange={setAddOilOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              <span>Add Oil to My Collection</span>
            </DialogTitle>
            <DialogDescription>
              Register an essential oil, aroma chemical, extract, or carrier to your organ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm mt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="oilName">Oil / Material Name</Label>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isLookingUp || !oilForm.name.trim()}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="h-3 w-3" />
                  {isLookingUp ? "Searching API..." : "Auto-Fill via API"}
                </button>
              </div>
              <Input
                id="oilName"
                placeholder="e.g. Mysore Sandalwood, Cardamom CO2, Ambroxan..."
                value={oilForm.name}
                onChange={(e) => setOilForm({ ...oilForm, name: e.target.value })}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="oilType">Material Type</Label>
                <select
                  id="oilType"
                  value={oilForm.materialType}
                  onChange={(e) => setOilForm({ ...oilForm, materialType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ESSENTIAL_OIL">Essential Oil (Natural)</option>
                  <option value="AROMA_CHEMICAL">Aroma Chemical / Isolate</option>
                  <option value="EXTRACT">Extract / Absolute / Resin</option>
                  <option value="SOLVENT">Solvent / Carrier</option>
                  <option value="FRAGRANCE">Custom Accord / Blend</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="casNumber">CAS Number (optional)</Label>
                <Input
                  id="casNumber"
                  placeholder="e.g. 8006-87-9"
                  value={oilForm.casNumber}
                  onChange={(e) => setOilForm({ ...oilForm, casNumber: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* Dilution Ratio & Carrier Solvent */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dilution" className="text-xs">Dilution (%)</Label>
                  <span className="text-[10px] text-muted-foreground font-mono">{oilForm.dilutionPercentage}%</span>
                </div>
                <Input
                  id="dilution"
                  type="number"
                  min="0.001"
                  max="100"
                  step="any"
                  value={oilForm.dilutionPercentage}
                  onChange={(e) => setOilForm({ ...oilForm, dilutionPercentage: e.target.value })}
                  className="font-mono text-xs h-8"
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[100, 50, 10, 1].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        setOilForm({
                          ...oilForm,
                          dilutionPercentage: pct.toString(),
                          diluentSolvent: pct < 100 && oilForm.diluentSolvent === "None (Pure)" ? "DPG" : oilForm.diluentSolvent,
                        })
                      }
                      className={`px-1.5 py-0.5 text-[9px] rounded border font-mono transition-colors cursor-pointer ${
                        parseFloat(oilForm.dilutionPercentage) === pct
                          ? "bg-primary text-primary-foreground border-primary font-semibold"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {pct === 100 ? "Pure" : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="diluent" className="text-xs">Diluent Carrier</Label>
                <select
                  id="diluent"
                  value={oilForm.diluentSolvent}
                  onChange={(e) => setOilForm({ ...oilForm, diluentSolvent: e.target.value })}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="None (Pure)">None (Pure Neat)</option>
                  <option value="DPG">DPG (Dipropylene Glycol)</option>
                  <option value="TEC">TEC (Triethyl Citrate)</option>
                  <option value="IPM">IPM (Isopropyl Myristate)</option>
                  <option value="Ethanol 96%">Ethanol 96%</option>
                  <option value="Jojoba / FCO">Carrier Oil (FCO / Jojoba)</option>
                  <option value="Other">Other Solvent</option>
                </select>
              </div>
            </div>

            {/* Accord Component Breakdown (When Material is Custom Accord / Blend) */}
            {oilForm.materialType === "FRAGRANCE" && (
              <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      Accord Mixing Breakdown (What materials make up this accord)
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Specify each raw material and its proportion / percentage:
                    </p>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    accordTotalPercentage === 100
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : accordTotalPercentage > 100
                      ? "bg-destructive/10 text-destructive border-destructive/30"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  }`}>
                    Total: {accordTotalPercentage}%
                  </span>
                </div>

                <div className="space-y-2">
                  {accordComponents.map((component, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder={`Component #${idx + 1} (e.g. Ambroxan, Vanillin, Hedione)`}
                        value={component.name}
                        onChange={(e) => updateAccordComponent(idx, "name", e.target.value)}
                        className="text-xs h-8 flex-1"
                      />
                      <div className="relative w-24">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          placeholder="%"
                          value={component.percentage}
                          onChange={(e) => updateAccordComponent(idx, "percentage", e.target.value)}
                          className="font-mono text-xs h-8 pr-6 text-right"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                          %
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAccordComponent(idx)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAccordComponent}
                  className="w-full text-xs h-8 border-dashed"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Component Material
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier / Origin (optional)</Label>
                <Input
                  id="supplier"
                  placeholder="e.g. Robertet, IFF, Biolandes"
                  value={oilForm.supplierName}
                  onChange={(e) => setOilForm({ ...oilForm, supplierName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost / gram ($ USD)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.25"
                  value={oilForm.costPerUnit}
                  onChange={(e) => setOilForm({ ...oilForm, costPerUnit: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Olfactory Notes / Description</Label>
              <textarea
                id="desc"
                placeholder="Warm, creamy, balsamic, rich woody notes..."
                value={oilForm.description}
                onChange={(e) => setOilForm({ ...oilForm, description: e.target.value })}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setAddOilOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateOil} loading={isPending}>
              Save to Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Material Confirmation Dialog ────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>Remove Material from Collection</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong className="font-semibold text-foreground">&quot;{deleteConfirm?.name}&quot;</strong>?
              If this material is used in existing formula versions, it will be safely archived to preserve historical formulation records.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteIngredient} loading={isPending}>
              Yes, Delete Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
