import { prisma } from "@/lib/db/prisma";
import { getSessionOrThrow } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Shield, History } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Settings — Olfacta" };

export default async function SettingsPage() {
  const user = await getSessionOrThrow();
  const orgId = user.organizationId;

  const [org, members, auditLogs] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
    }),
    prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="p-6 space-y-6 w-full">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your organization, team members, roles, and view system audit trail
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Organization Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Organization Profile</CardTitle>
            </div>
            <CardDescription className="text-xs">Your workspace tenant information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Organization Name</span>
              <span className="font-semibold">{org?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Organization Slug</span>
              <span className="font-mono text-xs">{org?.slug}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Tenant ID</span>
              <span className="font-mono text-xs text-muted-foreground">{org?.id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Current User Session Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Your User Profile</CardTitle>
            </div>
            <CardDescription className="text-xs">Active session credentials & permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Name</span>
              <span className="font-semibold">{user.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Email</span>
              <span className="font-mono text-xs">{user.email}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Assigned Role</span>
              <Badge variant="default" className="text-xs">{user.role}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Team Members & Access</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">{members.length} Members</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{member.user.name}</td>
                    <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{member.user.email}</td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary" className="text-xs uppercase">{member.role}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatDateTime(member.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Trail */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">Audit Log Activity</CardTitle>
          </div>
          <CardDescription className="text-xs">Immutable trail of formula, compliance, and batch events</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Entity</th>
                  <th className="px-5 py-3 font-medium">Performed By</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-2.5 font-mono text-xs font-semibold">{log.action}</td>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground">{log.entityType} ({log.entityId.slice(0, 8)}...)</td>
                    <td className="px-5 py-2.5 text-xs">{log.user?.name || "System"}</td>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground font-mono">{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-xs text-muted-foreground">
                      No audit events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
