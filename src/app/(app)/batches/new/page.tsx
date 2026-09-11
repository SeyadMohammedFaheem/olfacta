import { Suspense } from "react";
import { CreateBatchClient } from "./create-batch-client";
import { getApprovedFormulas } from "@/services/formula/actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create Batch — Olfacta" };

export default async function CreateBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ formulaId?: string; versionId?: string }>;
}) {
  const params = await searchParams;
  const approvedFormulas = await getApprovedFormulas();

  const selectedFormulaId = params.formulaId || "";
  const selectedVersionId = params.versionId || "";

  // Only pre-fetch the full formula when a formulaId was explicitly provided
  let initialFormula: any = null;
  if (selectedFormulaId) {
    try {
      const { getFormula } = await import("@/services/formula/actions");
      initialFormula = await getFormula(selectedFormulaId);
    } catch {
      // ignore
    }
  }

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading batch scaling workspace...</div>}>
      <CreateBatchClient
        approvedFormulas={approvedFormulas}
        initialFormula={initialFormula}
        initialFormulaId={selectedFormulaId}
        initialVersionId={selectedVersionId}
      />
    </Suspense>
  );
}
