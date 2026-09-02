"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Scale,
  Droplets,
  FlaskConical,
  Globe,
  Beaker,
  Shield,
  HelpCircle,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createFormula } from "@/services/formula/actions";
import {
  calculateConcentrateTarget,
  calculateBaseWeight,
  calculateDropsConversion,
  decimalRound,
} from "@/lib/calculations";
import { APPLICATION_USAGE_OPTIONS } from "@/lib/compliance";
import { toast } from "sonner";

// ─── Product Types ──────────────────────────────────────────────────

interface ProductTypeOption {
  id: string;
  name: string;
  defaultConcentration: number;
  description: string;
}

const PRODUCT_TYPE_OPTIONS: ProductTypeOption[] = [
  { id: "EAU_DE_PARFUM", name: "Eau de Parfum", defaultConcentration: 20, description: "Rich, long-lasting balance (15–20% concentration)" },
  { id: "EAU_DE_TOILETTE", name: "Eau de Toilette", defaultConcentration: 12, description: "Fresh, vibrant daily wear (10–15% concentration)" },
  { id: "PARFUM", name: "Parfum / Extrait", defaultConcentration: 25, description: "Highest concentration, intense longevity (20–30%)" },
  { id: "EAU_DE_COLOGNE", name: "Cologne", defaultConcentration: 5, description: "Light, uplifting citrus & herbal splashes (3–8%)" },
  { id: "BODY_MIST", name: "Body Mist", defaultConcentration: 2, description: "Subtle all-over mist for everyday refreshment (1–3%)" },
  { id: "OTHER", name: "Perfume Oil / Custom", defaultConcentration: 15, description: "Alcohol-free oils, roll-ons, or custom bases" },
];

// ─── Base Carrier Options ───────────────────────────────────────────

const BASE_OPTIONS = [
  { id: "Ethanol", name: "Ethanol (Perfumer's Alcohol)", description: "Standard fine fragrance carrier (96% denatured)" },
  { id: "Perfume Oil", name: "Perfume Oil Carrier", description: "Jojoba, Fractionated Coconut (MCT), or IPM" },
  { id: "DPG", name: "DPG (Dipropylene Glycol)", description: "Non-alcoholic solvent & diluent" },
  { id: "Water-based", name: "Water-based / Micro-emulsion", description: "Modern alcohol-free emulsion" },
  { id: "Custom", name: "Custom Base / Accord", description: "Multi-carrier or specialized formulation base" },
];

// ─── Market Options ─────────────────────────────────────────────────

const AVAILABLE_MARKETS = [
  { id: "European Union", code: "EU", standard: "IFRA / EU Cosmetic Reg" },
  { id: "United Kingdom", code: "UK", standard: "UK Cosmetic Reg" },
  { id: "United States", code: "US", standard: "FDA / IFRA Category 4" },
  { id: "India", code: "IN", standard: "BIS / IFRA" },
  { id: "Canada", code: "CA", standard: "Health Canada" },
  { id: "Australia", code: "AU", standard: "NICNAS / AICIS" },
  { id: "Japan", code: "JP", standard: "MHLW Standards" },
  { id: "Middle East", code: "ME", standard: "GSO Standards" },
  { id: "Global", code: "Global", standard: "Universal IFRA Standards" },
];

export function FormulaSetupWizard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(1);

  // Form State
  const [formulaName, setFormulaName] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState("EAU_DE_PARFUM");
  const [applicationId, setApplicationId] = useState("fine-fragrance");
  const [measurementType, setMeasurementType] = useState<"weight" | "volume" | "drops">("weight");
  const [batchAmount, setBatchAmount] = useState<number>(1000);
  const [weightUnit, setWeightUnit] = useState("g");
  const [dropsPerMl, setDropsPerMl] = useState<number>(20);
  const [concentration, setConcentration] = useState<number>(20);
  const [baseCarrier, setBaseCarrier] = useState("Ethanol");
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["European Union", "United States", "India"]);

  // Calculate actual target weight in grams for backend
  let targetGrams = batchAmount;
  if (measurementType === "drops") {
    const converted = calculateDropsConversion(batchAmount, dropsPerMl, 0.95);
    targetGrams = converted.grams || 25;
  } else if (measurementType === "volume" && weightUnit === "ml") {
    // 0.85 approx fine fragrance density with alcohol
    targetGrams = batchAmount * 0.85;
  }

  // Real-time batch preview
  const concentrateGrams = calculateConcentrateTarget(targetGrams, concentration);
  const baseGrams = calculateBaseWeight(targetGrams, concentrateGrams);

  const handleProductSelect = (pt: ProductTypeOption) => {
    setProductType(pt.id);
    setConcentration(pt.defaultConcentration);
  };

  const toggleMarket = (marketName: string) => {
    if (selectedMarkets.includes(marketName)) {
      if (selectedMarkets.length > 1) {
        setSelectedMarkets(selectedMarkets.filter((m) => m !== marketName));
      } else {
        toast.info("At least one target market is required for compliance evaluation.");
      }
    } else {
      setSelectedMarkets([...selectedMarkets, marketName]);
    }
  };

  const handleFinish = async () => {
    if (!formulaName.trim()) {
      toast.error("Please provide a name for your formula.");
      setStep(1);
      return;
    }

    startTransition(async () => {
      const selectedApp = APPLICATION_USAGE_OPTIONS.find((a) => a.id === applicationId);

      const formData = new FormData();
      formData.append("name", formulaName.trim());
      formData.append("description", description ? `${description} | Base: ${baseCarrier}` : `Base: ${baseCarrier}`);
      formData.append("productType", productType);
      formData.append("applicationCategory", selectedApp?.mappedCategory || "Fine Fragrance");
      formData.append("market", selectedMarkets.join(", "));
      formData.append("targetWeight", String(decimalRound(targetGrams, 2)));
      formData.append("weightUnit", "g");
      formData.append("concentration", String(concentration));

      const result = await createFormula(formData);
      if (result.success && result.data) {
        toast.success("Formula created! Welcome to your workspace.");
        router.push(`/formulas/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to create formula.");
      }
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
      {/* Wizard Progress Stepper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground uppercase tracking-wider">
            Step {step} of 7 — {
              step === 1 ? "Product Type" :
              step === 2 ? "How It's Used" :
              step === 3 ? "Batch Size" :
              step === 4 ? "Fragrance Concentration" :
              step === 5 ? "Base Carrier" :
              step === 6 ? "Target Markets" :
              "Review & Launch"
            }
          </span>
          <span className="font-medium">{Math.round((step / 7) * 100)}% complete</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* ─── STEP 1: PRODUCT ─────────────────────────────────────── */}
      {step === 1 && (
        <Card className="border">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">What are you creating?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the fragrance format and give your formula a name.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formulaName">Formula Name</Label>
              <Input
                id="formulaName"
                value={formulaName}
                onChange={(e) => setFormulaName(e.target.value)}
                placeholder="e.g. Velvet Santal, Citrus Wood No. 7, Rose Musk..."
                className="h-10 text-base"
                autoFocus
              />
            </div>

            <div className="space-y-3">
              <Label>Fragrance Format</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {PRODUCT_TYPE_OPTIONS.map((pt) => {
                  const isSelected = productType === pt.id;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => handleProductSelect(pt)}
                      className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:bg-muted/50 border-border"
                      }`}
                    >
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{pt.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{pt.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => {
                  if (!formulaName.trim()) {
                    toast.error("Please enter a name for your formula.");
                    return;
                  }
                  setStep(2);
                }}
              >
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 2: HOW WILL IT BE USED? ────────────────────────── */}
      {step === 2 && (
        <Card className="border">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">How will the product be used?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This helps us automatically apply the right safety checks behind the scenes without technical jargon.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {APPLICATION_USAGE_OPTIONS.map((app) => {
                const isSelected = applicationId === app.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setApplicationId(app.id)}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50 border-border"
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{app.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{app.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 3: HOW MUCH ARE YOU MAKING? ────────────────────── */}
      {step === 3 && (
        <Card className="border">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">How much are you making?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select your preferred measurement method. Weight is recommended for highest precision.
              </p>
            </div>

            {/* Measurement Method Selector */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMeasurementType("weight");
                  setWeightUnit("g");
                  setBatchAmount(1000);
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border transition-all cursor-pointer text-center ${
                  measurementType === "weight"
                    ? "border-primary bg-primary/5 ring-1 ring-primary font-semibold"
                    : "hover:bg-muted/50 border-border"
                }`}
              >
                <Scale className="h-5 w-5 mb-1.5 text-primary" />
                <span className="text-sm font-medium">Weight</span>
                <span className="text-[11px] text-muted-foreground font-normal">Grams / Kilograms</span>
                <Badge variant="secondary" className="mt-1.5 text-[10px] py-0 px-1.5">Recommended</Badge>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMeasurementType("volume");
                  setWeightUnit("ml");
                  setBatchAmount(100);
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border transition-all cursor-pointer text-center ${
                  measurementType === "volume"
                    ? "border-primary bg-primary/5 ring-1 ring-primary font-semibold"
                    : "hover:bg-muted/50 border-border"
                }`}
              >
                <FlaskConical className="h-5 w-5 mb-1.5 text-primary" />
                <span className="text-sm font-medium">Volume</span>
                <span className="text-[11px] text-muted-foreground font-normal">Milliliters (ml)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMeasurementType("drops");
                  setBatchAmount(500);
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border transition-all cursor-pointer text-center ${
                  measurementType === "drops"
                    ? "border-primary bg-primary/5 ring-1 ring-primary font-semibold"
                    : "hover:bg-muted/50 border-border"
                }`}
              >
                <Droplets className="h-5 w-5 mb-1.5 text-primary" />
                <span className="text-sm font-medium">Drops</span>
                <span className="text-[11px] text-muted-foreground font-normal">Lab Pipette Drops</span>
              </button>
            </div>

            {/* Inputs based on selection */}
            {measurementType === "weight" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchAmount">Target Batch Weight</Label>
                  <Input
                    id="batchAmount"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={batchAmount}
                    onChange={(e) => setBatchAmount(parseFloat(e.target.value) || 0)}
                    className="font-mono text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weightUnit">Unit</Label>
                  <select
                    id="weightUnit"
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="oz">Ounces (oz)</option>
                  </select>
                </div>
              </div>
            )}

            {measurementType === "volume" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchAmount">Target Volume</Label>
                  <Input
                    id="batchAmount"
                    type="number"
                    step="1"
                    min="1"
                    value={batchAmount}
                    onChange={(e) => setBatchAmount(parseFloat(e.target.value) || 0)}
                    className="font-mono text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weightUnit">Unit</Label>
                  <select
                    id="weightUnit"
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ml">Milliliters (ml)</option>
                    <option value="L">Liters (L)</option>
                  </select>
                </div>
              </div>
            )}

            {measurementType === "drops" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchAmount">Total Drops</Label>
                    <Input
                      id="batchAmount"
                      type="number"
                      step="10"
                      min="10"
                      value={batchAmount}
                      onChange={(e) => setBatchAmount(parseFloat(e.target.value) || 0)}
                      className="font-mono text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dropsPerMl">Drops per 1 ml (Dropper Calibration)</Label>
                    <Input
                      id="dropsPerMl"
                      type="number"
                      step="1"
                      min="10"
                      max="60"
                      value={dropsPerMl}
                      onChange={(e) => setDropsPerMl(parseFloat(e.target.value) || 20)}
                      className="font-mono text-base"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                  Drop size varies between droppers. Standard pipettes deliver ~20 drops/ml. Use your own calibrated value for better accuracy.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 4: FRAGRANCE CONCENTRATION ─────────────────────── */}
      {step === 4 && (
        <Card className="border">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">How concentrated should the fragrance be?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your desired oil concentration percentage. Everything recalculates live.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-36">
                  <Label htmlFor="concentration">Concentration (%)</Label>
                  <div className="relative mt-1">
                    <Input
                      id="concentration"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="100"
                      value={concentration}
                      onChange={(e) => setConcentration(parseFloat(e.target.value) || 0)}
                      className="font-mono text-lg font-bold pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      %
                    </span>
                  </div>
                </div>

                {/* Preset quick buttons */}
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Standard Presets</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[5, 10, 15, 20, 25, 30].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setConcentration(val)}
                        className={`px-3 py-1 text-xs rounded-md border font-mono transition-colors cursor-pointer ${
                          concentration === val
                            ? "bg-primary text-primary-foreground border-primary font-semibold"
                            : "hover:bg-muted border-border"
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Batch Breakdown Preview Card */}
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Live Batch Breakdown ({decimalRound(targetGrams, 1)} g total)
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-md border bg-background p-3">
                    <span className="text-[11px] text-muted-foreground block">Fragrance Concentrate</span>
                    <span className="text-lg font-bold font-mono text-primary">
                      {decimalRound(concentrateGrams, 1)} g
                    </span>
                    <span className="text-xs text-muted-foreground block">({concentration}%)</span>
                  </div>
                  <div className="rounded-md border bg-background p-3">
                    <span className="text-[11px] text-muted-foreground block">Base / Solvent</span>
                    <span className="text-lg font-bold font-mono text-foreground">
                      {decimalRound(baseGrams, 1)} g
                    </span>
                    <span className="text-xs text-muted-foreground block">({100 - concentration}%)</span>
                  </div>
                  <div className="rounded-md border bg-background p-3">
                    <span className="text-[11px] text-muted-foreground block">Finished Product</span>
                    <span className="text-lg font-bold font-mono text-foreground">
                      {decimalRound(targetGrams, 1)} g
                    </span>
                    <span className="text-xs text-muted-foreground block">(100%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(5)}>
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 5: BASE CARRIER ────────────────────────────────── */}
      {step === 5 && (
        <Card className="border">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">What will you use as the base?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select your primary solvent or carrier. You can refine complex base accords later in the workspace.
              </p>
            </div>

            <div className="grid gap-3">
              {BASE_OPTIONS.map((base) => {
                const isSelected = baseCarrier === base.id;
                return (
                  <button
                    key={base.id}
                    type="button"
                    onClick={() => setBaseCarrier(base.id)}
                    className={`flex items-center justify-between rounded-lg border p-4 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50 border-border"
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-sm block">{base.name}</span>
                      <span className="text-xs text-muted-foreground">{base.description}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(4)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(6)}>
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 6: MARKETS ─────────────────────────────────────── */}
      {step === 6 && (
        <Card className="border">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Where will this product be sold?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select all destination regions. Olfacta will automatically evaluate safety rules for every selected market.
              </p>
            </div>

            {/* Selected Chips */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Selected Target Markets ({selectedMarkets.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/20 min-h-[52px] items-center">
                {selectedMarkets.map((m) => (
                  <Badge key={m} variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-medium">
                    <Globe className="h-3 w-3 text-primary" />
                    <span>{m}</span>
                    <button
                      type="button"
                      onClick={() => toggleMarket(m)}
                      className="hover:bg-muted rounded-full p-0.5 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Market Selection Grid */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Available Markets (Click to toggle)</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {AVAILABLE_MARKETS.map((market) => {
                  const isSelected = selectedMarkets.includes(market.id);
                  return (
                    <button
                      key={market.id}
                      type="button"
                      onClick={() => toggleMarket(market.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 font-semibold text-foreground"
                          : "hover:bg-muted/50 border-border text-muted-foreground"
                      }`}
                    >
                      <span>{market.id}</span>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(5)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(7)}>
                Review Setup <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 7: REVIEW & LAUNCH ──────────────────────────────── */}
      {step === 7 && (
        <Card className="border">
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-compliant">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-xl font-semibold tracking-tight text-foreground">Everything is ready to formulate</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Review your formula parameters. You can edit any parameter later directly in the workspace.
              </p>
            </div>

            {/* Summary Grid */}
            <div className="rounded-lg border bg-card p-5 divide-y text-sm">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Formula Name</span>
                <span className="font-semibold text-foreground">{formulaName}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Product Type</span>
                <span className="font-semibold text-foreground">
                  {PRODUCT_TYPE_OPTIONS.find((p) => p.id === productType)?.name}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Application Usage</span>
                <span className="font-semibold text-foreground">
                  {APPLICATION_USAGE_OPTIONS.find((a) => a.id === applicationId)?.label}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Batch Size</span>
                <span className="font-semibold font-mono tabular-nums text-foreground">
                  {decimalRound(targetGrams, 1)} g ({measurementType})
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Concentration</span>
                <div className="text-right">
                  <span className="font-semibold font-mono text-primary">{concentration}%</span>
                  <span className="text-xs text-muted-foreground block">
                    ({decimalRound(concentrateGrams, 1)}g concentrate + {decimalRound(baseGrams, 1)}g base)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Base Carrier</span>
                <span className="font-semibold text-foreground">{baseCarrier}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Compliance Markets</span>
                <span className="font-semibold text-foreground text-right text-xs">
                  {selectedMarkets.join(" · ")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(6)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Edit Setup
              </Button>
              <Button size="lg" className="px-8" onClick={handleFinish} loading={isPending}>
                Start Formulating <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
