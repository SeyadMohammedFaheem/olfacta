import { Role } from "@/types";

interface SendInvitationEmailParams {
  to: string;
  name: string;
  organizationName: string;
  inviterName: string;
  role: Role;
  inviteUrl: string;
}

const roleDescriptions: Record<string, string> = {
  ADMIN: "Main Admin — Full control over formulas, production approvals, team permissions, and workspace data.",
  CONTRIBUTOR: "Contributor — Formulate, add raw materials, evaluate real-time IFRA/EU compliance, and submit formulas for review.",
  PERFUMER: "Perfumer — Formulate, test accords, manage dilution batches, and submit versions for review.",
  PRODUCTION: "Production Manager — Scale approved formulas into manufacturing batches and monitor lot tracing.",
  COMPLIANCE: "Compliance Auditor — Review regulatory compliance across global markets and review dossiers.",
  VIEWER: "Viewer — View-only access to formulation cards, compliance reports, and material libraries.",
};

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<{
  sent: boolean;
  reason?: string;
}> {
  const { to, name, organizationName, inviterName, role, inviteUrl } = params;

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase().replace("_", " ");
  const roleDesc = roleDescriptions[role] || "Member of the workspace";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to join ${organizationName} on Olfacta</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 32px 36px 24px 36px; border-bottom: 1px solid #f3f4f6;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 15px; font-weight: 800; letter-spacing: 0.16em; color: #000000; text-transform: uppercase;">
                      OLFACTA
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 3px; letter-spacing: 0.04em; text-transform: uppercase;">
                      Perfume Formulation &amp; Regulatory OS
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.02em; line-height: 1.3;">
                Join ${organizationName}
              </h1>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                Hello <strong style="color: #111827;">${name || "there"}</strong>,<br>
                <strong style="color: #111827;">${inviterName}</strong> has invited you to collaborate in the <strong style="color: #111827;">${organizationName}</strong> workspace on Olfacta.
              </p>

              <!-- Role & Workspace Summary Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 0 0 28px 0;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 6px;">
                      Assigned Role
                    </div>
                    <div style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 4px; letter-spacing: 0.02em;">
                      ${roleLabel}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 8px; line-height: 1.5;">
                      ${roleDesc}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #4b5563;">
                Click below to accept your invitation, configure your credentials, and start working.
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 13px 32px; border-radius: 6px; letter-spacing: 0.01em; text-align: center;">
                      Accept Invitation &amp; Join
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct Link -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #f3f4f6; padding-top: 20px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; color: #9ca3af; line-height: 1.5; margin-bottom: 6px;">
                      If the button above does not work, copy and paste this URL into your browser:
                    </div>
                    <div style="font-size: 11px; color: #4b5563; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background-color: #f9fafb; padding: 8px 10px; border-radius: 4px; border: 1px solid #e5e7eb;">
                      ${inviteUrl}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #fafafa; border-top: 1px solid #f3f4f6; text-align: center;">
              <div style="font-size: 11px; color: #9ca3af; line-height: 1.5;">
                This invitation was sent by ${inviterName} via Olfacta.<br>
                If you were not expecting this invitation, you can safely ignore this email.
              </div>
            </td>
          </tr>
        </table>

        <!-- Micro Branding Footer -->
        <div style="margin-top: 20px; font-size: 11px; color: #9ca3af; text-align: center; letter-spacing: 0.04em;">
          OLFACTA &bull; Precision Perfume Formulation
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // 1. Check for Resend API Key
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Olfacta <invitations@faheem.work>",
          to: [to],
          subject: `${inviterName} invited you to join ${organizationName} on Olfacta`,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        return { sent: true };
      } else {
        const errorData = await res.json().catch(() => null);
        const errorMsg = errorData?.message || res.statusText;
        console.warn("[Olfacta Email] Resend API rejected email:", errorMsg);
        return { sent: false, reason: errorMsg };
      }
    } catch (err: unknown) {
      console.warn("[Olfacta Email] Network error dispatching via Resend:", err);
      return { sent: false, reason: err instanceof Error ? err.message : "Network error" };
    }
  }

  // 2. Fallback in development / self-hosted environments without external keys
  console.log(`\n================== [OLFACTA INVITATION EMAIL DISPATCH] ==================`);
  console.log(`To: ${to} (${name})`);
  console.log(`From: ${inviterName} in ${organizationName}`);
  console.log(`Role: ${role}`);
  console.log(`Direct Invite URL: ${inviteUrl}`);
  console.log(`=========================================================================\n`);

  return { sent: false, reason: "No RESEND_API_KEY configured in environment (logged to server console)" };
}
