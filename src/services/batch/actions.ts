"use server";

import { prisma } from "@/lib/db/prisma";
import { getSessionOrThrow } from "@/lib/auth/session";
import { checkPermission } from "@/lib/permissions";
import { createBatchSchema } from "@/lib/validation/schemas";
import { calculateScaleFactor, calculateScaledQuantity } from "@/lib/calculations";
import { generateBatchNumber } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function getBatches() {
  const user = await getSessionOrThrow();

  return prisma.batch.findMany({
    where: { organizationId: user.organizationId },
    include: {
      formula: { select: { id: true, name: true } },
      formulaVersion: { select: { id: true, versionNumber: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBatch(id: string) {
  const user = await getSessionOrThrow();

  const batch = await prisma.batch.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      formula: { select: { id: true, name: true } },
      formulaVersion: { select: { id: true, versionNumber: true, targetWeight: true } },
      createdBy: { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
      ingredients: {
        include: {
          ingredient: { select: { id: true, name: true, materialType: true } },
        },
      },
    },
  });

  if (!batch) throw new Error("Batch not found");
  return batch;
}

export async function createBatch(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "batch:create");

    const raw = {
      formulaId: formData.get("formulaId") as string,
      formulaVersionId: formData.get("formulaVersionId") as string,
      targetQuantity: parseFloat(formData.get("targetQuantity") as string),
      unit: (formData.get("unit") as string) || "g",
      notes: (formData.get("notes") as string) || undefined,
    };

    const parsed = createBatchSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const data = parsed.data;

    // Verify formula version is approved and belongs to org
    const version = await prisma.formulaVersion.findFirst({
      where: {
        id: data.formulaVersionId,
        formulaId: data.formulaId,
        status: "APPROVED",
        formula: { organizationId: user.organizationId },
      },
      include: {
        ingredients: {
          include: { ingredient: { select: { id: true, name: true } } },
        },
      },
    });

    if (!version) {
      return { success: false, error: "Only approved formula versions can be used for production batches." };
    }

    const scaleFactor = calculateScaleFactor(data.targetQuantity, version.targetWeight);

    const batch = await prisma.$transaction(async (tx) => {
      const batch = await tx.batch.create({
        data: {
          organizationId: user.organizationId,
          formulaId: data.formulaId,
          formulaVersionId: data.formulaVersionId,
          batchNumber: generateBatchNumber(),
          targetQuantity: data.targetQuantity,
          unit: data.unit,
          scaleFactor,
          notes: data.notes,
          createdById: user.id,
        },
      });

      // Create batch ingredients with scaled quantities
      await tx.batchIngredient.createMany({
        data: version.ingredients.map((fi) => ({
          batchId: batch.id,
          ingredientId: fi.ingredientId,
          targetQuantity: calculateScaledQuantity(fi.quantity, scaleFactor),
          unit: fi.unit,
        })),
      });

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: "BATCH_CREATED",
          entityType: "Batch",
          entityId: batch.id,
          newValue: JSON.stringify({ batchNumber: batch.batchNumber, targetQuantity: data.targetQuantity }),
        },
      });

      return batch;
    });

    revalidatePath("/batches");
    return { success: true, data: { id: batch.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create batch" };
  }
}

export async function updateBatchStatus(
  batchId: string,
  status: "IN_PRODUCTION" | "QC" | "COMPLETED" | "CANCELLED"
): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, status === "CANCELLED" ? "batch:cancel" : "batch:edit");

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, organizationId: user.organizationId },
    });

    if (!batch) return { success: false, error: "Batch not found." };

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PLANNED: ["IN_PRODUCTION", "CANCELLED"],
      IN_PRODUCTION: ["QC", "CANCELLED"],
      QC: ["COMPLETED", "IN_PRODUCTION"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[batch.status]?.includes(status)) {
      return { success: false, error: `Cannot transition from ${batch.status} to ${status}.` };
    }

    await prisma.$transaction([
      prisma.batch.update({
        where: { id: batchId },
        data: {
          status: status as any,
          ...(status === "COMPLETED"
            ? { completedById: user.id, completedAt: new Date() }
            : {}),
        },
      }),
      prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: `BATCH_${status}`,
          entityType: "Batch",
          entityId: batchId,
          oldValue: JSON.stringify({ status: batch.status }),
          newValue: JSON.stringify({ status }),
        },
      }),
    ]);

    revalidatePath("/batches");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update batch" };
  }
}

export async function updateBatchIngredientActual(
  batchIngredientId: string,
  actualQuantity: number
): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "batch:edit");

    const bi = await prisma.batchIngredient.findFirst({
      where: { id: batchIngredientId },
      include: { batch: true },
    });

    if (!bi || bi.batch.organizationId !== user.organizationId) {
      return { success: false, error: "Batch ingredient not found." };
    }

    const difference = actualQuantity - bi.targetQuantity;

    await prisma.batchIngredient.update({
      where: { id: batchIngredientId },
      data: { actualQuantity, difference },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update actual quantity" };
  }
}
