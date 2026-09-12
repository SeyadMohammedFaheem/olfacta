"use server";

import { prisma } from "@/lib/db/prisma";
import { getSessionOrThrow, createSession } from "@/lib/auth/session";
import { checkPermission } from "@/lib/permissions";
import { Role, type ActionResult, type SessionUser } from "@/types";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { hash } from "bcryptjs";
import { createInvitationToken, verifyInvitationToken, type InvitationPayload } from "@/lib/auth/invitation";
import { sendInvitationEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/utils";

export async function inviteMember(data: {
  email: string;
  name: string;
  role: Role;
}): Promise<ActionResult<{ id: string; inviteUrl: string; emailSent: boolean; emailReason?: string }>> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "users:manage");

    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();
    const role = data.role;

    if (!email || !name) {
      return { success: false, error: "Name and email are required." };
    }

    // Check if user already exists in the system or create a new user with temporary password
    let targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      const defaultPasswordHash = await hash("password123", 10);
      targetUser = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: defaultPasswordHash,
        },
      });
    }

    // Check if already a member of this organization
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUser.id,
          organizationId: user.organizationId,
        },
      },
    });

    if (existingMembership) {
      return { success: false, error: "This user is already a member of the organization." };
    }

    const membership = await prisma.organizationMember.create({
      data: {
        userId: targetUser.id,
        organizationId: user.organizationId,
        role: role,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "MEMBER_INVITED",
        entityType: "OrganizationMember",
        entityId: membership.id,
        newValue: JSON.stringify({ email, name, role }),
      },
    });

    // Generate secure cryptographic invitation link
    const token = await createInvitationToken({
      email,
      name,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      role,
      inviterName: user.name,
    });

    const headerList = await headers();
    const appUrl = getBaseUrl({ headers: headerList });
    const inviteUrl = `${appUrl}/invite?token=${encodeURIComponent(token)}`;

    // Dispatch automated invitation email
    const emailRes = await sendInvitationEmail({
      to: email,
      name,
      organizationName: user.organizationName,
      inviterName: user.name,
      role,
      inviteUrl,
    });

    revalidatePath("/settings");
    return {
      success: true,
      data: {
        id: membership.id,
        inviteUrl,
        emailSent: emailRes.sent,
        emailReason: emailRes.reason,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to invite member.";
    return { success: false, error: msg };
  }
}

export async function getInvitationDetails(token: string): Promise<ActionResult<InvitationPayload>> {
  try {
    if (!token) {
      return { success: false, error: "Missing invitation token." };
    }

    const payload = await verifyInvitationToken(token);
    if (!payload) {
      return { success: false, error: "This invitation link is invalid or has expired." };
    }

    return { success: true, data: payload };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve invitation.";
    return { success: false, error: msg };
  }
}

export async function acceptInvitation(
  token: string,
  formData: { name: string; password?: string }
): Promise<ActionResult<{ organizationId: string }>> {
  try {
    const payload = await verifyInvitationToken(token);
    if (!payload) {
      return { success: false, error: "This invitation link is invalid or has expired." };
    }

    const name = formData.name.trim() || payload.name;
    const password = formData.password?.trim();

    if (password && password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    const passwordHash = password ? await hash(password, 10) : undefined;

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name,
          passwordHash: passwordHash || (await hash("password123", 10)),
        },
      });
    } else if (passwordHash || name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name ? { name } : {}),
          ...(passwordHash ? { passwordHash } : {}),
        },
      });
    }

    // Ensure or update organization membership
    const membership = await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: payload.organizationId,
        },
      },
      update: {
        role: payload.role,
      },
      create: {
        userId: user.id,
        organizationId: payload.organizationId,
        role: payload.role,
      },
      include: {
        organization: true,
      },
    });

    // Create active session cookie for instant access
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: membership.organizationId,
      organizationName: membership.organization.name,
      role: membership.role as Role,
    };

    await createSession(sessionUser);

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: payload.organizationId,
        userId: user.id,
        action: "MEMBER_JOINED",
        entityType: "OrganizationMember",
        entityId: membership.id,
        newValue: JSON.stringify({ email: payload.email, role: payload.role }),
      },
    });

    return { success: true, data: { organizationId: payload.organizationId } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to accept invitation.";
    return { success: false, error: msg };
  }
}

export async function updateMemberRole(
  memberId: string,
  newRole: Role
): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "users:manage");

    const membership = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: user.organizationId },
    });

    if (!membership) {
      return { success: false, error: "Member not found." };
    }

    // Prevent changing own role if it's the last admin
    if (membership.userId === user.id && newRole !== Role.ADMIN) {
      const adminCount = await prisma.organizationMember.count({
        where: { organizationId: user.organizationId, role: Role.ADMIN },
      });
      if (adminCount <= 1) {
        return { success: false, error: "Cannot downgrade the sole Main Admin of the organization." };
      }
    }

    await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "MEMBER_ROLE_UPDATED",
        entityType: "OrganizationMember",
        entityId: memberId,
        oldValue: JSON.stringify({ role: membership.role }),
        newValue: JSON.stringify({ role: newRole }),
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update member role.";
    return { success: false, error: msg };
  }
}

export async function removeMember(memberId: string): Promise<ActionResult> {
  try {
    const user = await getSessionOrThrow();
    checkPermission(user.role, "users:manage");

    const membership = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: user.organizationId },
    });

    if (!membership) {
      return { success: false, error: "Member not found." };
    }

    if (membership.userId === user.id) {
      return { success: false, error: "You cannot remove yourself from the organization." };
    }

    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "MEMBER_REMOVED",
        entityType: "OrganizationMember",
        entityId: memberId,
        oldValue: JSON.stringify({ userId: membership.userId, role: membership.role }),
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to remove member.";
    return { success: false, error: msg };
  }
}
