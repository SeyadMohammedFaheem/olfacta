"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/app/(auth)/actions";

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
      />
    </svg>
  );
}

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  return (
    <div className="w-full max-w-[380px] mx-auto py-8">
      <div className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 font-normal">
          Sign in to your perfume formulation laboratory
        </p>
      </div>

      {/* Google OAuth Button */}
      <a
        href="/api/auth/google"
        className="flex items-center justify-center gap-2.5 w-full h-10 px-4 rounded-lg border border-neutral-200 bg-white text-neutral-800 text-sm font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-2xs"
      >
        <GoogleIcon className="w-4 h-4" />
        <span>Continue with Google</span>
      </a>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2.5 text-neutral-400 font-medium">
            or sign in with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form action={formAction} className="space-y-4">
        {(state?.error || oauthError) && (
          <div className="rounded-lg border border-red-500/20 bg-red-50/80 px-3.5 py-2.5 text-xs font-medium text-red-600">
            {state?.error || oauthError}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-neutral-700">
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@company.com"
            required
            autoComplete="email"
            autoFocus
            className="h-10 rounded-lg border-neutral-200 bg-white px-3.5 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 shadow-2xs"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-neutral-700">
              Password
            </Label>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
            className="h-10 rounded-lg border-neutral-200 bg-white px-3.5 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 shadow-2xs"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-10 rounded-lg bg-neutral-900 hover:bg-black text-white font-medium text-sm transition-all shadow-xs cursor-pointer mt-1"
          loading={isPending}
        >
          Sign in
        </Button>
      </form>

      {/* Bottom Switch Link */}
      <p className="mt-6 text-center text-xs text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-neutral-900 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-white select-none">
      {/* ── LEFT HALF: Form Section (50%) ── */}
      <div className="flex flex-1 flex-col justify-center p-6 sm:p-10 lg:p-14 lg:w-1/2">
        <Suspense fallback={<div className="w-full max-w-[380px] mx-auto py-8 animate-pulse text-neutral-400 text-sm">Loading...</div>}>
          <LoginForm />
        </Suspense>
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
