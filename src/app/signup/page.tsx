"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/app/(auth)/actions";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, null);

  return (
    <div className="flex h-screen w-full bg-white select-none overflow-hidden">
      {/* ── LEFT HALF: Form Section (50%) ── */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 lg:p-10 lg:w-1/2 h-full">
        <div />

        {/* Centered Form */}
        <div className="w-full max-w-[360px] mx-auto my-auto py-2">
          <div className="mb-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
              Sign up now
            </h1>
            <p className="mt-0.5 text-xs text-neutral-500 font-normal">
              Create a free laboratory account
            </p>
          </div>

          {/* Social / Google Sign Up Button */}
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full h-9.5 px-3 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-colors cursor-pointer"
          >
            {/* Google G SVG */}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-3.5 flex items-center justify-center">
            <div className="w-full border-t border-neutral-200" />
            <span className="absolute bg-white px-2.5 text-[11px] text-neutral-400 font-normal">
              or
            </span>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-2.5">
            {state?.error && (
              <div className="rounded-md border border-red-500/20 bg-red-50 px-2.5 py-1.5 text-xs text-red-600">
                {state.error}
              </div>
            )}

            {/* Two-column inputs for Name and Lab to save vertical height */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-[11px] font-medium text-neutral-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Full Name"
                  required
                  autoFocus
                  className="h-8.5 rounded-md border-neutral-200 bg-white text-xs placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-black"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="organizationName" className="text-[11px] font-medium text-neutral-700">
                  Lab Name
                </Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  placeholder="e.g. Maison Lab"
                  required
                  className="h-8.5 rounded-md border-neutral-200 bg-white text-xs placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-black"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-[11px] font-medium text-neutral-700">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                required
                autoComplete="email"
                className="h-8.5 rounded-md border-neutral-200 bg-white text-xs placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-black"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-[11px] font-medium text-neutral-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password (min 8 chars)"
                required
                autoComplete="new-password"
                minLength={8}
                className="h-8.5 rounded-md border-neutral-200 bg-white text-xs placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-black"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-9.5 rounded-md bg-black hover:bg-neutral-800 text-white font-medium text-xs transition-colors cursor-pointer mt-2"
              loading={isPending}
            >
              Sign up
            </Button>
          </form>

          {/* Bottom Switch Link */}
          <p className="mt-4 text-center text-xs text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-neutral-400">
          Olfacta Laboratory Workstation
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
