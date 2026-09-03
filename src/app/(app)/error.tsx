"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertTriangle className="size-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {error.message && error.message.includes("Can't reach database")
          ? "The cloud database was waking up from sleep. Please try again in a moment."
          : error.message || "An unexpected error occurred while loading this page."}
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} className="gap-2">
          <RefreshCw className="size-4" />
          Try again
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/dashboard">
            <Home className="size-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
