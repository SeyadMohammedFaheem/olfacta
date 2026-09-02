"use server";

import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createSession, destroySession } from "@/lib/auth/session";
import { loginSchema, signupSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils";
import type { ActionResult, SessionUser, Role } from "@/types";
import { redirect } from "next/navigation";

export async function loginAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { organization: true },
        take: 1,
      },
    },
  });

  if (!user) {
    return { success: false, error: "Invalid email or password." };
  }

  const validPassword = await compare(password, user.passwordHash);
  if (!validPassword) {
    return { success: false, error: "Invalid email or password." };
  }

  const membership = user.memberships[0];
  if (!membership) {
    return { success: false, error: "No organization found. Please contact support." };
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    role: membership.role as Role,
  };

  await createSession(sessionUser);
  redirect("/dashboard");
}

export async function signupAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    organizationName: formData.get("organizationName") as string,
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { name, email, password, organizationName } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await hash(password, 12);
  const slug = slugify(organizationName) + "-" + Date.now().toString(36);

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: organizationName, slug },
    });

    const user = await tx.user.create({
      data: { name, email, passwordHash },
    });

    const member = await tx.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "ADMIN",
      },
    });

    return { user, org, member };
  });

  const sessionUser: SessionUser = {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    organizationId: result.org.id,
    organizationName: result.org.name,
    role: "ADMIN",
  };

  await createSession(sessionUser);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
