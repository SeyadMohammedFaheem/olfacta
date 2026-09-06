"use client";

import { useState, useTransition } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Check,
  ChevronsUpDown,
  AlertTriangle,
  Mail,
  User as UserIcon,
  Crown,
  Copy,
  CheckCheck,
  ExternalLink,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { inviteMember, updateMemberRole, removeMember } from "@/services/organization/actions";
import { Role } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TeamManagementProps {
  members: Member[];
  currentUser: {
    id: string;
    role: Role;
  };
}

const roleDescriptions: Record<string, { label: string; badgeColor: string; description: string }> = {
  ADMIN: {
    label: "Main Admin",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200",
    description: "Full authority: can delete formulas/materials, approve releases, manage team permissions.",
  },
  CONTRIBUTOR: {
    label: "Contributor",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200",
    description: "Can create/edit formulas and materials, and submit formulas for admin review.",
  },
  PERFUMER: {
    label: "Perfumer",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200",
    description: "Formulation specialist: builds accords and submits versions for safety review.",
  },
  PRODUCTION: {
    label: "Production",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200",
    description: "Executes approved formulas and manages manufacturing batches.",
  },
  COMPLIANCE: {
    label: "Compliance Officer",
    badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200",
    description: "Regulatory auditor: validates safety standards and audits IFRA limits.",
  },
  VIEWER: {
    label: "Viewer",
    badgeColor: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200",
    description: "Read-only access across formulas, ingredients, and laboratory reports.",
  },
};

export function TeamManagement({ members, currentUser }: TeamManagementProps) {
  const isAdmin = currentUser.role === Role.ADMIN;
  const [isPending, startTransition] = useTransition();

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>(Role.CONTRIBUTOR);

  // Invite success result state
  const [inviteResult, setInviteResult] = useState<{
    name: string;
    email: string;
    role: Role;
    inviteUrl: string;
    emailSent: boolean;
    emailReason?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Please enter a valid name and email address.");
      return;
    }

    startTransition(async () => {
      const res = await inviteMember({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });

      if (res.success && res.data) {
        setInviteResult({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
          inviteUrl: res.data.inviteUrl,
          emailSent: res.data.emailSent,
          emailReason: res.data.emailReason,
        });
        if (res.data.emailSent) {
          toast.success(`Invitation email sent to ${inviteEmail}`);
        } else {
          toast.info(`Invite link generated. ${res.data.emailReason ? `(${res.data.emailReason})` : ""}`);
        }
        setInviteName("");
        setInviteEmail("");
        setInviteRole(Role.CONTRIBUTOR);
      } else {
        toast.error(res.error || "Failed to invite member.");
      }
    });
  };

  const handleCopyLink = async () => {
    if (!inviteResult?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteResult.inviteUrl);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link. Please copy manually.");
    }
  };

  const handleRoleChange = (memberId: string, newRole: Role) => {
    startTransition(async () => {
      const res = await updateMemberRole(memberId, newRole);
      if (res.success) {
        toast.success(`Role updated to ${roleDescriptions[newRole]?.label || newRole}.`);
      } else {
        toast.error(res.error || "Failed to update role.");
      }
    });
  };

  const handleRemove = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const res = await removeMember(deleteTarget.id);
      if (res.success) {
        toast.success(`Removed ${deleteTarget.user.name} from the organization.`);
        setDeleteTarget(null);
      } else {
        toast.error(res.error || "Failed to remove member.");
      }
    });
  };

  return (
    <Card className="overflow-hidden border-neutral-200 dark:border-neutral-800">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
              <CardTitle className="text-base font-semibold">Team Members & Access Control</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Main Admin controls destructive actions and releases. Contributors create and submit work.
            </CardDescription>
          </div>

          {isAdmin && (
            <Dialog
              open={inviteOpen}
              onOpenChange={(open) => {
                setInviteOpen(open);
                if (!open) setInviteResult(null);
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-8.5 text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800">
                  <UserPlus className="h-3.5 w-3.5" />
                  Invite Contributor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                {inviteResult ? (
                  <div className="space-y-4 py-2">
                    <DialogHeader>
                      <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
                        <Check className="h-5 w-5" />
                      </div>
                      <DialogTitle className="text-base font-bold">Invitation Ready</DialogTitle>
                      <DialogDescription className="text-xs">
                        {inviteResult.emailSent
                          ? `An email with invitation instructions was successfully sent to ${inviteResult.email}.`
                          : `Share this direct invitation link with ${inviteResult.name} to join as ${roleDescriptions[inviteResult.role]?.label || inviteResult.role}.`}
                      </DialogDescription>
                    </DialogHeader>

                    {!inviteResult.emailSent && inviteResult.emailReason && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-600 dark:text-amber-400">
                        <strong>Notice:</strong> {inviteResult.emailReason}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Shareable Invite Link</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={inviteResult.inviteUrl}
                          className="h-9 text-xs font-mono bg-muted/40 select-all"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCopyLink}
                          className="h-9 text-xs gap-1.5 shrink-0"
                        >
                          {copied ? (
                            <>
                              <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Link expires in 7 days. Anyone with this link can set their password and join your workspace with the assigned role.
                      </p>
                    </div>

                    <DialogFooter className="pt-3 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setInviteResult(null)}
                        className="text-xs h-9"
                      >
                        Invite Another
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setInviteOpen(false);
                          setInviteResult(null);
                        }}
                        className="text-xs h-9"
                      >
                        Done
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold">Invite Contributor to Workspace</DialogTitle>
                      <DialogDescription className="text-xs">
                        Add a team member and assign their laboratory access level.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleInvite} className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="memberName" className="text-xs font-medium">Full Name</Label>
                        <div className="relative">
                          <Input
                            id="memberName"
                            placeholder="e.g. Jean-Claude"
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                            required
                            className="pl-8 text-sm h-9"
                          />
                          <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="memberEmail" className="text-xs font-medium">Email Address</Label>
                        <div className="relative">
                          <Input
                            id="memberEmail"
                            type="email"
                            placeholder="contributor@organization.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                            className="pl-8 text-sm h-9"
                          />
                          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Role Assignment</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(roleDescriptions).map(([roleKey, meta]) => {
                            const isSelected = inviteRole === roleKey;
                            return (
                              <button
                                key={roleKey}
                                type="button"
                                onClick={() => setInviteRole(roleKey as Role)}
                                className={`p-2.5 rounded-lg border text-left transition-all ${
                                  isSelected
                                    ? "border-neutral-950 bg-neutral-50 dark:border-white dark:bg-neutral-900 ring-1 ring-neutral-950 dark:ring-white"
                                    : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold">{meta.label}</span>
                                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                                </div>
                                <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2 leading-tight">
                                  {meta.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <DialogFooter className="pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setInviteOpen(false)}
                          className="text-xs h-9"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          loading={isPending}
                          className="text-xs h-9 bg-neutral-950 text-white hover:bg-neutral-850"
                        >
                          Send & Generate Link
                        </Button>
                      </DialogFooter>
                    </form>
                  </>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 border-b border-neutral-100 dark:border-neutral-850 bg-neutral-50/50 dark:bg-neutral-900/50">
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Role & Permissions</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Joined</th>
                {isAdmin && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
              {members.map((member) => {
                const roleMeta = roleDescriptions[member.role] || {
                  label: member.role,
                  badgeColor: "bg-neutral-100 text-neutral-800",
                  description: "Standard member",
                };
                const isSelf = member.userId === currentUser.id;
                const isMemberAdmin = member.role === Role.ADMIN;

                return (
                  <tr key={member.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 transition-colors">
                    {/* Member Name + Avatar */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white font-semibold text-xs shrink-0">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                            <span>{member.user.name}</span>
                            {isMemberAdmin && (
                              <span title="Main Admin / Owner">
                                <Crown className="h-3 w-3 text-amber-500 fill-amber-500 inline" />
                              </span>
                            )}
                            {isSelf && (
                              <span className="text-[10px] font-normal text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500 font-mono">{member.user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role / Selector */}
                    <td className="px-5 py-3">
                      {isAdmin && !isSelf ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              disabled={isPending}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer hover:opacity-85 ${roleMeta.badgeColor}`}
                            >
                              <span>{roleMeta.label}</span>
                              <ChevronsUpDown className="h-3 w-3 opacity-60" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Change Role</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.entries(roleDescriptions).map(([rKey, rMeta]) => (
                              <DropdownMenuItem
                                key={rKey}
                                onClick={() => handleRoleChange(member.id, rKey as Role)}
                                className="flex items-center justify-between text-xs cursor-pointer"
                              >
                                <div>
                                  <div className="font-medium">{rMeta.label}</div>
                                  <div className="text-[10px] text-muted-foreground line-clamp-1">{rMeta.description}</div>
                                </div>
                                {member.role === rKey && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${roleMeta.badgeColor}`}>
                          {roleMeta.label}
                        </span>
                      )}
                    </td>

                    {/* Date Joined */}
                    <td className="px-5 py-3 text-xs text-neutral-500 hidden md:table-cell">
                      {formatDateTime(member.createdAt)}
                    </td>

                    {/* Actions */}
                    {isAdmin && (
                      <td className="px-5 py-3 text-right">
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(member)}
                            className="h-8 w-8 p-0 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Remove from organization"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Remove Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">Remove Team Member</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-2">
              Are you sure you want to remove <strong>{deleteTarget?.user.name}</strong> ({deleteTarget?.user.email}) from the workspace? They will immediately lose access to all formulas and laboratory assets.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              loading={isPending}
              className="text-xs h-9"
            >
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
