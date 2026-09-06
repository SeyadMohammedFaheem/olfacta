import { prisma } from "@/lib/db/prisma";
import { getSessionOrThrow } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, History, Crown } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { TeamManagement } from "./team-management";

export const metadata = { title: "Settings — Olfacta" };
export const dynamic = "force-dynamic";

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
      take: 15,
    }),
  ]);

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="p-6 space-y-6 w-full max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Organization & Team Settings</h1>
          {isAdmin && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 gap-1">
              <Crown className="h-3 w-3 text-purple-600" />
              Main Admin Workspace
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage workspace profile, assign contributor permissions, and review the audit trail.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Organization Info */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Organization Profile</CardTitle>
            </div>
            <CardDescription className="text-xs">Your workspace tenant information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-muted-foreground">Organization Name</span>
              <span className="font-semibold">{org?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
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
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Your User Profile</CardTitle>
            </div>
            <CardDescription className="text-xs">Active session credentials & permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-muted-foreground">Name</span>
              <span className="font-semibold">{user.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-muted-foreground">Email</span>
              <span className="font-mono text-xs">{user.email}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Assigned Role</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="default" className="text-xs font-semibold">{user.role}</Badge>
                {isAdmin ? (
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">(Full Admin Authority)</span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">(Contributor / Restricted)</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Team Members Management */}
      <TeamManagement members={members} currentUser={user} />

      {/* Audit Log Trail */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">Audit Log Activity</CardTitle>
          </div>
          <CardDescription className="text-xs">Immutable trail of formula, compliance, member, and batch events</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-500 border-b border-neutral-100 dark:border-neutral-850 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Entity</th>
                  <th className="px-5 py-3 font-medium">Performed By</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 transition-colors">
                    <td className="px-5 py-2.5 font-mono text-xs font-semibold">{log.action}</td>
                    <td className="px-5 py-2.5 text-xs text-neutral-500">{log.entityType} ({log.entityId.slice(0, 8)}...)</td>
                    <td className="px-5 py-2.5 text-xs">{log.user?.name || "System"}</td>
                    <td className="px-5 py-2.5 text-xs text-neutral-500 font-mono">{formatDateTime(log.createdAt)}</td>
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
