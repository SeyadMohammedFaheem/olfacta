import { prisma } from "@/lib/db/prisma";
import { getSessionOrThrow } from "@/lib/auth/session";
import { ComplianceClient } from "./compliance-client";

export const metadata = { title: "Compliance & Regulatory — Olfacta" };

export default async function CompliancePage() {
  const user = await getSessionOrThrow();
  const orgId = user.organizationId;

  const [rules, profiles, findings, ingredients] = await Promise.all([
    prisma.regulatoryRule.findMany({
      where: { organizationId: orgId },
      include: {
        ingredient: { select: { id: true, name: true, casNumber: true } },
        source: { select: { name: true, version: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.regulatoryProfile.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.complianceFinding.findMany({
      where: { formula: { organizationId: orgId } },
      include: {
        formula: { select: { id: true, name: true } },
        ingredient: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ingredient.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      select: { id: true, name: true, casNumber: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ComplianceClient
      rules={rules}
      profiles={profiles}
      findings={findings}
      ingredients={ingredients}
      user={user}
    />
  );
}
