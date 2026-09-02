"use server";

import { prisma } from "@/lib/db/prisma";
import { getSessionOrThrow } from "@/lib/auth/session";
import { checkPermission } from "@/lib/permissions";
import { createIngredientSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function getIngredients(search?: string) {
  const user = await getSessionOrThrow();

  return prisma.ingredient.findMany({
    where: {
      organizationId: user.organizationId,
      status: { not: "ARCHIVED" },
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { casNumber: { contains: search } },
              { inciName: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      ingredientSuppliers: {
        include: { supplier: { select: { id: true, name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getIngredient(id: string) {
  const user = await getSessionOrThrow();

  const [ingredient, rules] = await Promise.all([
    prisma.ingredient.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        ingredientSuppliers: {
          include: { supplier: true },
        },
        formulaIngredients: {
          include: {
            formulaVersion: {
              include: { formula: { select: { id: true, name: true, productType: true, status: true } } },
            },
          },
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.regulatoryRule.findMany({
      where: {
        OR: [
          { ingredientId: id },
          { ingredientId: null },
        ],
        status: "ACTIVE",
      },
    }),
  ]);

  if (!ingredient) throw new Error("Ingredient not found");
  return { ...ingredient, regulatoryRules: rules.filter((r) => r.ingredientId === id) };
}

export async function createIngredient(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "ingredient:create");

    const raw = {
      name: formData.get("name") as string,
      casNumber: (formData.get("casNumber") as string) || null,
      inciName: (formData.get("inciName") as string) || null,
      materialType: formData.get("materialType") as string,
      description: (formData.get("description") as string) || null,
      density: formData.get("density") ? parseFloat(formData.get("density") as string) : null,
      dilutionPercentage: formData.get("dilutionPercentage") ? parseFloat(formData.get("dilutionPercentage") as string) : 100,
      diluentSolvent: (formData.get("diluentSolvent") as string) || "None (Pure)",
      compositionBreakdown: (formData.get("compositionBreakdown") as string) || null,
      costPerUnit: formData.get("costPerUnit") ? parseFloat(formData.get("costPerUnit") as string) : null,
      costCurrency: (formData.get("costCurrency") as string) || "USD",
      costUnit: (formData.get("costUnit") as string) || "g",
      supplierId: (formData.get("supplierId") as string) || null,
    };

    const parsed = createIngredientSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { supplierId, ...data } = parsed.data;

    const ingredient = await prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.create({
        data: {
          organizationId: user.organizationId,
          ...data,
          materialType: data.materialType as any,
        },
      });

      if (supplierId) {
        await tx.ingredientSupplier.create({
          data: { ingredientId: ingredient.id, supplierId },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: "INGREDIENT_CREATED",
          entityType: "Ingredient",
          entityId: ingredient.id,
          newValue: JSON.stringify({ name: data.name }),
        },
      });

      return ingredient;
    });

    revalidatePath("/ingredients");
    return { success: true, data: { id: ingredient.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create ingredient" };
  }
}

export async function searchIngredients(query: string) {
  const user = await getSessionOrThrow();

  return prisma.ingredient.findMany({
    where: {
      organizationId: user.organizationId,
      status: "ACTIVE",
      OR: [
        { name: { contains: query } },
        { casNumber: { contains: query } },
        { inciName: { contains: query } },
      ],
    },
    include: {
      ingredientSuppliers: {
        include: { supplier: { select: { name: true } } },
        take: 1,
      },
    },
    take: 20,
    orderBy: { name: "asc" },
  });
}

export async function quickCreateOil(data: {
  name: string;
  materialType?: string;
  casNumber?: string;
  description?: string;
  dilutionPercentage?: number;
  diluentSolvent?: string;
  compositionBreakdown?: string;
  costPerUnit?: number;
  supplierName?: string;
}): Promise<ActionResult<{ id: string; name: string; materialType: string; casNumber: string | null; costPerUnit: number | null; dilutionPercentage: number | null; diluentSolvent: string | null; compositionBreakdown: string | null }>> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "ingredient:create");

    if (!data.name || !data.name.trim()) {
      return { success: false, error: "Oil / material name is required." };
    }

    const materialType = data.materialType || "ESSENTIAL_OIL";

    const ingredient = await prisma.$transaction(async (tx) => {
      let supplierId: string | null = null;

      if (data.supplierName && data.supplierName.trim()) {
        let supplier = await tx.supplier.findFirst({
          where: { organizationId: user.organizationId, name: data.supplierName.trim() },
        });
        if (!supplier) {
          supplier = await tx.supplier.create({
            data: {
              organizationId: user.organizationId,
              name: data.supplierName.trim(),
            },
          });
        }
        supplierId = supplier.id;
      }

      const ing = await tx.ingredient.create({
        data: {
          organizationId: user.organizationId,
          name: data.name.trim(),
          materialType: materialType as any,
          casNumber: data.casNumber?.trim() || null,
          description: data.description?.trim() || null,
          dilutionPercentage: data.dilutionPercentage !== undefined ? data.dilutionPercentage : 100,
          diluentSolvent: data.diluentSolvent?.trim() || (data.dilutionPercentage && data.dilutionPercentage < 100 ? "DPG" : "None (Pure)"),
          compositionBreakdown: data.compositionBreakdown?.trim() || null,
          costPerUnit: data.costPerUnit || null,
          costCurrency: "USD",
          costUnit: "g",
          status: "ACTIVE",
        },
      });

      if (supplierId) {
        await tx.ingredientSupplier.create({
          data: { ingredientId: ing.id, supplierId },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: "INGREDIENT_CREATED",
          entityType: "Ingredient",
          entityId: ing.id,
          newValue: JSON.stringify({ name: ing.name, materialType: ing.materialType, dilutionPercentage: ing.dilutionPercentage }),
        },
      });

      return ing;
    });

    revalidatePath("/ingredients");
    return {
      success: true,
      data: {
        id: ingredient.id,
        name: ingredient.name,
        materialType: ingredient.materialType,
        casNumber: ingredient.casNumber,
        costPerUnit: ingredient.costPerUnit,
        dilutionPercentage: ingredient.dilutionPercentage,
        diluentSolvent: ingredient.diluentSolvent,
        compositionBreakdown: ingredient.compositionBreakdown,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to add oil to collection." };
  }
}

export async function deleteIngredient(id: string): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "ingredient:create");

    const ingredient = await prisma.ingredient.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        formulaIngredients: true,
      },
    });

    if (!ingredient) return { success: false, error: "Ingredient not found." };

    if (ingredient.formulaIngredients.length > 0) {
      // In use: soft-archive so formula historical versions don't break
      await prisma.ingredient.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });
    } else {
      // Unused: delete completely along with relations
      await prisma.$transaction([
        prisma.ingredientSupplier.deleteMany({ where: { ingredientId: id } }),
        prisma.regulatoryRule.deleteMany({ where: { ingredientId: id } }),
        prisma.inventoryLot.deleteMany({ where: { ingredientId: id } }),
        prisma.ingredient.delete({ where: { id } }),
      ]);
    }

    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "INGREDIENT_DELETED",
        entityType: "Ingredient",
        entityId: id,
        oldValue: JSON.stringify({ name: ingredient.name }),
      },
    });

    revalidatePath("/ingredients");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete ingredient." };
  }
}

export async function lookupMaterialApi(query: string) {
  const { lookupMaterial } = await import("@/lib/api/materials-lookup");
  return lookupMaterial(query);
}

export async function searchPaletteGlobal(query: string) {
  if (!query || query.trim().length < 2) {
    return { formulas: [], ingredients: [], batches: [] };
  }

  const user = await getSessionOrThrow();
  const trimmed = query.trim();

  const [formulas, ingredients, batches] = await Promise.all([
    prisma.formula.findMany({
      where: {
        organizationId: user.organizationId,
        OR: [
          { name: { contains: trimmed } },
          { description: { contains: trimmed } },
          { productType: { contains: trimmed } },
        ],
      },
      select: {
        id: true,
        name: true,
        productType: true,
        status: true,
      },
      take: 5,
    }),
    prisma.ingredient.findMany({
      where: {
        organizationId: user.organizationId,
        status: { not: "ARCHIVED" },
        OR: [
          { name: { contains: trimmed } },
          { casNumber: { contains: trimmed } },
          { inciName: { contains: trimmed } },
        ],
      },
      select: {
        id: true,
        name: true,
        casNumber: true,
        materialType: true,
        dilutionPercentage: true,
        diluentSolvent: true,
      },
      take: 6,
    }),
    prisma.batch.findMany({
      where: {
        organizationId: user.organizationId,
        OR: [
          { batchNumber: { contains: trimmed } },
          { formula: { name: { contains: trimmed } } },
        ],
      },
      select: {
        id: true,
        batchNumber: true,
        status: true,
        targetQuantity: true,
        unit: true,
        formula: { select: { name: true } },
      },
      take: 4,
    }),
  ]);

  return { formulas, ingredients, batches };
}
