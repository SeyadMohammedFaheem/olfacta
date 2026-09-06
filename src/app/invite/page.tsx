import { getInvitationDetails } from "@/services/organization/actions";
import { InviteClient } from "./invite-client";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Join Workspace — Olfacta" };

interface InvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen w-full bg-white select-none">
        <div className="flex flex-1 flex-col justify-between p-8 sm:p-12 lg:p-16 lg:w-1/2">
          <div />
          <div className="w-full max-w-[360px] mx-auto my-auto py-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-600 mb-2 mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Invalid invitation link</h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              This invitation link is missing a valid security token. Please ask your workspace administrator to send you a new invitation link.
            </p>
            <Button asChild className="w-full h-10 rounded-md bg-black text-white hover:bg-neutral-800 text-xs">
              <Link href="/login">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to sign in
              </Link>
            </Button>
          </div>
          <div className="text-[11px] text-neutral-400">Olfacta Laboratory Workstation</div>
        </div>
        <div className="hidden lg:block relative w-1/2 h-screen overflow-hidden">
          <Image
            src="/images/perfume-auth-hero.jpg"
            alt="Fine fragrance botanical formulation"
            fill
            priority
            sizes="50vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        </div>
      </div>
    );
  }

  const result = await getInvitationDetails(token);

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-screen w-full bg-white select-none">
        <div className="flex flex-1 flex-col justify-between p-8 sm:p-12 lg:p-16 lg:w-1/2">
          <div />
          <div className="w-full max-w-[360px] mx-auto my-auto py-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-600 mb-2 mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Invitation expired or invalid</h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {result.error || "This invitation link has expired or has already been used. Please request a new invitation."}
            </p>
            <Button asChild className="w-full h-10 rounded-md bg-black text-white hover:bg-neutral-800 text-xs">
              <Link href="/login">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to sign in
              </Link>
            </Button>
          </div>
          <div className="text-[11px] text-neutral-400">Olfacta Laboratory Workstation</div>
        </div>
        <div className="hidden lg:block relative w-1/2 h-screen overflow-hidden">
          <Image
            src="/images/perfume-auth-hero.jpg"
            alt="Fine fragrance botanical formulation"
            fill
            priority
            sizes="50vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        </div>
      </div>
    );
  }

  return <InviteClient token={token} invitation={result.data} />;
}
