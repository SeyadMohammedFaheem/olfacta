import { getFormula } from "@/services/formula/actions";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { FormulaWorkspaceClient } from "./workspace-client";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const formula = await getFormula(id);
    return { title: `${formula.name} — Olfacta` };
  } catch {
    return { title: "Formula — Olfacta" };
  }
}

export default async function FormulaWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");

  let formula;
  try {
    formula = await getFormula(id);
  } catch {
    redirect("/formulas");
  }

  // Get org rules for compliance evaluation
  const rules = await prisma.regulatoryRule.findMany({
    where: {
      organizationId: user.organizationId,
      status: "ACTIVE",
    },
  });

  return (
    <FormulaWorkspaceClient
      formula={formula}
      rules={rules}
      user={user}
    />
  );
}
