import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import type { SessionUser } from "@/types";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "olfacta-dev-secret-change-in-production"
);

const COOKIE_NAME = "olfacta-session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION}s`)
    .setIssuedAt()
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      organizationId: payload.organizationId as string,
      organizationName: payload.organizationName as string,
      role: payload.role as SessionUser["role"],
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionOrThrow(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function getFullSession(): Promise<{
  user: SessionUser;
  member: { id: string; role: string };
} | null> {
  const session = await getSession();
  if (!session) return null;

  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.id,
        organizationId: session.organizationId,
      },
    },
  });

  if (!member) return null;

  return {
    user: { ...session, role: member.role as SessionUser["role"] },
    member: { id: member.id, role: member.role },
  };
}
