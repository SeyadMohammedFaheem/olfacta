"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/app/(auth)/actions";

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

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, null);

  return (
    <div className="flex h-screen w-full bg-white select-none overflow-hidden">
      {/* ── LEFT HALF: Form Section (50%) ── */}
      <div className="flex flex-1 flex-col justify-center p-6 sm:p-10 lg:p-14 lg:w-1/2 h-full overflow-y-auto">
        {/* Centered Form */}
        <div className="w-full max-w-[380px] mx-auto py-4">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Create account
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-500 font-normal">
              Get started with a free professional laboratory workspace
            </p>
          </div>

          {/* Google OAuth Button */}
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-2.5 w-full h-9.5 px-4 rounded-lg border border-neutral-200 bg-white text-neutral-800 text-xs sm:text-sm font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-2xs"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>Continue with Google</span>
          </a>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-400 font-medium">
                or sign up with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-3">
            {state?.error && (
              <div className="rounded-lg border border-red-500/20 bg-red-50/80 px-3 py-2 text-xs font-medium text-red-600">
                {state.error}
              </div>
            )}

            {/* Two-column inputs for Name and Lab to save vertical height */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium text-neutral-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Jean Carles"
                  required
                  autoFocus
                  className="h-9 rounded-lg border-neutral-200 bg-white px-3 text-xs sm:text-sm placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="organizationName" className="text-xs font-medium text-neutral-700">
                  Lab Name
                </Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  placeholder="Maison Lab"
                  required
                  className="h-9 rounded-lg border-neutral-200 bg-white px-3 text-xs sm:text-sm placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1">
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
                className="h-9 rounded-lg border-neutral-200 bg-white px-3 text-xs sm:text-sm placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-medium text-neutral-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
                minLength={8}
                className="h-9 rounded-lg border-neutral-200 bg-white px-3 text-xs sm:text-sm placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 shadow-2xs"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 rounded-lg bg-neutral-900 hover:bg-black text-white font-medium text-xs sm:text-sm transition-all shadow-xs cursor-pointer mt-1.5"
              loading={isPending}
            >
              Create free account
            </Button>
          </form>

          {/* Bottom Switch Link */}
          <p className="mt-4 text-center text-xs text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-neutral-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT HALF: Full-Bleed Imagery Panel (50%) ── */}
      <div className="hidden lg:block relative w-1/2 h-full overflow-hidden">
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
        <div className="absolute bottom-10 left-8 right-8 z-10 text-white">
          <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
            Bring your ideas to life.
          </h2>
          <p className="mt-2 text-sm text-white/90 leading-relaxed max-w-md font-normal">
            Sign up for free and enjoy access to high-precision perfume formulation and real-time IFRA safety compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
