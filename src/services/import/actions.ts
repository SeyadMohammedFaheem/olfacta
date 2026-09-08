"use server";

import { prisma } from "@/lib/db/prisma";
import { getSessionOrThrow } from "@/lib/auth/session";
import { checkPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export interface SheetIngredientInput {
  name: string;
  casNumber?: string;
  inciName?: string;
  materialType?: string;
  dilutionPercentage?: number;
  diluentSolvent?: string;
  costPerUnit?: number;
  description?: string;
}

export interface SheetFormulaInput {
  formulaName: string;
  productType?: string;
  targetWeight?: number;
  concentration?: number;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    casNumber?: string;
  }>;
}

/**
 * Bulk imports raw materials / oils directly from spreadsheet rows.
 * Skips or updates existing materials if duplicate names match.
 */
export async function bulkImportIngredientsFromSheet(
  items: SheetIngredientInput[]
): Promise<ActionResult<{ created: number; updated: number; total: number }>> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:create"); // Creator or Admin

    if (!items || items.length === 0) {
      return { success: false, error: "No rows provided for import." };
    }

    // 1. Sanitize items
    const validItems = items
      .map((it) => ({ ...it, name: it.name?.trim() }))
      .filter((it): it is SheetIngredientInput & { name: string } => !!it.name);

    if (validItems.length === 0) {
      return { success: false, error: "No valid material names found in import." };
    }

    // 2. Fetch existing ingredients for this organization in ONE query
    const names = Array.from(new Set(validItems.map((it) => it.name)));
    const existingList = await prisma.ingredient.findMany({
      where: {
        organizationId: user.organizationId,
        name: { in: names },
      },
      select: {
        id: true,
        name: true,
        casNumber: true,
        inciName: true,
        costPerUnit: true,
        description: true,
        dilutionPercentage: true,
        diluentSolvent: true,
      },
    });

    const existingMap = new Map<string, (typeof existingList)[0]>();
    for (const ing of existingList) {
      existingMap.set(ing.name.toLowerCase(), ing);
    }

    let created = 0;
    let updated = 0;

    const validTypes = ["ESSENTIAL_OIL", "AROMA_CHEMICAL", "EXTRACT", "SOLVENT", "BASE", "FRAGRANCE", "OTHER"];

    // 3. Process items directly without an interactive long transaction
    for (const item of validItems) {
      const existing = existingMap.get(item.name.toLowerCase());
      const matType = validTypes.includes(item.materialType?.toUpperCase() || "")
        ? (item.materialType?.toUpperCase() as any)
        : "FRAGRANCE";

      if (existing) {
        await prisma.ingredient.update({
          where: { id: existing.id },
          data: {
            casNumber: item.casNumber?.trim() || existing.casNumber,
            inciName: item.inciName?.trim() || existing.inciName,
            costPerUnit: typeof item.costPerUnit === "number" ? item.costPerUnit : existing.costPerUnit,
            description: item.description?.trim() || existing.description,
            dilutionPercentage: typeof item.dilutionPercentage === "number" ? item.dilutionPercentage : existing.dilutionPercentage,
            diluentSolvent: item.diluentSolvent?.trim() || existing.diluentSolvent,
          },
        });
        updated++;
      } else {
        const newIng = await prisma.ingredient.create({
          data: {
            organizationId: user.organizationId,
            name: item.name,
            casNumber: item.casNumber?.trim() || null,
            inciName: item.inciName?.trim() || null,
            materialType: matType,
            costPerUnit: typeof item.costPerUnit === "number" ? item.costPerUnit : null,
            description: item.description?.trim() || null,
            dilutionPercentage: typeof item.dilutionPercentage === "number" ? item.dilutionPercentage : 100,
            diluentSolvent: item.diluentSolvent?.trim() || "None (Pure)",
            status: "ACTIVE",
          },
        });
        existingMap.set(item.name.toLowerCase(), newIng as any);
        created++;
      }
    }

    // 4. Record audit log
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "INGREDIENTS_BULK_IMPORTED",
        entityType: "Ingredient",
        entityId: "bulk",
        newValue: JSON.stringify({ created, updated, total: validItems.length }),
      },
    });

    revalidatePath("/ingredients");
    revalidatePath("/formulas");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { created, updated, total: validItems.length },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import materials.",
    };
  }
}

/**
 * Imports a formula directly from spreadsheet rows.
 * Automatically links to existing raw materials or registers newly encountered oils.
 */
export async function importFormulaFromSheet(
  input: SheetFormulaInput
): Promise<ActionResult<{ formulaId: string; ingredientCount: number }>> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:create");

    if (!input.formulaName?.trim()) {
      return { success: false, error: "Formula name is required." };
    }

    if (!input.ingredients || input.ingredients.length === 0) {
      return { success: false, error: "Formula must have at least one ingredient row." };
    }

    // 1. Resolve / Pre-fetch or create all required ingredients first
    const ingredientNames = Array.from(new Set(input.ingredients.map((i) => i.name.trim()).filter(Boolean)));
    const existingIngredients = await prisma.ingredient.findMany({
      where: {
        organizationId: user.organizationId,
        name: { in: ingredientNames },
      },
      select: { id: true, name: true },
    });

    const ingMap = new Map<string, string>();
    for (const ing of existingIngredients) {
      ingMap.set(ing.name.toLowerCase(), ing.id);
    }

    // Create any missing ingredients
    for (const row of input.ingredients) {
      const ingName = row.name.trim();
      if (!ingName || ingMap.has(ingName.toLowerCase())) continue;

      const created = await prisma.ingredient.create({
        data: {
          organizationId: user.organizationId,
          name: ingName,
          casNumber: row.casNumber?.trim() || null,
          materialType: "FRAGRANCE",
          status: "ACTIVE",
        },
        select: { id: true, name: true },
      });
      ingMap.set(ingName.toLowerCase(), created.id);
    }

    // 2. Calculate weights
    const totalWeight = input.ingredients.reduce(
      (sum, ing) => sum + (typeof ing.quantity === "number" && !isNaN(ing.quantity) ? ing.quantity : 0),
      0
    );
    const targetWeight = input.targetWeight && input.targetWeight > 0 ? input.targetWeight : (totalWeight > 0 ? totalWeight : 1000);

    // 3. Create Formula and Version
    const formula = await prisma.formula.create({
      data: {
        organizationId: user.organizationId,
        name: input.formulaName.trim(),
        description: input.description?.trim() || "Imported from spreadsheet",
        productType: (input.productType as any) || "EAU_DE_PARFUM",
        status: "DRAFT",
        createdById: user.id,
      },
    });

    const version = await prisma.formulaVersion.create({
      data: {
        formulaId: formula.id,
        versionNumber: 1,
        targetWeight,
        concentration: input.concentration || 20,
        totalWeight,
        totalPercentage: targetWeight > 0 ? (totalWeight / targetWeight) * 100 : 100,
        status: "DRAFT",
        notes: "Imported via spreadsheet import",
        createdById: user.id,
      },
    });

    // 4. Batch create Formula Ingredients
    const formulaIngredientsData = input.ingredients
      .filter((r) => r.name.trim() && ingMap.has(r.name.trim().toLowerCase()))
      .map((r, i) => {
        const qty = typeof r.quantity === "number" && !isNaN(r.quantity) ? r.quantity : 0;
        const pct = targetWeight > 0 ? (qty / targetWeight) * 100 : 0;
        return {
          formulaVersionId: version.id,
          ingredientId: ingMap.get(r.name.trim().toLowerCase())!,
          quantity: qty,
          percentage: pct,
          sortOrder: i,
        };
      });

    if (formulaIngredientsData.length > 0) {
      await prisma.formulaIngredient.createMany({
        data: formulaIngredientsData,
      });
    }

    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "FORMULA_IMPORTED_FROM_SHEET",
        entityType: "Formula",
        entityId: formula.id,
        newValue: JSON.stringify({ name: formula.name, ingredientsCount: input.ingredients.length }),
      },
    });

    revalidatePath("/formulas");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        formulaId: formula.id,
        ingredientCount: input.ingredients.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import formula from spreadsheet.",
    };
  }
}
