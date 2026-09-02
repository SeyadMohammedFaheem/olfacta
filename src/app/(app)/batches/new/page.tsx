import { Suspense } from "react";
import { CreateBatchClient } from "./create-batch-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create Batch — Olfacta" };

export default async function CreateBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ formulaId?: string; versionId?: string }>;
}) {
  const params = await searchParams;
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading batch scaling workspace...</div>}>
      <CreateBatchClient
        initialFormulaId={params.formulaId || ""}
        initialVersionId={params.versionId || ""}
      />
    </Suspense>
  );
}
