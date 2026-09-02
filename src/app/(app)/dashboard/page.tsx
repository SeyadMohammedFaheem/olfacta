import { prisma } from "@/lib/db/prisma";
import { getSessionOrThrow } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, ComplianceBadge } from "@/components/ui/status-badge";
import {
  FlaskConical,
  Factory,
  AlertTriangle,
  XCircle,
  Plus,
  ArrowRight,
  Droplets,
  Layers,
  CheckCircle2,
  Scale,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Dashboard — Olfacta" };

export default async function DashboardPage() {
  const user = await getSessionOrThrow();
  const orgId = user.organizationId;

  const [formulas, batches, findings, ingredientsCount] = await Promise.all([
    prisma.formula.findMany({
      where: { organizationId: orgId },
      include: {
        createdBy: { select: { name: true } },
        versions: { orderBy: { versionNumber: "desc" }, take: 1, select: { versionNumber: true, status: true, targetWeight: true, concentration: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.batch.findMany({
      where: { organizationId: orgId, status: { in: ["PLANNED", "IN_PRODUCTION", "QC"] } },
      include: {
        formula: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.complianceFinding.findMany({
      where: {
        formula: { organizationId: orgId },
        severity: { in: ["VIOLATION", "WARNING", "REVIEW_REQUIRED"] },
      },
      include: {
        formula: { select: { name: true, id: true } },
        ingredient: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.ingredient.count({
      where: { organizationId: orgId, status: "ACTIVE" },
    }),
  ]);

  const totalFormulas = formulas.length;
  const drafts = formulas.filter((f) => f.status === "DRAFT").length;
  const inReview = formulas.filter((f) => f.status === "IN_REVIEW").length;
  const approved = formulas.filter((f) => f.status === "APPROVED").length;
  const activeBatches = batches.length;
  const violations = findings.filter((f) => f.severity === "VIOLATION").length;
  const warnings = findings.filter((f) => f.severity === "WARNING").length;

  return (
    <div className="p-6 space-y-6 w-full">
      {/* ─── Top Header with Quick Actions ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Laboratory Dashboard</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Aroma Labs
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-semibold text-foreground">{user.name}</span>. Here is your fragrance formulation & compliance overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/ingredients">
              <Droplets className="mr-1.5 h-3.5 w-3.5 text-primary" /> My Oils ({ingredientsCount})
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/formulas/new">
              <Plus className="mr-1.5 h-4 w-4" /> Create New Formula
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── Premium Metric Stat Cards Strip ─────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Formulas */}
        <Link href="/formulas" className="group block">
          <Card className="transition-all duration-200 hover:border-primary/40 border h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Formulas in Lab
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <FlaskConical className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">{totalFormulas}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 font-medium">
                  <span className="text-foreground">{drafts} Draft</span>
                  <span>•</span>
                  <span>{inReview} In Review</span>
                  <span>•</span>
                  <span className="text-compliant font-semibold">{approved} Approved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Active Batches */}
        <Link href="/batches" className="group block">
          <Card className="transition-all duration-200 hover:border-blue-500/40 border h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Batches
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Factory className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">{activeBatches}</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  {activeBatches > 0 ? "In production dispensing & QC" : "No batches currently running"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Violations */}
        <Link href="/compliance" className="group block">
          <Card className={`transition-all duration-200 border h-full ${violations > 0 ? "hover:border-violation/40 bg-violation-bg/15" : ""}`}>
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Safety Violations
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${violations > 0 ? "bg-violation/15 text-violation group-hover:bg-violation group-hover:text-white" : "bg-muted text-muted-foreground"} transition-colors`}>
                  <XCircle className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className={`text-3xl font-bold font-mono tracking-tight ${violations > 0 ? "text-violation" : "text-foreground"}`}>
                  {violations}
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  {violations > 0 ? "Blocking limits require adjustment" : "Zero safety violations in formulas"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Warnings */}
        <Link href="/compliance" className="group block">
          <Card className="transition-all duration-200 hover:border-warning/40 border h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Safety Warnings
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning group-hover:bg-warning group-hover:text-warning-foreground transition-colors">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className={`text-3xl font-bold font-mono tracking-tight ${warnings > 0 ? "text-warning" : "text-foreground"}`}>
                  {warnings}
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  {warnings > 0 ? "Approaching threshold limit" : "All dosages well within safe ranges"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ─── Main Content Tables Grid ────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Formulas */}
        <Card className="border">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" /> Active Formulas
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Most recently edited perfume formulations
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/formulas">View All →</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground bg-muted/10">
                    <th className="px-5 py-2.5 font-medium">Formula</th>
                    <th className="px-5 py-2.5 font-medium">Batch Spec</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formulas.slice(0, 5).map((formula) => {
                    const latest = formula.versions[0];
                    return (
                      <tr key={formula.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/formulas/${formula.id}`} className="font-semibold text-foreground hover:text-primary transition-colors block">
                            {formula.name}
                          </Link>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            v{latest?.versionNumber ?? 1} • {formula.productType.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono text-muted-foreground">
                          {latest?.targetWeight ? `${latest.targetWeight}g @ ${latest.concentration}%` : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={formula.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/formulas/${formula.id}`}
                            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Workspace <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {formulas.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-xs">
                        No formulas created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Active Batches */}
        <Card className="border">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Factory className="h-4 w-4 text-primary" /> Production Batches
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Current manufacturing & dispensing queues
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/batches">View All →</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground bg-muted/10">
                    <th className="px-5 py-2.5 font-medium">Batch #</th>
                    <th className="px-5 py-2.5 font-medium">Formula</th>
                    <th className="px-5 py-2.5 font-medium">Target Size</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr key={batch.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs">
                        <Link href={`/batches/${batch.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                          {batch.batchNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {batch.formula.name}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono font-medium">
                        {batch.targetQuantity} {batch.unit}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={batch.status} />
                      </td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-xs">
                        No active production batches.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Compliance Findings Alert Bar ──────────────────────────── */}
      {findings.length > 0 && (
        <Card className="border border-violation/20 bg-violation-bg/10">
          <CardHeader className="pb-3 border-b bg-violation-bg/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-4 w-4 text-violation" /> Attention Required: Safety & Compliance Findings ({findings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground bg-muted/10">
                    <th className="px-5 py-2.5 font-medium">Formula</th>
                    <th className="px-5 py-2.5 font-medium">Ingredient</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium">Regulatory Finding</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map((finding) => (
                    <tr key={finding.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-2.5 font-medium">
                        <Link href={`/formulas/${finding.formula.id}`} className="hover:underline text-foreground">
                          {finding.formula.name}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5 text-xs text-muted-foreground">
                        {finding.ingredient.name}
                      </td>
                      <td className="px-5 py-2.5">
                        <ComplianceBadge status={finding.severity as any} />
                      </td>
                      <td className="px-5 py-2.5 text-muted-foreground text-xs truncate max-w-md">
                        {finding.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
