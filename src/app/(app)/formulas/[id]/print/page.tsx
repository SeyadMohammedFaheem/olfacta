import { getFormula } from "@/services/formula/actions";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { FormulaPrintClient } from "./print-client";
import { redirect } from "next/navigation";
import { evaluateFormula, calculateComplianceSummary } from "@/lib/compliance";

export const dynamic = "force-dynamic";
export const metadata = { title: "Approved Formula Specification & Guide — Olfacta" };

export default async function FormulaPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ versionId?: string; autoPrint?: string }>;
}) {
  const { id } = await params;
  const { versionId, autoPrint } = await searchParams;
  const user = await getSession();
  if (!user) redirect("/login");

  let formula;
  try {
    formula = await getFormula(id);
  } catch {
    redirect("/formulas");
  }

  // Find targeted version or default to the latest/approved version
  const versions = formula.versions || [];
  let selectedVersion = versionId
    ? versions.find((v: any) => v.id === versionId)
    : versions.find((v: any) => v.status === "APPROVED") || versions[0];

  if (!selectedVersion) {
    redirect(`/formulas/${id}`);
  }

  // Fetch organization profile
  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { id: true, name: true, slug: true },
  });

  // Fetch regulatory rules for this org
  const rules = await prisma.regulatoryRule.findMany({
    where: {
      organizationId: user.organizationId,
      status: "ACTIVE",
    },
  });

  // Evaluate live compliance findings for this version
  const ingredients = selectedVersion.ingredients || [];
  const findings = evaluateFormula(
    ingredients.map((i: any) => ({
      ingredientId: i.ingredientId,
      ingredientName: i.ingredient?.name || i.name,
      quantity: i.quantity,
      materialType: i.ingredient?.materialType || i.materialType,
      unit: i.unit || "g",
    })),
    rules as any,
    {
      productCategory: formula.productType || undefined,
      applicationArea: formula.applicationCategory || undefined,
      market: formula.market || undefined,
    }
  );

  const complianceSummary = calculateComplianceSummary(findings);

  return (
    <FormulaPrintClient
      formula={formula}
      version={selectedVersion}
      organization={organization || { name: "Olfacta Lab" }}
      approverName={selectedVersion.approvedBy?.name}
      creatorName={selectedVersion.createdBy?.name || formula.createdBy?.name}
      complianceSummary={complianceSummary}
      autoPrint={autoPrint === "true" || autoPrint === "1"}
    />
  );
}
