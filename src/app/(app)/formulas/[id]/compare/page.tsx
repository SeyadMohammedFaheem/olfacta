import { getFormula } from "@/services/formula/actions";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { VersionCompareClient } from "./version-compare-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const formula = await getFormula(id);
    return { title: `Compare Versions — ${formula.name} — Olfacta` };
  } catch {
    return { title: "Version Comparison — Olfacta" };
  }
}

export default async function VersionComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v1?: string; v2?: string }>;
}) {
  const { id } = await params;
  const { v1, v2 } = await searchParams;

  const user = await getSession();
  if (!user) redirect("/login");

  let formula;
  try {
    formula = await getFormula(id);
  } catch {
    redirect("/formulas");
  }

  return (
    <VersionCompareClient
      formula={formula}
      initialV1={v1 ? parseInt(v1) : undefined}
      initialV2={v2 ? parseInt(v2) : undefined}
    />
  );
}
