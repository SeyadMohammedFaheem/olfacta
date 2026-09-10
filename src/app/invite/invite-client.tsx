"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Building2, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { acceptInvitation } from "@/services/organization/actions";
import { toast } from "sonner";
import type { InvitationPayload } from "@/lib/auth/invitation";

const roleDescriptions: Record<string, { label: string; desc: string; badgeColor: string }> = {
  ADMIN: {
    label: "Main Admin",
    desc: "Full administrative authority over formulas, approvals, team roles, and settings.",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  CONTRIBUTOR: {
    label: "Contributor",
    desc: "Create and edit formulations, calculate real-time compliance, and submit formulas for review.",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  PERFUMER: {
    label: "Perfumer",
    desc: "Formulate fragrance accords, manage notes and raw materials, and submit versions.",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  PRODUCTION: {
    label: "Production Manager",
    desc: "Scale approved formulas into manufacturing batches and monitor lot tracing.",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  COMPLIANCE: {
    label: "Compliance Officer",
    desc: "Review formulation regulatory safety against IFRA, EU, FDA, and ASEAN standards.",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
  },
  VIEWER: {
    label: "Viewer",
    desc: "Read-only access across formulas, ingredients, and laboratory reports.",
    badgeColor: "bg-neutral-100 text-neutral-800 border-neutral-200",
  },
};

export function InviteClient({ token, invitation }: { token: string; invitation: InvitationPayload }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(invitation.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const roleMeta = roleDescriptions[invitation.role] || {
    label: invitation.role,
    desc: "Member of the workspace",
    badgeColor: "bg-neutral-100 text-neutral-800 border-neutral-200",
  };

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await acceptInvitation(token, { name, password: password || undefined });
      if (res.success) {
        toast.success(`Welcome to ${invitation.organizationName}!`);
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error || "Failed to accept invitation.");
        toast.error(res.error || "Failed to accept invitation.");
      }
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-white select-none">
      {/* ── LEFT HALF: Form Section (50%) ── */}
      <div className="flex flex-1 flex-col justify-center p-6 sm:p-10 lg:p-14 lg:w-1/2 overflow-y-auto">
        {/* Centered Form */}
        <div className="w-full max-w-[380px] mx-auto py-6">
          <div className="mb-5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Join workspace
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-500 font-normal">
              You were invited by <strong className="text-neutral-900 font-medium">{invitation.inviterName}</strong>
            </p>
          </div>

          {/* Invitation Details Summary Card */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-4 mb-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-neutral-900 text-sm">
                <Building2 className="h-4 w-4 text-neutral-500" />
                <span className="truncate">{invitation.organizationName}</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded font-medium border ${roleMeta.badgeColor}`}>
                {roleMeta.label}
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {roleMeta.desc}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAccept} className="space-y-3.5">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-50/80 px-3 py-2 text-xs font-medium text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium text-neutral-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="h-9 rounded-lg border-neutral-200 bg-neutral-100/60 px-3 text-xs sm:text-sm text-neutral-600 font-mono cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-medium text-neutral-700">
                Your full name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jean Carles"
                required
                autoFocus
                className="h-9 rounded-lg border-neutral-200 bg-white px-3 text-xs sm:text-sm placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-medium text-neutral-700">
                Set password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="h-9 rounded-lg border-neutral-200 bg-white px-3 text-xs sm:text-sm placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 shadow-2xs"
              />
              <p className="text-[11px] text-neutral-400">
                Leave blank if you already have an account with this email.
              </p>
            </div>

            {password.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-neutral-700">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="h-9 rounded-lg border-neutral-200 bg-white px-3 text-xs sm:text-sm placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 shadow-2xs"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 rounded-lg bg-neutral-900 hover:bg-black text-white font-medium text-xs sm:text-sm transition-all shadow-xs cursor-pointer mt-1"
              loading={isPending}
            >
              Accept invitation & join
            </Button>
          </form>

          {/* Bottom Switch Link */}
          <p className="mt-5 text-center text-xs text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-neutral-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT HALF: Full-Bleed Imagery Panel (50%) ── */}
      <div className="hidden lg:block relative w-1/2 h-screen overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/perfume-auth-hero.jpg"
          alt="Fine fragrance botanical formulation"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

        {/* Text Content in Lower Left */}
        <div className="absolute bottom-12 left-10 right-10 z-10 text-white">
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
            Bring your ideas to life.
          </h2>
          <p className="mt-3 text-sm xl:text-base text-white/90 leading-relaxed max-w-md font-normal">
            Formulate with precision, validate IFRA safety in real-time, and scale from lab trials to industrial production.
          </p>
        </div>
      </div>
    </div>
  );
}
