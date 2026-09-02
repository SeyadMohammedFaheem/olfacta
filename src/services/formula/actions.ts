"use server";

import { prisma } from "@/lib/db/prisma";
import { getSessionOrThrow } from "@/lib/auth/session";
import { checkPermission } from "@/lib/permissions";
import { createFormulaSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { FormulaStatus, type ActionResult } from "@/types";

export async function getFormulas() {
  const user = await getSessionOrThrow();
  
  return prisma.formula.findMany({
    where: { organizationId: user.organizationId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: { id: true, versionNumber: true, status: true, totalWeight: true, totalPercentage: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getFormula(id: string) {
  const user = await getSessionOrThrow();
  
  const formula = await prisma.formula.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          ingredients: {
            include: {
              ingredient: {
                include: {
                  ingredientSuppliers: { include: { supplier: true } },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!formula) throw new Error("Formula not found");
  return formula;
}

export async function createFormula(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:create");

    const raw = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      productType: formData.get("productType") as string,
      applicationCategory: (formData.get("applicationCategory") as string) || "Fine Fragrance",
      market: (formData.get("market") as string) || "General",
      targetWeight: parseFloat(formData.get("targetWeight") as string),
      weightUnit: (formData.get("weightUnit") as string) || "g",
      concentration: parseFloat(formData.get("concentration") as string),
    };

    const parsed = createFormulaSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const data = parsed.data;

    const formula = await prisma.$transaction(async (tx) => {
      const formula = await tx.formula.create({
        data: {
          organizationId: user.organizationId,
          name: data.name,
          description: data.description,
          productType: data.productType as any,
          applicationCategory: data.applicationCategory,
          market: data.market,
          createdById: user.id,
        },
      });

      await tx.formulaVersion.create({
        data: {
          formulaId: formula.id,
          versionNumber: 1,
          targetWeight: data.targetWeight,
          weightUnit: data.weightUnit,
          concentration: data.concentration,
          createdById: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: "FORMULA_CREATED",
          entityType: "Formula",
          entityId: formula.id,
          newValue: JSON.stringify({ name: data.name, productType: data.productType }),
        },
      });

      return formula;
    });

    revalidatePath("/formulas");
    return { success: true, data: { id: formula.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create formula" };
  }
}

export async function addIngredientToFormula(
  formulaVersionId: string,
  ingredientId: string,
  quantity: number = 0
): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:edit");

    // Verify version belongs to user's org
    const version = await prisma.formulaVersion.findFirst({
      where: {
        id: formulaVersionId,
        formula: { organizationId: user.organizationId },
        status: "DRAFT",
      },
    });
    if (!version) return { success: false, error: "Formula version not found or not editable." };

    // Verify ingredient belongs to user's org
    const ingredient = await prisma.ingredient.findFirst({
      where: { id: ingredientId, organizationId: user.organizationId },
    });
    if (!ingredient) return { success: false, error: "Ingredient not found." };

    // Get max sort order
    const maxSort = await prisma.formulaIngredient.findFirst({
      where: { formulaVersionId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await prisma.formulaIngredient.create({
      data: {
        formulaVersionId,
        ingredientId,
        quantity,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "INGREDIENT_ADDED",
        entityType: "FormulaVersion",
        entityId: formulaVersionId,
        newValue: JSON.stringify({ ingredientId, ingredientName: ingredient.name, quantity }),
      },
    });

    revalidatePath(`/formulas`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to add ingredient" };
  }
}

export async function updateIngredientQuantity(
  formulaIngredientId: string,
  quantity: number
): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:edit");

    if (quantity < 0) return { success: false, error: "Quantity cannot be negative." };

    const fi = await prisma.formulaIngredient.findFirst({
      where: { id: formulaIngredientId },
      include: {
        formulaVersion: { include: { formula: true } },
        ingredient: true,
      },
    });

    if (!fi || fi.formulaVersion.formula.organizationId !== user.organizationId) {
      return { success: false, error: "Ingredient not found." };
    }
    if (fi.formulaVersion.status !== "DRAFT") {
      return { success: false, error: "Cannot edit a non-draft formula version." };
    }

    const oldQuantity = fi.quantity;

    await prisma.formulaIngredient.update({
      where: { id: formulaIngredientId },
      data: { quantity },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "QUANTITY_CHANGED",
        entityType: "FormulaIngredient",
        entityId: formulaIngredientId,
        oldValue: JSON.stringify({ quantity: oldQuantity }),
        newValue: JSON.stringify({ quantity, ingredientName: fi.ingredient.name }),
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update quantity" };
  }
}

export async function removeIngredientFromFormula(
  formulaIngredientId: string
): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:edit");

    const fi = await prisma.formulaIngredient.findFirst({
      where: { id: formulaIngredientId },
      include: {
        formulaVersion: { include: { formula: true } },
        ingredient: true,
      },
    });

    if (!fi || fi.formulaVersion.formula.organizationId !== user.organizationId) {
      return { success: false, error: "Ingredient not found." };
    }
    if (fi.formulaVersion.status !== "DRAFT") {
      return { success: false, error: "Cannot edit a non-draft formula version." };
    }

    await prisma.formulaIngredient.delete({ where: { id: formulaIngredientId } });

    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "INGREDIENT_REMOVED",
        entityType: "FormulaVersion",
        entityId: fi.formulaVersionId,
        oldValue: JSON.stringify({ ingredientName: fi.ingredient.name, quantity: fi.quantity }),
      },
    });

    revalidatePath(`/formulas`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to remove ingredient" };
  }
}

export async function submitFormulaForReview(formulaId: string): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:submit");

    const formula = await prisma.formula.findFirst({
      where: { id: formulaId, organizationId: user.organizationId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!formula) return { success: false, error: "Formula not found." };

    const latestVersion = formula.versions[0];
    if (!latestVersion || latestVersion.status !== "DRAFT") {
      return { success: false, error: "Only draft formulas can be submitted for review." };
    }

    await prisma.$transaction([
      prisma.formulaVersion.update({
        where: { id: latestVersion.id },
        data: { status: "IN_REVIEW" },
      }),
      prisma.formula.update({
        where: { id: formulaId },
        data: { status: "IN_REVIEW" },
      }),
      prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: "FORMULA_SUBMITTED",
          entityType: "Formula",
          entityId: formulaId,
        },
      }),
    ]);

    revalidatePath("/formulas");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to submit formula" };
  }
}

export async function approveFormula(formulaId: string): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:approve");

    const formula = await prisma.formula.findFirst({
      where: { id: formulaId, organizationId: user.organizationId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!formula) return { success: false, error: "Formula not found." };

    const latestVersion = formula.versions[0];
    if (!latestVersion || latestVersion.status !== "IN_REVIEW") {
      return { success: false, error: "Only formulas in review can be approved." };
    }

    await prisma.$transaction([
      prisma.formulaVersion.update({
        where: { id: latestVersion.id },
        data: {
          status: "APPROVED",
          approvedById: user.id,
          approvedAt: new Date(),
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      }),
      prisma.formula.update({
        where: { id: formulaId },
        data: { status: "APPROVED" },
      }),
      prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: "FORMULA_APPROVED",
          entityType: "Formula",
          entityId: formulaId,
        },
      }),
    ]);

    revalidatePath("/formulas");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to approve formula" };
  }
}

export async function rejectFormula(formulaId: string, notes?: string): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:reject");

    const formula = await prisma.formula.findFirst({
      where: { id: formulaId, organizationId: user.organizationId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!formula) return { success: false, error: "Formula not found." };

    const latestVersion = formula.versions[0];
    if (!latestVersion || latestVersion.status !== "IN_REVIEW") {
      return { success: false, error: "Only formulas in review can be rejected." };
    }

    await prisma.$transaction([
      prisma.formulaVersion.update({
        where: { id: latestVersion.id },
        data: {
          status: "REJECTED",
          reviewedById: user.id,
          reviewedAt: new Date(),
          reviewNotes: notes,
        },
      }),
      prisma.formula.update({
        where: { id: formulaId },
        data: { status: "REJECTED" },
      }),
      prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: "FORMULA_REJECTED",
          entityType: "Formula",
          entityId: formulaId,
          newValue: notes ? JSON.stringify({ notes }) : undefined,
        },
      }),
    ]);

    revalidatePath("/formulas");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to reject formula" };
  }
}

export async function createNewVersion(formulaId: string): Promise<ActionResult<{ versionId: string }>> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:edit");

    const formula = await prisma.formula.findFirst({
      where: { id: formulaId, organizationId: user.organizationId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: { ingredients: true },
        },
      },
    });

    if (!formula) return { success: false, error: "Formula not found." };

    const latestVersion = formula.versions[0];
    if (!latestVersion) return { success: false, error: "No version found." };

    const newVersion = await prisma.$transaction(async (tx) => {
      const version = await tx.formulaVersion.create({
        data: {
          formulaId,
          versionNumber: latestVersion.versionNumber + 1,
          targetWeight: latestVersion.targetWeight,
          weightUnit: latestVersion.weightUnit,
          concentration: latestVersion.concentration,
          createdById: user.id,
        },
      });

      // Copy ingredients from previous version
      if (latestVersion.ingredients.length > 0) {
        await tx.formulaIngredient.createMany({
          data: latestVersion.ingredients.map((i) => ({
            formulaVersionId: version.id,
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            unit: i.unit,
            sortOrder: i.sortOrder,
            notes: i.notes,
          })),
        });
      }

      await tx.formula.update({
        where: { id: formulaId },
        data: { status: "DRAFT" },
      });

      return version;
    });

    revalidatePath("/formulas");
    return { success: true, data: { versionId: newVersion.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create version" };
  }
}

export async function updateFormulaSetup(
  formulaId: string,
  versionId: string,
  data: {
    name?: string;
    description?: string;
    productType?: string;
    applicationCategory?: string;
    market?: string;
    targetWeight?: number;
    weightUnit?: string;
    concentration?: number;
    notes?: string;
  }
): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:edit");

    const formula = await prisma.formula.findFirst({
      where: { id: formulaId, organizationId: user.organizationId },
    });
    if (!formula) return { success: false, error: "Formula not found." };

    await prisma.$transaction(async (tx) => {
      await tx.formula.update({
        where: { id: formulaId },
        data: {
          name: data.name ?? formula.name,
          description: data.description !== undefined ? data.description : formula.description,
          productType: data.productType ? (data.productType as any) : formula.productType,
          applicationCategory: data.applicationCategory ?? formula.applicationCategory,
          market: data.market ?? formula.market,
        },
      });

      if (versionId) {
        await tx.formulaVersion.update({
          where: { id: versionId },
          data: {
            targetWeight: data.targetWeight,
            weightUnit: data.weightUnit,
            concentration: data.concentration,
            notes: data.notes,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: "FORMULA_SETUP_UPDATED",
          entityType: "Formula",
          entityId: formulaId,
          newValue: JSON.stringify(data),
        },
      });
    });

    revalidatePath(`/formulas/${formulaId}`);
    revalidatePath(`/formulas`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update formula setup" };
  }
}

export async function saveFormulaVersion(
  versionId: string,
  totalWeight: number,
  totalPercentage: number
): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();

    const version = await prisma.formulaVersion.findFirst({
      where: { id: versionId, formula: { organizationId: user.organizationId } },
    });

    if (!version) return { success: false, error: "Version not found." };
    if (version.status !== "DRAFT") return { success: false, error: "Cannot save a non-draft version." };

    await prisma.formulaVersion.update({
      where: { id: versionId },
      data: { totalWeight, totalPercentage },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to save" };
  }
}

export async function deleteFormula(formulaId: string): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "formula:delete");

    const formula = await prisma.formula.findFirst({
      where: { id: formulaId, organizationId: user.organizationId },
    });

    if (!formula) return { success: false, error: "Formula not found." };

    await prisma.$transaction(async (tx) => {
      // Find all versions
      const versions = await tx.formulaVersion.findMany({
        where: { formulaId },
        select: { id: true },
      });
      const versionIds = versions.map((v) => v.id);

      // Clean up relations
      await tx.batchIngredient.deleteMany({
        where: { batch: { formulaId } },
      });
      await tx.batch.deleteMany({
        where: { formulaId },
      });
      await tx.complianceFinding.deleteMany({
        where: { formulaId },
      });
      await tx.complianceSnapshot.deleteMany({
        where: { formulaVersionId: { in: versionIds } },
      });
      await tx.formulaIngredient.deleteMany({
        where: { formulaVersionId: { in: versionIds } },
      });
      await tx.formulaVersion.deleteMany({
        where: { formulaId },
      });
      await tx.formula.delete({
        where: { id: formulaId },
      });

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: "FORMULA_DELETED",
          entityType: "Formula",
          entityId: formulaId,
          oldValue: JSON.stringify({ name: formula.name }),
        },
      });
    });

    revalidatePath("/formulas");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete formula." };
  }
}
