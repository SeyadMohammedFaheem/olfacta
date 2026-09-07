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

    let created = 0;
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const trimmedName = item.name?.trim();
        if (!trimmedName) continue;

        // Check if ingredient already exists in this org
        const existing = await tx.ingredient.findFirst({
          where: {
            organizationId: user.organizationId,
            name: { equals: trimmedName },
          },
        });

        const validTypes = ["ESSENTIAL_OIL", "AROMA_CHEMICAL", "EXTRACT", "SOLVENT", "BASE", "FRAGRANCE", "OTHER"];
        const matType = validTypes.includes(item.materialType?.toUpperCase() || "")
          ? (item.materialType?.toUpperCase() as any)
          : "FRAGRANCE";

        if (existing) {
          await tx.ingredient.update({
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
          await tx.ingredient.create({
            data: {
              organizationId: user.organizationId,
              name: trimmedName,
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
          created++;
        }
      }

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: "INGREDIENTS_BULK_IMPORTED",
          entityType: "Ingredient",
          entityId: "bulk",
          newValue: JSON.stringify({ created, updated, total: items.length }),
        },
      });
    });

    revalidatePath("/ingredients");
    revalidatePath("/formulas");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { created, updated, total: items.length },
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

    let createdFormulaId = "";

    await prisma.$transaction(async (tx) => {
      // 1. Create Formula
      const formula = await tx.formula.create({
        data: {
          organizationId: user.organizationId,
          name: input.formulaName.trim(),
          description: input.description?.trim() || "Imported from spreadsheet",
          productType: (input.productType as any) || "EAU_DE_PARFUM",
          status: "DRAFT",
          createdById: user.id,
        },
      });

      createdFormulaId = formula.id;

      // 2. Resolve/Create ingredients and calculate total weight
      const totalWeight = input.ingredients.reduce(
        (sum, ing) => sum + (typeof ing.quantity === "number" && !isNaN(ing.quantity) ? ing.quantity : 0),
        0
      );

      const targetWeight = input.targetWeight && input.targetWeight > 0 ? input.targetWeight : (totalWeight > 0 ? totalWeight : 1000);

      // 3. Create Version 1
      const version = await tx.formulaVersion.create({
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

      // 4. Link Formula Ingredients
      for (let i = 0; i < input.ingredients.length; i++) {
        const row = input.ingredients[i];
        const ingName = row.name.trim();
        if (!ingName) continue;

        // Find or create in organ
        let ingredient = await tx.ingredient.findFirst({
          where: {
            organizationId: user.organizationId,
            name: { equals: ingName },
          },
        });

        if (!ingredient) {
          ingredient = await tx.ingredient.create({
            data: {
              organizationId: user.organizationId,
              name: ingName,
              casNumber: row.casNumber?.trim() || null,
              materialType: "FRAGRANCE",
              status: "ACTIVE",
            },
          });
        }

        const qty = typeof row.quantity === "number" && !isNaN(row.quantity) ? row.quantity : 0;
        const pct = targetWeight > 0 ? (qty / targetWeight) * 100 : 0;

        await tx.formulaIngredient.create({
          data: {
            formulaVersionId: version.id,
            ingredientId: ingredient.id,
            quantity: qty,
            percentage: pct,
            sortOrder: i,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: "FORMULA_IMPORTED_FROM_SHEET",
          entityType: "Formula",
          entityId: formula.id,
          newValue: JSON.stringify({ name: formula.name, ingredientsCount: input.ingredients.length }),
        },
      });
    });

    revalidatePath("/formulas");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        formulaId: createdFormulaId,
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
