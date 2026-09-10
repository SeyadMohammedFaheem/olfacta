import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";
import type { SessionUser } from "@/types";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = process.env.NEXTAUTH_URL || `${proto}://${host}`;

  if (errorParam) {
    console.error("Google OAuth error from provider:", errorParam);
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent("Google sign in was cancelled or failed.")}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent("Missing authorization code from Google.")}`);
  }

  // Verify CSRF state
  const storedState = request.cookies.get("google_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    console.error("Google OAuth state mismatch:", { storedState, state });
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent("Session expired or security check failed. Please try again.")}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent("Server Google OAuth configuration is missing.")}`);
  }

  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  try {
    // 1. Exchange authorization code for access and id tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData: GoogleTokenResponse = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token exchange error:", tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(tokenData.error_description || "Failed to exchange Google token.")}`);
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error("Failed to fetch Google user info:", await userInfoResponse.text());
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent("Failed to retrieve Google profile information.")}`);
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    if (!googleUser.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent("Google account has no associated email address.")}`);
    }

    const email = googleUser.email.toLowerCase().trim();
    const name = googleUser.name || googleUser.given_name || email.split("@")[0];

    // 3. Find existing user or create a new user & laboratory organization
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    let sessionUser: SessionUser;

    if (user && user.memberships.length > 0) {
      const membership = user.memberships[0];
      sessionUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: membership.organizationId,
        organizationName: membership.organization.name,
        role: membership.role as SessionUser["role"],
      };
    } else if (user && user.memberships.length === 0) {
      // User exists (e.g. from an invitation or edge case) without an organization
      const labName = `${name}'s Lab`;
      const slug = slugify(labName) + "-" + Date.now().toString(36);

      const org = await prisma.organization.create({
        data: {
          name: labName,
          slug,
          members: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });

      sessionUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: org.id,
        organizationName: org.name,
        role: "ADMIN",
      };
    } else {
      // Create new user, default workspace organization, and admin membership
      const labName = `${name}'s Lab`;
      const slug = slugify(labName) + "-" + Date.now().toString(36);
      // Random dummy password hash since user logs in via OAuth
      const dummyPassword = randomBytes(24).toString("hex");
      const passwordHash = await hash(dummyPassword, 10);

      const result = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: { name: labName, slug },
        });

        const newUser = await tx.user.create({
          data: { name, email, passwordHash },
        });

        await tx.organizationMember.create({
          data: {
            userId: newUser.id,
            organizationId: org.id,
            role: "ADMIN",
          },
        });

        return { newUser, org };
      });

      sessionUser = {
        id: result.newUser.id,
        email: result.newUser.email,
        name: result.newUser.name,
        organizationId: result.org.id,
        organizationName: result.org.name,
        role: "ADMIN",
      };
    }

    // 4. Create the authenticated session cookie
    await createSession(sessionUser);

    // 5. Cleanup state cookie and redirect to dashboard
    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    response.cookies.delete("google_oauth_state");

    return response;
  } catch (err: any) {
    console.error("Google OAuth callback exception:", err);
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent("Authentication server error. Please try again.")}`);
  }
}
