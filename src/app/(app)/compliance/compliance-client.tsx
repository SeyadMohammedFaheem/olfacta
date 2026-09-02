"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Eye,
  CheckCircle2,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplianceBadge, DemoBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createRegulatoryRule } from "@/services/compliance/actions";
import { hasPermission } from "@/lib/permissions";
import type { SessionUser } from "@/types";
import { toast } from "sonner";

interface ComplianceClientProps {
  rules: any[];
  profiles: any[];
  findings: any[];
  ingredients: any[];
  user: SessionUser;
}

export function ComplianceClient({
  rules,
  profiles,
  findings,
  ingredients,
  user,
}: ComplianceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");

  const canManage = hasPermission(user.role, "compliance:manage");

  const violations = findings.filter((f) => f.severity === "VIOLATION").length;
  const warnings = findings.filter((f) => f.severity === "WARNING").length;
  const reviewRequired = findings.filter((f) => f.severity === "REVIEW_REQUIRED").length;
  const compliant = findings.filter((f) => f.severity === "PASS").length;

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.ingredient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredient?.casNumber?.includes(searchQuery) ||
      r.standard?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.message?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      selectedSeverity === "ALL" || r.severity === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  async function handleCreateRule(formData: FormData) {
    startTransition(async () => {
      const res = await createRegulatoryRule(formData);
      if (res.success) {
        toast.success("Regulatory rule created successfully");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to create rule");
      }
    });
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Compliance & Regulatory Standards</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configurable regulatory rules, maximum concentration thresholds, and active findings
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Safety Rule
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Compliant Items</p>
              <p className="text-2xl font-bold text-compliant tabular-nums mt-0.5">{compliant}</p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-compliant/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Safety Warnings</p>
              <p className="text-2xl font-bold text-warning tabular-nums mt-0.5">{warnings}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-warning/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Active Violations</p>
              <p className="text-2xl font-bold text-violation tabular-nums mt-0.5">{violations}</p>
            </div>
            <XCircle className="h-6 w-6 text-violation/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Review Required</p>
              <p className="text-2xl font-bold text-review tabular-nums mt-0.5">{reviewRequired}</p>
            </div>
            <Eye className="h-6 w-6 text-review/50" />
          </CardContent>
        </Card>
      </div>

      {/* Rules Table with Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">Configured Safety & Compliance Rules ({filteredRules.length})</CardTitle>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search rules, CAS, materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Severities</SelectItem>
                  <SelectItem value="VIOLATION">Violations</SelectItem>
                  <SelectItem value="WARNING">Warnings</SelectItem>
                  <SelectItem value="REVIEW_REQUIRED">Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b bg-muted/20">
                  <th className="px-5 py-3 font-medium">Ingredient</th>
                  <th className="px-5 py-3 font-medium">CAS Number</th>
                  <th className="px-5 py-3 font-medium">Rule Type</th>
                  <th className="px-5 py-3 font-medium">Configured Limit</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-5 py-3 font-medium">Standard / Market</th>
                  <th className="px-5 py-3 font-medium">Provenance</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium">
                      {rule.ingredient ? (
                        <Link href={`/ingredients/${rule.ingredient.id}`} className="hover:underline text-foreground">
                          {rule.ingredient.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground italic">Universal Limit</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {rule.ingredient?.casNumber || "—"}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {rule.ruleType.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3 font-mono font-medium text-xs">
                      {rule.limitValue !== null ? `${rule.limitValue}${rule.unit || "%"}` : "0% (Prohibited)"}
                    </td>
                    <td className="px-5 py-3">
                      <ComplianceBadge status={rule.severity as any} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {rule.standard || "General"} ({rule.market || "All Markets"})
                    </td>
                    <td className="px-5 py-3">
                      {rule.isDemo ? <DemoBadge /> : <span className="text-xs font-medium text-muted-foreground">Company Rule</span>}
                    </td>
                  </tr>
                ))}
                {filteredRules.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-xs text-muted-foreground">
                      No regulatory rules match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Configured Regulatory Rule</DialogTitle>
            <DialogDescription>
              Define safety limits, maximum concentration percentages, or review requirements.
            </DialogDescription>
          </DialogHeader>

          <form action={handleCreateRule} className="space-y-4 text-sm mt-2">
            <div className="space-y-2">
              <Label htmlFor="ingredientId">Target Raw Material / Ingredient</Label>
              <Select name="ingredientId">
                <SelectTrigger>
                  <SelectValue placeholder="Select raw material..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {ingredients.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id}>
                      {ing.name} {ing.casNumber ? `(${ing.casNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ruleType">Rule Type</Label>
                <Select name="ruleType" defaultValue="MAX_CONCENTRATION">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAX_CONCENTRATION">Max Concentration</SelectItem>
                    <SelectItem value="MIN_CONCENTRATION">Min Concentration</SelectItem>
                    <SelectItem value="PROHIBITED">Prohibited</SelectItem>
                    <SelectItem value="PRESENCE_RESTRICTION">Presence Restriction</SelectItem>
                    <SelectItem value="REQUIRES_REVIEW">Requires Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity Level</Label>
                <Select name="severity" defaultValue="VIOLATION">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIOLATION">Violation (Blocking)</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="REVIEW_REQUIRED">Review Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="limitValue">Concentration Limit (%)</Label>
                <Input
                  id="limitValue"
                  name="limitValue"
                  type="number"
                  step="0.001"
                  placeholder="e.g. 0.50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warnAtPercentage">Warning Threshold (%)</Label>
                <Input
                  id="warnAtPercentage"
                  name="warnAtPercentage"
                  type="number"
                  step="1"
                  defaultValue="80"
                  placeholder="e.g. 80"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productCategory">Product Category</Label>
                <Select name="productCategory" defaultValue="EAU_DE_PARFUM">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EAU_DE_PARFUM">Eau de Parfum</SelectItem>
                    <SelectItem value="EAU_DE_TOILETTE">Eau de Toilette</SelectItem>
                    <SelectItem value="CANDLE">Candle</SelectItem>
                    <SelectItem value="SOAP">Soap</SelectItem>
                    <SelectItem value="LOTION">Lotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="standard">Standard / Reference</Label>
                <Input
                  id="standard"
                  name="standard"
                  defaultValue="IFRA 51 (Category 4)"
                  placeholder="e.g. IFRA 51"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Compliance Rationale / Message</Label>
              <Input
                id="message"
                name="message"
                placeholder="Reason or safety restriction description..."
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isPending}>
                Create Rule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
