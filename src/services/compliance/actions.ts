"use server";

import { prisma } from "@/lib/db/prisma";
import { getSessionOrThrow } from "@/lib/auth/session";
import { checkPermission } from "@/lib/permissions";
import { createRuleSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function createRegulatoryRule(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "compliance:manage");

    const raw = {
      ingredientId: (formData.get("ingredientId") as string) || null,
      productCategory: (formData.get("productCategory") as string) || null,
      market: (formData.get("market") as string) || null,
      standard: (formData.get("standard") as string) || "Company Internal Standard",
      ruleType: formData.get("ruleType") as string,
      limitValue: formData.get("limitValue") ? parseFloat(formData.get("limitValue") as string) : null,
      unit: (formData.get("unit") as string) || "%",
      severity: formData.get("severity") as string,
      warnAtPercentage: formData.get("warnAtPercentage") ? parseFloat(formData.get("warnAtPercentage") as string) : 80,
      message: formData.get("message") as string,
      isDemo: false,
    };

    const parsed = createRuleSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const data = parsed.data;

    const rule = await prisma.regulatoryRule.create({
      data: {
        organizationId: user.organizationId,
        ingredientId: data.ingredientId || null,
        productCategory: data.productCategory || null,
        market: data.market || null,
        standard: data.standard || "Company Standard",
        ruleType: data.ruleType as any,
        limitValue: data.limitValue ?? null,
        unit: data.unit,
        severity: data.severity as any,
        warnAtPercentage: data.warnAtPercentage ?? null,
        message: data.message || "Custom safety restriction",
        isDemo: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "RULE_CREATED",
        entityType: "RegulatoryRule",
        entityId: rule.id,
        newValue: JSON.stringify({ ruleType: rule.ruleType, limitValue: rule.limitValue }),
      },
    });

    revalidatePath("/compliance");
    return { success: true, data: { id: rule.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create regulatory rule" };
  }
}
