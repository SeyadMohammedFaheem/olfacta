"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, FlaskConical, Trash2, ArrowRight, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ImportFormulaModal } from "./import-formula-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteFormula } from "@/services/formula/actions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { PageHeader, FilterBar, FilterTag } from "@/components/ui/page-header";

const productTypeLabels: Record<string, string> = {
  EAU_DE_PARFUM: "EDP",
  EAU_DE_TOILETTE: "EDT",
  EAU_DE_COLOGNE: "EDC",
  PARFUM: "Parfum",
  BODY_MIST: "Body Mist",
  ROOM_SPRAY: "Room Spray",
  CANDLE: "Candle",
  SOAP: "Soap",
  LOTION: "Lotion",
  OTHER: "Other",
};

const FORMULA_TYPES = [
  { id: "ALL", label: "All Formulas" },
  { id: "EAU_DE_PARFUM", label: "Eau de Parfum" },
  { id: "EAU_DE_TOILETTE", label: "Eau de Toilette" },
  { id: "PARFUM", label: "Extrait / Parfum" },
  { id: "EAU_DE_COLOGNE", label: "Cologne" },
  { id: "CANDLE", label: "Candles & Ambient" },
];

export function FormulasClient({ formulas, canDelete }: { formulas: any[]; canDelete: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = formulas.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === "ALL" || f.productType === selectedType;
    return matchSearch && matchType;
  });

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteFormula(id);
      if (res.success) {
        toast.success("Formula deleted.");
        setDeleteId(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete formula.");
      }
    });
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <ImportFormulaModal open={importOpen} onOpenChange={setImportOpen} />
      {/* Header */}
      <PageHeader
        title="Formulas"
        description={`Manage and edit your perfume formulations (${formulas.length} total)`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Import from Sheet
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/formulas/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Formula
              </Link>
            </Button>
          </div>
        }
      />

      {/* Filter & Search Bar */}
      <FilterBar>
        {/* Type Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {FORMULA_TYPES.map((type) => (
            <FilterTag
              key={type.id}
              label={type.label}
              active={selectedType === type.id}
              onClick={() => setSelectedType(type.id)}
            />
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search formulas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No formulas found"
          description={search ? `No formulas matching "${search}".` : "Create your first perfume formula to start formulating."}
          actionLabel="Create Formula"
          actionHref="/formulas/new"
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b bg-muted/20">
                <th className="px-5 py-3 font-medium">Formula Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Updated</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((formula) => {
                const latestVersion = formula.versions[0];
                return (
                  <tr key={formula.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/formulas/${formula.id}`}
                        className="font-medium text-foreground hover:underline block"
                      >
                        {formula.name}
                      </Link>
                      {formula.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-sm truncate">
                          {formula.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {productTypeLabels[formula.productType] || formula.productType}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      v{latestVersion?.versionNumber ?? 1}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={formula.status} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono">
                      {formatDate(formula.updatedAt)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {formula.createdBy?.name || "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {formula.status === "APPROVED" && (
                          <a
                            href={`/formulas/${formula.id}/print`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 shadow-2xs"
                            title="Save Official PDF & Sign-Off Sheet"
                          >
                            <FileText className="h-3 w-3 text-emerald-600" /> Save PDF
                          </a>
                        )}
                        <Link
                          href={`/formulas/${formula.id}`}
                          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Workspace <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
