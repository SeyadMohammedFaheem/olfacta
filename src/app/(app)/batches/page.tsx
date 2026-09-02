import Link from "next/link";
import { Factory } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getBatches } from "@/services/batch/actions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Batches — Olfacta" };

export default async function BatchesPage() {
  const batches = await getBatches();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Batches</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Production batches and tracking</p>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="No batches yet"
          description="Create a production batch from an approved formula."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="px-5 py-3 font-medium">Batch</th>
                  <th className="px-5 py-3 font-medium">Formula</th>
                  <th className="px-5 py-3 font-medium">Target Quantity</th>
                  <th className="px-5 py-3 font-medium">Scale</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/batches/${batch.id}`} className="font-medium hover:underline">
                        {batch.batchNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {batch.formula.name} v{batch.formulaVersion.versionNumber}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {batch.targetQuantity.toLocaleString()} {batch.unit}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground tabular-nums">
                      {batch.scaleFactor}×
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatDate(batch.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/batches/${batch.id}`} className="text-xs font-medium text-primary hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
