import { SignJWT, jwtVerify } from "jose";
import { Role } from "@/types";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "olfacta-dev-secret-change-in-production"
);

const INVITATION_DURATION = 60 * 60 * 24 * 7; // 7 days

export interface InvitationPayload {
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  role: Role;
  inviterName: string;
}

export async function createInvitationToken(data: InvitationPayload): Promise<string> {
  return new SignJWT({
    email: data.email,
    name: data.name,
    organizationId: data.organizationId,
    organizationName: data.organizationName,
    role: data.role,
    inviterName: data.inviterName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${INVITATION_DURATION}s`)
    .setIssuedAt()
    .sign(SECRET_KEY);
}

export async function verifyInvitationToken(token: string): Promise<InvitationPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      email: payload.email as string,
      name: payload.name as string,
      organizationId: payload.organizationId as string,
      organizationName: payload.organizationName as string,
      role: payload.role as Role,
      inviterName: payload.inviterName as string,
    };
  } catch {
    return null;
  }
}
