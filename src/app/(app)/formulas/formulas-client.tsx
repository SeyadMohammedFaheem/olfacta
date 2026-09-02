"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, FlaskConical, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
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

export function FormulasClient({ formulas, canDelete }: { formulas: any[]; canDelete: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const filtered = formulas.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase())) ||
      (f.productType && f.productType.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDeleteFormula = async () => {
    if (!deleteConfirm) return;
    startTransition(async () => {
      const res = await deleteFormula(deleteConfirm.id);
      if (res.success) {
        toast.success(`Formula "${deleteConfirm.name}" deleted.`);
        setDeleteConfirm(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete formula.");
      }
    });
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Formulas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and edit your perfume formulations ({formulas.length} total)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search formulas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
          <Button asChild>
            <Link href="/formulas/new">
              <Plus className="mr-1 h-4 w-4" />
              New Formula
            </Link>
          </Button>
        </div>
      </div>

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
                      <Link
                        href={`/formulas/${formula.id}`}
                        className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Open Workspace <ArrowRight className="h-3 w-3" />
                      </Link>
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
