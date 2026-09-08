"use client";

import { useState, useCallback, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  ShieldCheck,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  GitBranch,
  Settings,
  Globe,
  Sparkles,
  Droplets,
  Layers,
  Scale,
  Search,
  X,
  Info,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, ComplianceBadge, DemoBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
import {
  addIngredientToFormula,
  updateIngredientQuantity,
  removeIngredientFromFormula,
  submitFormulaForReview,
  approveFormula,
  rejectFormula,
  createNewVersion,
  saveFormulaVersion,
  updateFormulaSetup,
  deleteFormula,
  discardFormulaVersion,
  revertToFormulaVersion,
} from "@/services/formula/actions";
import { searchIngredients, quickCreateOil, lookupMaterialApi } from "@/services/ingredient/actions";
import {
  calculatePercentage,
  calculateTotalWeight,
  validateTotalPercentage,
  calculateConcentration,
  calculateConcentrateTarget,
  calculateBaseWeight,
  calculateQuantityFromPercentage,
  decimalRound,
} from "@/lib/calculations";
import {
  evaluateFormula,
  calculateComplianceSummary,
  getIngredientComplianceStatus,
  normalizeMarkets,
  APPLICATION_USAGE_OPTIONS,
} from "@/lib/compliance";
import { hasPermission } from "@/lib/permissions";
import type { ComplianceFindingResult, SessionUser } from "@/types";
import { toast } from "sonner";

interface FormulaWorkspaceClientProps {
  formula: any;
  rules: any[];
  user: SessionUser;
  activeVersionId?: string;
}

export function FormulaWorkspaceClient({ formula, rules, user, activeVersionId }: FormulaWorkspaceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Selected or latest active version
  const selectedVersion = activeVersionId
    ? formula.versions.find((v: any) => v.id === activeVersionId) || formula.versions[0]
    : formula.versions[0];
  const latestVersion = selectedVersion;
  const isEditable = latestVersion?.status === "DRAFT";
  const canEdit = isEditable && hasPermission(user.role, "formula:edit");

  // Discard & Revert Modal states
  const [discardVersionDialog, setDiscardVersionDialog] = useState<any | null>(null);
  const [revertVersionDialog, setRevertVersionDialog] = useState<any | null>(null);

  // Setup / Context state
  const [editSetupOpen, setEditSetupOpen] = useState(false);
  const [setupForm, setSetupForm] = useState({
    name: formula.name,
    targetWeight: latestVersion?.targetWeight ?? 1000,
    weightUnit: latestVersion?.weightUnit ?? "g",
    concentration: latestVersion?.concentration ?? 20,
    market: formula.market ?? "General",
    description: formula.description ?? "",
  });

  // Ingredient drawer & search
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Quick Add Oil to Collection modal state
  const [quickOilOpen, setQuickOilOpen] = useState(false);
  const [quickOilForm, setQuickOilForm] = useState({
    name: "",
    materialType: "ESSENTIAL_OIL",
    casNumber: "",
    dilutionPercentage: "100",
    diluentSolvent: "None (Pure)",
    supplierName: "",
    costPerUnit: "",
    description: "",
  });

  // Saving state
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [confirmDialog, setConfirmDialog] = useState<{ type: string; id?: string } | null>(null);

  // Validation panel & Market filtering
  const [selectedFinding, setSelectedFinding] = useState<ComplianceFindingResult | null>(null);
  const [selectedMarketTab, setSelectedMarketTab] = useState<string>("ALL");

  // Local ingredient state
  const [localIngredients, setLocalIngredients] = useState(
    latestVersion?.ingredients?.map((fi: any) => ({
      id: fi.id,
      ingredientId: fi.ingredient.id,
      name: fi.ingredient.name,
      materialType: fi.ingredient.materialType,
      casNumber: fi.ingredient.casNumber,
      dilutionPercentage: fi.ingredient.dilutionPercentage,
      diluentSolvent: fi.ingredient.diluentSolvent,
      quantity: fi.quantity,
      unit: fi.unit,
      sortOrder: fi.sortOrder,
      costPerUnit: fi.ingredient.costPerUnit,
    })) ?? []
  );

  // Parse markets
  const formulaMarkets = normalizeMarkets({ market: formula.market });

  // Calculate totals and concentrate progress
  const targetBatchWeight = latestVersion?.targetWeight ?? 1000;
  const targetConcentration = latestVersion?.concentration ?? 20;

  const quantities = localIngredients.map((i: any) => i.quantity);
  const totalWeight = calculateTotalWeight(quantities);
  const { isBalanced, totalPercentage } = validateTotalPercentage(quantities);

  // Concentrate calculations
  const targetConcentrateGrams = calculateConcentrateTarget(targetBatchWeight, targetConcentration);
  const fragranceTypes = ["FRAGRANCE", "ESSENTIAL_OIL", "AROMA_CHEMICAL", "EXTRACT"];
  const concentrateUsedGrams = localIngredients
    .filter((i: any) => fragranceTypes.includes(i.materialType))
    .reduce((sum: number, i: any) => sum + i.quantity, 0);

  const concentratePercentBuilt = targetConcentrateGrams > 0
    ? (concentrateUsedGrams / targetConcentrateGrams) * 100
    : 0;

  const concentrateRemainingGrams = Math.max(0, targetConcentrateGrams - concentrateUsedGrams);
  const baseCarrierRequiredGrams = calculateBaseWeight(targetBatchWeight, targetConcentrateGrams);

  // Live compliance evaluation
  const complianceFindings = evaluateFormula(
    localIngredients.map((i: any) => ({
      ingredientId: i.ingredientId,
      ingredientName: i.name,
      quantity: i.quantity,
      materialType: i.materialType,
      unit: i.unit,
    })),
    rules,
    {
      productCategory: formula.productType,
      applicationArea: formula.applicationCategory,
      market: formula.market,
      markets: formulaMarkets,
    }
  );

  const complianceSummary = calculateComplianceSummary(complianceFindings);

  // Filter findings by selected market tab
  const filteredFindings = complianceFindings.filter((f) => {
    if (selectedMarketTab === "ALL") return true;
    return f.market?.toLowerCase().includes(selectedMarketTab.toLowerCase());
  });

  // Live Formula Cost
  const totalFormulaCost = localIngredients.reduce(
    (sum: number, i: any) => sum + i.quantity * (i.costPerUnit || 0),
    0
  );
  const costPerKg = totalWeight > 0 ? (totalFormulaCost / totalWeight) * 1000 : 0;

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchIngredients(query);
        setSearchResults(results);
      } catch {
        toast.error("Failed to search ingredients");
      }
      setSearching(false);
    }, 300);
  }, []);

  // Add ingredient
  const handleAddIngredient = useCallback(async (ingredient: any) => {
    if (!latestVersion) return;

    startTransition(async () => {
      const result = await addIngredientToFormula(latestVersion.id, ingredient.id, 0);
      if (result.success) {
        setLocalIngredients((prev: any[]) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            ingredientId: ingredient.id,
            name: ingredient.name,
            materialType: ingredient.materialType,
            casNumber: ingredient.casNumber,
            dilutionPercentage: ingredient.dilutionPercentage,
            diluentSolvent: ingredient.diluentSolvent,
            quantity: 0,
            unit: "g",
            sortOrder: prev.length,
            costPerUnit: ingredient.costPerUnit,
          },
        ]);
        setDrawerOpen(false);
        setSearchQuery("");
        setSaveStatus("unsaved");
        toast.success(`Added ${ingredient.name}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to add ingredient");
      }
    });
  }, [latestVersion, router]);

  // Quick oil auto-fill state
  const [isLookingUpOil, setIsLookingUpOil] = useState(false);

  const handleQuickAutoFill = async () => {
    if (!quickOilForm.name.trim()) {
      toast.error("Please enter a material name first.");
      return;
    }
    setIsLookingUpOil(true);
    try {
      const results = await lookupMaterialApi(quickOilForm.name);
      if (results && results.length > 0) {
        const match = results[0];
        setQuickOilForm((prev) => ({
          ...prev,
          name: match.name || prev.name,
          materialType: (match.materialType as any) || prev.materialType,
          casNumber: match.casNumber || prev.casNumber,
          description: match.description || prev.description,
        }));
        toast.success(`Found details for "${match.name}" via ${match.source === "PUBCHEM_API" ? "PubChem API" : "Perfumery Database"}!`);
      } else {
        toast.info("No matching material found in fragrance database.");
      }
    } catch {
      toast.error("Lookup failed. Check your network connection.");
    } finally {
      setIsLookingUpOil(false);
    }
  };

  // Quick create oil and immediately add to formula
  const handleQuickCreateOil = async () => {
    if (!quickOilForm.name.trim()) {
      toast.error("Please enter the oil / material name.");
      return;
    }

    startTransition(async () => {
      const res = await quickCreateOil({
        name: quickOilForm.name,
        materialType: quickOilForm.materialType,
        casNumber: quickOilForm.casNumber,
        dilutionPercentage: quickOilForm.dilutionPercentage ? parseFloat(quickOilForm.dilutionPercentage) : 100,
        diluentSolvent: quickOilForm.diluentSolvent,
        supplierName: quickOilForm.supplierName,
        costPerUnit: quickOilForm.costPerUnit ? parseFloat(quickOilForm.costPerUnit) : undefined,
        description: quickOilForm.description,
      });

      if (res.success && res.data) {
        toast.success(`"${res.data.name}" added to collection!`);
        setQuickOilOpen(false);
        const newIng = res.data;
        setQuickOilForm({
          name: "",
          materialType: "ESSENTIAL_OIL",
          casNumber: "",
          dilutionPercentage: "100",
          diluentSolvent: "None (Pure)",
          supplierName: "",
          costPerUnit: "",
          description: "",
        });
        await handleAddIngredient({
          id: newIng.id,
          name: newIng.name,
          materialType: newIng.materialType,
          casNumber: newIng.casNumber,
          dilutionPercentage: newIng.dilutionPercentage,
          diluentSolvent: newIng.diluentSolvent,
          costPerUnit: newIng.costPerUnit,
        });
      } else {
        toast.error(res.error || "Failed to add oil");
      }
    });
  };

  // Debounced server save ref
  const quantitySaveRef = useRef<NodeJS.Timeout | null>(null);

  // Bidirectional change: Amount (g) change
  const handleQuantityChange = useCallback((index: number, value: number) => {
    setLocalIngredients((prev: any[]) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: value };
      return updated;
    });
    setSaveStatus("unsaved");

    if (quantitySaveRef.current) clearTimeout(quantitySaveRef.current);
    quantitySaveRef.current = setTimeout(async () => {
      const item = localIngredients[index];
      if (item && !item.id.startsWith("temp-")) {
        await updateIngredientQuantity(item.id, value);
      }
    }, 800);
  }, [localIngredients]);

  // Bidirectional change: Percentage (%) change
  const handlePercentageChange = useCallback((index: number, desiredPct: number) => {
    const computedGrams = calculateQuantityFromPercentage(desiredPct, targetBatchWeight);
    handleQuantityChange(index, computedGrams);
  }, [handleQuantityChange, targetBatchWeight]);

  // Auto-fill Remaining: batch carrier or solvent
  const handleFillRemainingBatch = useCallback((index: number) => {
    const otherIngredientsSum = localIngredients
      .filter((_: any, i: number) => i !== index)
      .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    const remainder = Math.max(0, decimalRound(targetBatchWeight - otherIngredientsSum, 2));
    handleQuantityChange(index, remainder);
    toast.success(`Set ${localIngredients[index]?.name || "ingredient"} to remainder (${remainder} g)`);
  }, [localIngredients, targetBatchWeight, handleQuantityChange]);

  // Auto-fill Remaining: fragrance concentrate balance
  const handleFillRemainingConcentrate = useCallback((index: number) => {
    const fragranceTypes = ["FRAGRANCE", "ESSENTIAL_OIL", "AROMA_CHEMICAL", "EXTRACT"];
    const otherFragranceSum = localIngredients
      .filter((item: any, i: number) => i !== index && fragranceTypes.includes(item.materialType))
      .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    const remainder = Math.max(0, decimalRound(targetConcentrateGrams - otherFragranceSum, 2));
    handleQuantityChange(index, remainder);
    toast.success(`Balanced concentrate with ${localIngredients[index]?.name || "ingredient"} (${remainder} g)`);
  }, [localIngredients, targetConcentrateGrams, handleQuantityChange]);

  // Apply Safe Maximum Allowed action from finding
  const handleApplyMaximum = useCallback((ingredientId: string, maxPct: number) => {
    const index = localIngredients.findIndex((i: any) => i.ingredientId === ingredientId);
    if (index === -1) return;

    handlePercentageChange(index, maxPct);
    setSelectedFinding(null);
    setSaveStatus("unsaved");
    toast.success(`Dosage adjusted to legal limit (${maxPct}%)`);
  }, [localIngredients, handlePercentageChange]);

  // Remove ingredient
  const handleRemoveIngredient = useCallback(async (index: number) => {
    const item = localIngredients[index];
    if (!item) return;

    setLocalIngredients((prev: any[]) => prev.filter((_: any, i: number) => i !== index));
    setConfirmDialog(null);
    setSaveStatus("unsaved");

    if (!item.id.startsWith("temp-")) {
      startTransition(async () => {
        const result = await removeIngredientFromFormula(item.id);
        if (result.success) {
          toast.success(`Removed ${item.name}`);
          router.refresh();
        } else {
          toast.error(result.error || "Failed to remove ingredient");
        }
      });
    }
  }, [localIngredients, router]);

  // Save version
  const handleSave = useCallback(async () => {
    if (!latestVersion) return;
    setSaveStatus("saving");
    startTransition(async () => {
      const result = await saveFormulaVersion(latestVersion.id, totalWeight, totalPercentage);
      if (result.success) {
        setSaveStatus("saved");
        toast.success("Formula saved");
      } else {
        setSaveStatus("unsaved");
        toast.error(result.error || "Failed to save formula");
      }
    });
  }, [latestVersion, totalWeight, totalPercentage]);

  // Submit for review with blocking validation check
  const handleSubmitForReview = useCallback(async () => {
    const violations = complianceFindings.filter((f) => f.severity === "VIOLATION");
    if (violations.length > 0) {
      toast.error(`Resolve ${violations.length} blocking safety violation${violations.length > 1 ? "s" : ""} before submitting.`);
      return;
    }

    startTransition(async () => {
      const result = await submitFormulaForReview(formula.id);
      if (result.success) {
        toast.success("Formula submitted for review");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit formula");
      }
    });
  }, [formula.id, complianceFindings, router]);

  // Approve
  const handleApprove = useCallback(async () => {
    startTransition(async () => {
      const result = await approveFormula(formula.id);
      if (result.success) {
        toast.success("Formula approved");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to approve formula");
      }
    });
  }, [formula.id, router]);

  // Reject
  const handleReject = useCallback(async () => {
    startTransition(async () => {
      const result = await rejectFormula(formula.id, "Rejected in review");
      if (result.success) {
        toast.success("Formula marked as rejected");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to reject formula");
      }
    });
  }, [formula.id, router]);

  // Create new version
  const handleCreateVersion = useCallback(async () => {
    startTransition(async () => {
      const result = await createNewVersion(formula.id);
      if (result.success && result.data) {
        toast.success("New version created");
        router.push(`/formulas/${formula.id}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create new version");
      }
    });
  }, [formula.id, router]);

  // Discard a specific version
  const handleDiscardVersion = useCallback(async (versionId: string, versionNumber: number) => {
    startTransition(async () => {
      const result = await discardFormulaVersion(formula.id, versionId);
      if (result.success) {
        toast.success(`Version v${versionNumber} discarded.`);
        setDiscardVersionDialog(null);
        router.push(`/formulas/${formula.id}`);
        router.refresh();
      } else {
        toast.error(result.error || `Failed to discard v${versionNumber}`);
      }
    });
  }, [formula.id, router]);

  // Revert back to a specific previous version
  const handleRevertVersion = useCallback(async (versionId: string, versionNumber: number) => {
    startTransition(async () => {
      const result = await revertToFormulaVersion(formula.id, versionId);
      if (result.success && result.data) {
        toast.success(`Successfully reverted to v${versionNumber}! Created v${result.data.versionNumber} as active draft.`);
        setRevertVersionDialog(null);
        router.push(`/formulas/${formula.id}`);
        router.refresh();
      } else {
        toast.error(result.error || `Failed to revert to v${versionNumber}`);
      }
    });
  }, [formula.id, router]);

  // Delete formula state (GitHub-style confirmation)
  const [deleteFormulaOpen, setDeleteFormulaOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

  const handleDeleteThisFormula = async () => {
    if (deleteConfirmInput.trim() !== formula.name.trim()) {
      toast.error(`Please type "${formula.name}" to confirm.`);
      return;
    }

    startTransition(async () => {
      const res = await deleteFormula(formula.id);
      if (res.success) {
        toast.success(`Formula "${formula.name}" deleted.`);
        router.push("/formulas");
      } else {
        toast.error(res.error || "Failed to delete formula.");
      }
    });
  };

  // Update Setup submit
  const handleSaveSetup = async () => {
    startTransition(async () => {
      const res = await updateFormulaSetup(formula.id, latestVersion?.id, {
        name: setupForm.name,
        targetWeight: setupForm.targetWeight,
        concentration: setupForm.concentration,
        market: setupForm.market,
        description: setupForm.description,
      });

      if (res.success) {
        toast.success("Formula setup updated");
        setEditSetupOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update setup");
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* ─── Top Bar: Formula Identity & Primary Workflow Actions ─── */}
      <div className="border-b bg-card px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/formulas" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold">{formula.name}</h1>
                
                {/* Interactive Version Selector Dropdown */}
                {formula.versions?.length > 1 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                        title="Switch formula version"
                      >
                        <span>v{latestVersion?.versionNumber ?? 1}</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Select Version
                      </div>
                      {formula.versions.map((ver: any) => (
                        <DropdownMenuItem
                          key={ver.id}
                          className="flex items-center justify-between text-xs cursor-pointer font-mono"
                          onClick={() => {
                            router.push(`/formulas/${formula.id}?versionId=${ver.id}`);
                          }}
                        >
                          <span className={ver.id === latestVersion?.id ? "font-bold text-primary" : ""}>
                            v{ver.versionNumber} {ver.id === latestVersion?.id ? "✓" : ""}
                          </span>
                          <StatusBadge status={ver.status} />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-xs text-muted-foreground font-mono">v{latestVersion?.versionNumber ?? 1}</span>
                )}

                <StatusBadge status={latestVersion?.status ?? formula.status} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Version comparison */}
            {formula.versions?.length > 1 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/formulas/${formula.id}/compare`}>
                  <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                  Compare
                </Link>
              </Button>
            )}

            {/* If already saved, show only Saved text */}
            {canEdit && saveStatus === "saved" && (
              <span className="text-xs text-muted-foreground font-medium px-2 py-1">
                Saved
              </span>
            )}

            {/* If NOT saved already (unsaved or saving), show the Save button */}
            {canEdit && saveStatus !== "saved" && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isPending || saveStatus === "saving"}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saveStatus === "saving" ? "Saving..." : "Save"}
              </Button>
            )}

            {/* Revert to this version (if viewing an older approved version) */}
            {latestVersion?.status !== "DRAFT" && hasPermission(user.role, "formula:edit") && (
              <Button
                variant="outline"
                size="sm"
                className="text-primary hover:text-primary hover:bg-primary/10 border-primary/30"
                onClick={() => setRevertVersionDialog(latestVersion)}
                disabled={isPending}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restore v{latestVersion?.versionNumber}
              </Button>
            )}

            {canEdit && latestVersion?.status === "DRAFT" && hasPermission(user.role, "formula:submit") && (
              <Button variant="outline" size="sm" onClick={handleSubmitForReview} disabled={isPending}>
                <Send className="mr-1 h-3.5 w-3.5" /> Submit for Review
              </Button>
            )}

            {latestVersion?.status === "IN_REVIEW" && hasPermission(user.role, "formula:approve") && (
              <>
                <Button size="sm" className="bg-compliant hover:bg-compliant/90" onClick={handleApprove} disabled={isPending}>
                  Approve
                </Button>
                <Button variant="destructive" size="sm" onClick={handleReject} disabled={isPending}>
                  Reject
                </Button>
              </>
            )}

            {(latestVersion?.status === "APPROVED" || latestVersion?.status === "REJECTED") && hasPermission(user.role, "formula:edit") && (
              <Button variant="outline" size="sm" onClick={handleCreateVersion} disabled={isPending}>
                New Version
              </Button>
            )}

            {formula.status === "APPROVED" && hasPermission(user.role, "batch:create") && (
              <Button size="sm" asChild>
                <Link href={`/batches/new?formulaId=${formula.id}&versionId=${latestVersion?.id}`}>
                  Scale Production Batch
                </Link>
              </Button>
            )}

            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setSetupForm({
                    name: formula.name,
                    targetWeight: targetBatchWeight,
                    weightUnit: latestVersion?.weightUnit ?? "g",
                    concentration: targetConcentration,
                    market: formula.market ?? "General",
                    description: formula.description ?? "",
                  });
                  setEditSetupOpen(true);
                }}
              >
                <Settings className="mr-1.5 h-3.5 w-3.5" /> Formula Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Context Banner: Product Setup Summary & Edit Trigger ─── */}
      <div className="border-b bg-muted/30 px-6 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-foreground">{formula.name}</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono">{targetBatchWeight} {latestVersion?.weightUnit ?? "g"} batch</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono text-primary font-medium">{targetConcentration}% concentrate</span>
            <span className="text-muted-foreground">•</span>
            <span>{formula.applicationCategory || "Fine Fragrance"}</span>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Markets:</span>
              {formulaMarkets.map((m) => (
                <Badge key={m} variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Live Fragrance Concentrate Progress Bar ────────────────── */}
      <div className="border-b bg-card px-6 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1 max-w-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Fragrance Concentrate Formulation
              </span>
              <span className="font-mono font-bold text-foreground">
                {decimalRound(concentrateUsedGrams, 1)} / {decimalRound(targetConcentrateGrams, 1)} g ({decimalRound(concentratePercentBuilt, 1)}%)
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  concentratePercentBuilt > 100 ? "bg-warning" : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, concentratePercentBuilt)}%` }}
              />
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[11px] text-muted-foreground block">Remaining Concentrate</span>
              <span className={`font-semibold ${concentrateRemainingGrams === 0 ? "text-compliant" : "text-foreground"}`}>
                {decimalRound(concentrateRemainingGrams, 1)} g
              </span>
            </div>
            <div className="border-l pl-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground block">Base Carrier Needed</span>
                {canEdit && (() => {
                  const solventIdx = localIngredients.findIndex((i: any) => i.materialType === "SOLVENT" || /alcohol|dpg|solvent|carrier/i.test(i.name));
                  if (solventIdx !== -1) {
                    return (
                      <button
                        type="button"
                        onClick={() => handleFillRemainingBatch(solventIdx)}
                        className="text-[10px] text-primary hover:underline font-sans cursor-pointer"
                        title={`Auto-fill ${localIngredients[solventIdx].name} to balance formula`}
                      >
                        Auto-fill solvent
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
              <span className="font-semibold text-foreground">
                {decimalRound(baseCarrierRequiredGrams, 1)} g ({100 - targetConcentration}%)
              </span>
            </div>
            <div className="border-l pl-4">
              <span className="text-[11px] text-muted-foreground block">Est. Cost / kg</span>
              <span className="font-semibold text-foreground">
                ${decimalRound(costPerKg, 2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content Workspace Area ────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Formulation Table */}
        <div className="flex-1 overflow-y-auto">
          {/* Sticky Section Header */}
          <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Formula Ingredients ({localIngredients.length})</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter amount in grams or desired percentage. Both calculate automatically.
                </p>
              </div>

              {canEdit && (
                <Button size="sm" onClick={() => setDrawerOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Ingredient
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4 pt-4">
            {/* Table */}
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="text-left text-xs text-muted-foreground border-b bg-muted/40">
                    <th className="px-4 py-2.5 w-8 font-medium">#</th>
                    <th className="px-4 py-2.5 font-medium">Ingredient</th>
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium w-36">Amount ({latestVersion?.weightUnit ?? "g"})</th>
                    <th className="px-4 py-2.5 font-medium w-28 text-right">Dosage (%)</th>
                    <th className="px-4 py-2.5 font-medium w-28 text-center">Safety Status</th>
                    <th className="px-4 py-2.5 font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {localIngredients.map((ingredient: any, index: number) => {
                    const percentage = targetBatchWeight > 0
                      ? calculatePercentage(ingredient.quantity, targetBatchWeight)
                      : 0;
                    const complianceStatus = getIngredientComplianceStatus(
                      ingredient.ingredientId,
                      complianceFindings
                    );
                    const isSolvent = ingredient.materialType === "SOLVENT" || /alcohol|dpg|solvent|carrier/i.test(ingredient.name);
                    const isFragranceMaterial = fragranceTypes.includes(ingredient.materialType);
                    const otherIngredientsWeight = localIngredients
                      .filter((_: any, i: number) => i !== index)
                      .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
                    const batchRemainder = Math.max(0, decimalRound(targetBatchWeight - otherIngredientsWeight, 2));

                    return (
                      <tr
                        key={ingredient.id}
                        className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${
                          complianceStatus === "VIOLATION" ? "bg-violation-bg/30" :
                          complianceStatus === "WARNING" ? "bg-warning-bg/25" : ""
                        }`}
                      >
                        <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link href={`/ingredients/${ingredient.ingredientId}`} className="font-medium hover:underline">
                              {ingredient.name}
                            </Link>
                            {ingredient.dilutionPercentage && ingredient.dilutionPercentage < 100 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border bg-amber-500/10 text-amber-600 border-amber-500/30">
                                {ingredient.dilutionPercentage}% {ingredient.diluentSolvent || "DPG"}
                              </span>
                            )}
                            {ingredient.casNumber && (
                              <span className="text-[11px] font-mono text-muted-foreground">CAS: {ingredient.casNumber}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {ingredient.materialType.replace(/_/g, " ")}
                        </td>

                        {/* Editable Amount (g) with Auto-Fill Remainder */}
                        <td className="px-4 py-2">
                          {canEdit ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={ingredient.quantity || ""}
                                  onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className="h-8 font-mono text-sm"
                                />
                              </div>
                              {/* Quick Auto-fill Remainder button for Solvents or underfilled items */}
                              {isSolvent && batchRemainder > 0 && ingredient.quantity !== batchRemainder && (
                                <button
                                  type="button"
                                  onClick={() => handleFillRemainingBatch(index)}
                                  className="text-[10px] font-mono text-primary bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded border border-primary/20 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                                  title={`Fill remaining batch balance: ${batchRemainder} g`}
                                >
                                  <span>Fill remainder:</span>
                                  <span className="font-semibold">{batchRemainder} g</span>
                                </button>
                              )}
                              {!isSolvent && isFragranceMaterial && concentrateRemainingGrams > 0 && ingredient.quantity === 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleFillRemainingConcentrate(index)}
                                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-1.5 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                                  title={`Fill remaining concentrate: ${concentrateRemainingGrams} g`}
                                >
                                  <span>Fill concentrate:</span>
                                  <span className="font-semibold">{decimalRound(concentrateRemainingGrams, 1)} g</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="font-mono text-sm">{decimalRound(ingredient.quantity, 2)} g</span>
                          )}
                        </td>

                        {/* Editable Percentage (%) */}
                        <td className="px-4 py-2 text-right">
                          {canEdit ? (
                            <div className="relative inline-block w-24">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={percentage > 0 ? decimalRound(percentage, 2) : ""}
                                onChange={(e) => handlePercentageChange(index, parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="h-8 font-mono text-sm text-right pr-6"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
                                %
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono text-sm text-muted-foreground">{decimalRound(percentage, 2)}%</span>
                          )}
                        </td>

                        {/* Safety Status Badge with Details Click */}
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const finding = complianceFindings.find((f) => f.ingredientId === ingredient.ingredientId && f.severity !== "PASS")
                                || complianceFindings.find((f) => f.ingredientId === ingredient.ingredientId);
                              if (finding) setSelectedFinding(finding);
                            }}
                            className="cursor-pointer inline-block"
                          >
                            <ComplianceBadge status={complianceStatus} />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-2.5 text-right">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setConfirmDialog({ type: "remove", id: String(index) })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {localIngredients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="max-w-sm mx-auto space-y-3">
                          <Droplets className="h-8 w-8 mx-auto text-muted-foreground/60" />
                          <p className="text-sm font-medium">No ingredients added yet</p>
                          <p className="text-xs text-muted-foreground">
                            Click &quot;+ Add Ingredient&quot; to search raw materials from your library.
                          </p>
                          {canEdit && (
                            <Button size="sm" onClick={() => setDrawerOpen(true)}>
                              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add First Ingredient
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Formula Footer Totals Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border bg-card px-5 py-3 text-sm">
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <span className="text-xs text-muted-foreground">Total Weight</span>
                  <p className="font-semibold font-mono tabular-nums">{decimalRound(totalWeight, 2)} g</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Formula %</span>
                  <p className={`font-semibold font-mono tabular-nums ${!isBalanced ? "text-warning" : ""}`}>
                    {decimalRound(totalPercentage, 2)}%
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Raw Materials</span>
                  <p className="font-semibold font-mono tabular-nums">{localIngredients.length}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Overall Safety</span>
                  <p><ComplianceBadge status={complianceSummary.overall} /></p>
                </div>
              </div>

              {!isBalanced && totalWeight > 0 && (
                <div className="flex items-center gap-1.5 text-warning text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Total ingredients: {decimalRound(totalPercentage, 2)}% of batch
                </div>
              )}
            </div>

            {/* ─── GitHub-style Danger Zone ──────────────────────────── */}
            {hasPermission(user.role, "formula:delete") && (
              <div className="rounded-xl border border-destructive/30 bg-card overflow-hidden mt-6">
                <div className="px-5 py-2.5 border-b border-destructive/20 bg-destructive/5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" /> Danger Zone
                  </span>
                </div>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-destructive/[0.02]">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">Delete this formula</p>
                    <p className="text-xs text-muted-foreground">
                      Once deleted, this formula, all associated versions, ingredient lists, and production history will be gone forever. Please be certain.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="shrink-0 font-semibold"
                    onClick={() => {
                      setDeleteConfirmInput("");
                      setDeleteFormulaOpen(true);
                    }}
                  >
                    Delete this formula
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Multi-Market Validation & Findings Side Panel ──────────── */}
        <div className="w-80 border-l bg-card overflow-y-auto shrink-0 hidden lg:block">
          <div className="sticky top-0 z-20 bg-card border-b p-4 backdrop-blur-sm">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Multi-Market Safety Check
            </h3>
          </div>

          {/* Market Selection Tabs */}
          <div className="p-3.5 border-b bg-muted/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Filter by Market
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {formulaMarkets.length} active
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-1 bg-muted/40 rounded-lg border border-border/40">
              <button
                type="button"
                onClick={() => setSelectedMarketTab("ALL")}
                className={`flex-1 min-w-[75px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  selectedMarketTab === "ALL"
                    ? "bg-card text-foreground font-semibold shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <span>All Markets</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-normal ${
                  selectedMarketTab === "ALL" ? "bg-primary/10 text-primary font-bold" : "bg-muted text-muted-foreground"
                }`}>
                  {complianceFindings.length}
                </span>
              </button>
              {formulaMarkets.map((m) => {
                const count = complianceFindings.filter((f) => !f.market || f.market === m || f.market === "Global").length;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMarketTab(m)}
                    className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      selectedMarketTab === m
                        ? "bg-card text-foreground font-semibold shadow-xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    <span>{m}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-normal ${
                      selectedMarketTab === m ? "bg-primary/10 text-primary font-bold" : "bg-muted text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compliance Metrics */}
          <div className="p-4 space-y-2 border-b">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-compliant">
                <CheckCircle2 className="h-3.5 w-3.5" /> Passed
              </span>
              <span className="font-semibold tabular-nums font-mono">{complianceSummary.passed}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-warning">
                <AlertTriangle className="h-3.5 w-3.5" /> Warnings
              </span>
              <span className="font-semibold tabular-nums font-mono">{complianceSummary.warnings}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-violation">
                <XCircle className="h-3.5 w-3.5" /> Violations
              </span>
              <span className="font-semibold tabular-nums font-mono">{complianceSummary.violations}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-review">
                <Eye className="h-3.5 w-3.5" /> Review Required
              </span>
              <span className="font-semibold tabular-nums font-mono">{complianceSummary.reviewRequired}</span>
            </div>
          </div>

          {/* Issues / Findings List */}
          <div className="p-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Findings ({filteredFindings.filter((f) => f.severity !== "PASS").length})
            </h4>
            <div className="space-y-2.5">
              {filteredFindings
                .filter((f) => f.severity !== "PASS")
                .map((finding, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedFinding(finding)}
                    className="w-full text-left rounded-lg border p-3 text-xs hover:bg-muted/50 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ComplianceBadge status={finding.severity} showLabel={false} />
                        <span className="font-semibold">{finding.ingredientName}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                        {finding.market || "Global"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">{finding.message}</p>
                    <span className="text-[10px] text-primary font-medium inline-block hover:underline">
                      View details & apply safe limit →
                    </span>
                  </button>
                ))}

              {filteredFindings.filter((f) => f.severity !== "PASS").length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {localIngredients.length === 0
                    ? "Add ingredients to evaluate compliance"
                    : "No safety issues found for selected market"}
                </p>
              )}
            </div>
          </div>

          {/* Version Timeline */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Version Snapshots
              </h4>
              {formula.versions?.length > 1 && (
                <Link
                  href={`/formulas/${formula.id}/compare`}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <GitBranch className="h-3 w-3" /> Compare
                </Link>
              )}
            </div>

            <div className="space-y-2">
              {formula.versions.map((version: any) => {
                const isCurrent = version.id === latestVersion?.id;
                const canDiscardThis = formula.versions.length > 1 && version.status === "DRAFT" && hasPermission(user.role, "formula:edit");
                const canRestoreThis = !isCurrent && hasPermission(user.role, "formula:edit");

                return (
                  <div
                    key={version.id}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      isCurrent
                        ? "border-primary/50 bg-primary/[0.04] shadow-xs"
                        : "border-border/60 bg-muted/10 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => router.push(`/formulas/${formula.id}?versionId=${version.id}`)}
                        className="flex items-center gap-1.5 font-medium font-mono text-left cursor-pointer hover:text-primary transition-colors"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>v{version.versionNumber}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-primary/10 text-primary font-semibold">
                            Active
                          </span>
                        )}
                      </button>
                      <StatusBadge status={version.status} />
                    </div>

                    {/* Action buttons for this specific version */}
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/40 text-[11px]">
                      <button
                        type="button"
                        onClick={() => router.push(`/formulas/${formula.id}?versionId=${version.id}`)}
                        className={`hover:underline cursor-pointer ${isCurrent ? "text-primary font-semibold" : "text-muted-foreground"}`}
                      >
                        {isCurrent ? "Viewing active" : "View ingredients →"}
                      </button>

                      <div className="flex items-center gap-1">
                        {canRestoreThis && (
                          <button
                            type="button"
                            onClick={() => setRevertVersionDialog(version)}
                            className="px-1.5 py-0.5 rounded text-[10px] text-primary hover:bg-primary/10 transition-colors cursor-pointer flex items-center gap-0.5 font-medium"
                            title={`Restore formulation from v${version.versionNumber}`}
                          >
                            <RotateCcw className="h-2.5 w-2.5" /> Revert to this
                          </button>
                        )}
                        {canDiscardThis && (
                          <button
                            type="button"
                            onClick={() => setDiscardVersionDialog(version)}
                            className="px-1.5 py-0.5 rounded text-[10px] text-destructive hover:bg-destructive/10 transition-colors cursor-pointer flex items-center gap-0.5"
                            title={`Discard draft v${version.versionNumber}`}
                          >
                            <Trash2 className="h-2.5 w-2.5" /> Discard
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Slide-over Ingredient Search Drawer ─────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Raw Material</SheetTitle>
            <SheetDescription>
              Search your collection by name, CAS, or type — or add a new oil
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search materials, CAS, or suppliers..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                className="pl-9 pr-8 h-10 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setQuickOilForm({
                    name: searchQuery.trim(),
                    materialType: "ESSENTIAL_OIL",
                    casNumber: "",
                    dilutionPercentage: "100",
                    diluentSolvent: "None (Pure)",
                    supplierName: "",
                    costPerUnit: "",
                    description: "",
                  });
                  setQuickOilOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 text-xs text-primary font-medium transition-colors cursor-pointer group"
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  {searchQuery.trim() ? (
                    <span>Add <strong className="font-semibold text-foreground">&quot;{searchQuery.trim()}&quot;</strong> to Collection</span>
                  ) : (
                    <span>Add New Oil to Collection</span>
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                  Create Material →
                </span>
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
            {searching && <p className="text-sm text-muted-foreground text-center py-4">Searching materials...</p>}
            {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
              <div className="text-center py-6 space-y-3 rounded-lg border border-dashed p-4">
                <p className="text-sm text-muted-foreground">No materials found for &quot;{searchQuery}&quot;</p>
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setQuickOilForm({
                        name: searchQuery.trim(),
                        materialType: "ESSENTIAL_OIL",
                        casNumber: "",
                        dilutionPercentage: "100",
                        diluentSolvent: "None (Pure)",
                        supplierName: "",
                        costPerUnit: "",
                        description: "",
                      });
                      setQuickOilOpen(true);
                    }}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add &quot;{searchQuery}&quot; to Collection
                  </Button>
                )}
              </div>
            )}
            {!searching && searchQuery.length < 2 && (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-muted-foreground">Type at least 2 characters to search your collection</p>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-primary"
                    onClick={() => {
                      setQuickOilForm({
                        name: "",
                        materialType: "ESSENTIAL_OIL",
                        casNumber: "",
                        dilutionPercentage: "100",
                        diluentSolvent: "None (Pure)",
                        supplierName: "",
                        costPerUnit: "",
                        description: "",
                      });
                      setQuickOilOpen(true);
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add a new custom oil or raw material
                  </Button>
                )}
              </div>
            )}
            {searchResults.map((ingredient) => {
              const alreadyAdded = localIngredients.some((i: any) => i.ingredientId === ingredient.id);
              return (
                <div
                  key={ingredient.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{ingredient.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {ingredient.dilutionPercentage && ingredient.dilutionPercentage < 100 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-600 border-amber-500/30">
                          {ingredient.dilutionPercentage}% in {ingredient.diluentSolvent || "DPG"}
                        </span>
                      )}
                      {ingredient.casNumber && (
                        <span className="text-xs font-mono text-muted-foreground">CAS: {ingredient.casNumber}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {ingredient.materialType.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyAdded ? "secondary" : "default"}
                    disabled={alreadyAdded || isPending}
                    onClick={() => handleAddIngredient(ingredient)}
                  >
                    {alreadyAdded ? "In Formula" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Quick Add Oil to Collection Modal ──────────────────────── */}
      <Dialog open={quickOilOpen} onOpenChange={setQuickOilOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              <span>Add Oil to Collection</span>
            </DialogTitle>
            <DialogDescription>
              Add a new oil to your library and include it in this formula.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm mt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quickOilName">Oil / Material Name</Label>
                <button
                  type="button"
                  onClick={handleQuickAutoFill}
                  disabled={isLookingUpOil || !quickOilForm.name.trim()}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="h-3 w-3" />
                  {isLookingUpOil ? "Searching API..." : "Auto-Fill via API"}
                </button>
              </div>
              <Input
                id="quickOilName"
                placeholder="e.g. Mysore Sandalwood, Cardamom CO2..."
                value={quickOilForm.name}
                onChange={(e) => setQuickOilForm({ ...quickOilForm, name: e.target.value })}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quickOilType">Material Type</Label>
                <select
                  id="quickOilType"
                  value={quickOilForm.materialType}
                  onChange={(e) => setQuickOilForm({ ...quickOilForm, materialType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ESSENTIAL_OIL">Essential Oil (Natural)</option>
                  <option value="AROMA_CHEMICAL">Aroma Chemical / Isolate</option>
                  <option value="EXTRACT">Extract / Absolute</option>
                  <option value="SOLVENT">Solvent / Carrier</option>
                  <option value="FRAGRANCE">Custom Accord / Blend</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quickCas">CAS (optional)</Label>
                <Input
                  id="quickCas"
                  placeholder="e.g. 8006-87-9"
                  value={quickOilForm.casNumber}
                  onChange={(e) => setQuickOilForm({ ...quickOilForm, casNumber: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* Dilution Ratio & Carrier Solvent */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quickDilution" className="text-xs">Dilution (%)</Label>
                  <span className="text-[10px] text-muted-foreground font-mono">{quickOilForm.dilutionPercentage}%</span>
                </div>
                <Input
                  id="quickDilution"
                  type="number"
                  min="0.001"
                  max="100"
                  step="any"
                  value={quickOilForm.dilutionPercentage}
                  onChange={(e) => setQuickOilForm({ ...quickOilForm, dilutionPercentage: e.target.value })}
                  className="font-mono text-xs h-8"
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[100, 50, 10, 1].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        setQuickOilForm({
                          ...quickOilForm,
                          dilutionPercentage: pct.toString(),
                          diluentSolvent: pct < 100 && quickOilForm.diluentSolvent === "None (Pure)" ? "DPG" : quickOilForm.diluentSolvent,
                        })
                      }
                      className={`px-1.5 py-0.5 text-[9px] rounded border font-mono transition-colors cursor-pointer ${
                        parseFloat(quickOilForm.dilutionPercentage) === pct
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
                <Label htmlFor="quickDiluent" className="text-xs">Diluent Carrier</Label>
                <select
                  id="quickDiluent"
                  value={quickOilForm.diluentSolvent}
                  onChange={(e) => setQuickOilForm({ ...quickOilForm, diluentSolvent: e.target.value })}
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
                <p className="text-[10px] text-muted-foreground leading-tight pt-0.5">
                  Pre-dilution state of this material.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quickSupplier">Supplier (optional)</Label>
                <Input
                  id="quickSupplier"
                  placeholder="e.g. Robertet, IFF"
                  value={quickOilForm.supplierName}
                  onChange={(e) => setQuickOilForm({ ...quickOilForm, supplierName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quickCost">Cost / gram ($ USD)</Label>
                <Input
                  id="quickCost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.25"
                  value={quickOilForm.costPerUnit}
                  onChange={(e) => setQuickOilForm({ ...quickOilForm, costPerUnit: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickDesc">Notes / Description (optional)</Label>
              <textarea
                id="quickDesc"
                placeholder="Warm, creamy, balsamic aroma notes..."
                value={quickOilForm.description}
                onChange={(e) => setQuickOilForm({ ...quickOilForm, description: e.target.value })}
                className="flex min-h-[50px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setQuickOilOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleQuickCreateOil} loading={isPending}>
              Save & Add to Formula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Actionable Compliance Finding Modal ────────────────────── */}
      {selectedFinding && (
        <Dialog open={!!selectedFinding} onOpenChange={() => setSelectedFinding(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader className="pb-3 border-b">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <ComplianceBadge status={selectedFinding.severity} />
                {selectedFinding.isDemo && <DemoBadge />}
                <Badge variant="outline" className="text-[10px] ml-auto font-mono">
                  {selectedFinding.standard || selectedFinding.market || "IFRA 51"}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                {selectedFinding.ingredientName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Safety and compliance evaluation details for {selectedFinding.market || "selected target market"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm mt-1">
              {/* Dosage Comparison Matrix */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground block font-medium">
                    Current Formula Dosage
                  </span>
                  <p className={`text-xl font-bold font-mono ${
                    selectedFinding.limitValue !== null && selectedFinding.currentValue > selectedFinding.limitValue
                      ? "text-destructive"
                      : "text-foreground"
                  }`}>
                    {decimalRound(selectedFinding.currentValue, 3)}%
                  </p>
                  <span className="text-[10px] text-muted-foreground block">Active formulation</span>
                </div>

                <div className="p-3.5 rounded-lg border bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground block font-medium">
                    Configured Legal Ceiling
                  </span>
                  <p className="text-xl font-bold font-mono text-primary">
                    {selectedFinding.limitValue !== null ? `${selectedFinding.limitValue}%` : "Prohibited"}
                  </p>
                  <span className="text-[10px] text-muted-foreground block">Safety max limit</span>
                </div>
              </div>

              {/* Exceeds limit alert box */}
              {selectedFinding.limitValue !== null && selectedFinding.currentValue > selectedFinding.limitValue && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <span className="font-semibold text-destructive">Exceeds safety limit by:</span>
                  </div>
                  <span className="font-bold font-mono text-destructive">
                    +{decimalRound(selectedFinding.currentValue - selectedFinding.limitValue, 3)}%
                  </span>
                </div>
              )}

              {/* Standard rationale note */}
              <div className="rounded-lg border bg-muted/20 p-3.5 space-y-1.5">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Regulatory Standard & Rationale
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedFinding.message}
                </p>
              </div>

              {selectedFinding.isDemo && (
                <div className="rounded-md border border-warning/40 bg-warning-bg/30 p-2.5 text-xs text-warning-foreground flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                  <span>Demo data rule configured for system evaluation demonstration.</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setSelectedFinding(null)}>
                Dismiss
              </Button>
              {canEdit && selectedFinding.limitValue !== null && selectedFinding.limitValue > 0 && selectedFinding.currentValue > selectedFinding.limitValue && (
                <Button
                  type="button"
                  onClick={() => handleApplyMaximum(selectedFinding.ingredientId, selectedFinding.limitValue!)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Apply Safe Maximum ({selectedFinding.limitValue}%)
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Interactive "Edit Setup" Modal ──────────────────────────── */}
      <Dialog open={editSetupOpen} onOpenChange={setEditSetupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Formula Setup</DialogTitle>
            <DialogDescription>
              Adjust batch size, concentration, or target markets without losing your ingredient formula.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm mt-2">
            <div className="space-y-2">
              <Label htmlFor="setupName">Formula Name</Label>
              <Input
                id="setupName"
                value={setupForm.name}
                onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="setupWeight">Target Batch Weight (g)</Label>
                <Input
                  id="setupWeight"
                  type="number"
                  step="1"
                  min="1"
                  value={setupForm.targetWeight}
                  onChange={(e) => setSetupForm({ ...setupForm, targetWeight: parseFloat(e.target.value) || 0 })}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setupConcentration">Concentration (%)</Label>
                <Input
                  id="setupConcentration"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  value={setupForm.concentration}
                  onChange={(e) => setSetupForm({ ...setupForm, concentration: parseFloat(e.target.value) || 0 })}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setupMarkets">Target Markets (Comma-separated)</Label>
              <Input
                id="setupMarkets"
                value={setupForm.market}
                onChange={(e) => setSetupForm({ ...setupForm, market: e.target.value })}
                placeholder="e.g. European Union, United States, India"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setupDesc">Description / Notes</Label>
              <textarea
                id="setupDesc"
                value={setupForm.description}
                onChange={(e) => setSetupForm({ ...setupForm, description: e.target.value })}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* ─── Danger Zone: Discard Current Draft Version (if applicable) ──────────────────────────── */}
            {formula.versions.length > 1 && latestVersion?.status === "DRAFT" && hasPermission(user.role, "formula:edit") && (
              <div className="pt-3 border-t border-destructive/20 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-destructive block">
                  Danger Zone
                </span>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-destructive">Discard Draft (v{latestVersion.versionNumber})</p>
                    <p className="text-[11px] text-muted-foreground">
                      Delete this draft version and revert formula to the previous version.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => {
                      setEditSetupOpen(false);
                      setDiscardVersionDialog(latestVersion);
                    }}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5 text-destructive" />
                    Discard v{latestVersion.versionNumber}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setEditSetupOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveSetup} loading={isPending}>
              Update Setup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Remove Ingredient Dialog ────────────────────────── */}
      {confirmDialog?.type === "remove" && (
        <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Ingredient</DialogTitle>
              <DialogDescription>
                This will remove the ingredient from the formula and automatically recalculate percentages.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleRemoveIngredient(parseInt(confirmDialog.id!))}>
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Discard Specific Version Dialog ────────────────────────── */}
      {discardVersionDialog && (
        <Dialog open={!!discardVersionDialog} onOpenChange={() => setDiscardVersionDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                <span>Discard Draft Version v{discardVersionDialog.versionNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Are you sure you want to discard this draft? This will permanently delete v{discardVersionDialog.versionNumber} and return the formula to its previous version.
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 text-xs text-muted-foreground space-y-2">
              <p>
                • This version is currently in <strong className="text-foreground uppercase">{discardVersionDialog.status}</strong> status.
              </p>
              <p>
                • All raw material quantities and adjustments made in v{discardVersionDialog.versionNumber} will be deleted.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDiscardVersionDialog(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDiscardVersion(discardVersionDialog.id, discardVersionDialog.versionNumber)}
                loading={isPending}
              >
                Discard Version v{discardVersionDialog.versionNumber}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Revert / Restore Version Dialog ─────────────────────────── */}
      {revertVersionDialog && (
        <Dialog open={!!revertVersionDialog} onOpenChange={() => setRevertVersionDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="flex items-center gap-2 text-primary">
                <RotateCcw className="h-5 w-5" />
                <span>Revert to Version v{revertVersionDialog.versionNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Restore formulation from snapshot v{revertVersionDialog.versionNumber}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 text-xs text-muted-foreground space-y-2">
              <p>
                This will create a <strong className="text-foreground">new active DRAFT version</strong> matching the exact ingredients, proportions, batch weight, and concentration of <strong className="text-foreground font-mono">v{revertVersionDialog.versionNumber}</strong>.
              </p>
              <p>
                None of your past versions or batch histories will be lost.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRevertVersionDialog(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleRevertVersion(revertVersionDialog.id, revertVersionDialog.versionNumber)}
                loading={isPending}
              >
                Restore Formulation as New Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── GitHub Repository Style Delete Formula Dialog ───────────── */}
      <Dialog
        open={deleteFormulaOpen}
        onOpenChange={(open) => {
          setDeleteFormulaOpen(open);
          if (!open) setDeleteConfirmInput("");
        }}
      >
        <DialogContent className="sm:max-w-lg w-full p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="flex items-center gap-2 text-destructive text-lg font-bold">
              <Trash2 className="h-5 w-5" />
              <span>Delete Formula: {formula.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm mt-2">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive space-y-1.5 leading-relaxed">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Unexpected bad things will happen if you don&apos;t read this!</span>
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                This action <strong className="text-destructive font-semibold">cannot</strong> be undone. This will permanently delete the{" "}
                <strong className="text-foreground font-semibold font-mono">{formula.name}</strong> formula, all versions, ingredient lists, and batch history.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmName" className="text-xs text-foreground font-medium block">
                To confirm, please type <strong className="font-mono text-destructive font-semibold select-all">{formula.name}</strong> in the box below:
              </Label>
              <Input
                id="confirmName"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={`Type "${formula.name}" to confirm`}
                autoFocus
                className="font-mono text-sm border-destructive/40 focus-visible:ring-destructive h-9 w-full"
              />
            </div>
          </div>

          <DialogFooter className="gap-2.5 pt-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteFormulaOpen(false);
                setDeleteConfirmInput("");
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteConfirmInput.trim() !== formula.name.trim() || isPending}
              onClick={handleDeleteThisFormula}
              loading={isPending}
              className="w-full sm:w-auto font-semibold"
            >
              Delete this formula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
