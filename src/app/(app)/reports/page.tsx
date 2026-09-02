import { prisma } from "@/lib/db/prisma";
import { getSessionOrThrow } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ShieldCheck, Factory } from "lucide-react";
import { ReportsClient } from "./reports-client";

export const metadata = { title: "Reports — Olfacta" };

export default async function ReportsPage() {
  const user = await getSessionOrThrow();
  const orgId = user.organizationId;

  const [formulas, batches, ingredients] = await Promise.all([
    prisma.formula.findMany({
      where: { organizationId: orgId },
      include: {
        versions: {
          take: 1,
          orderBy: { versionNumber: "desc" },
          include: {
            ingredients: {
              include: { ingredient: true },
            },
          },
        },
      },
    }),
    prisma.batch.findMany({
      where: { organizationId: orgId },
      include: {
        formula: true,
        ingredients: { include: { ingredient: true } },
      },
    }),
    prisma.ingredient.findMany({
      where: { organizationId: orgId },
    }),
  ]);

  return (
    <ReportsClient
      formulas={formulas}
      batches={batches}
      ingredients={ingredients}
    />
  );
}
