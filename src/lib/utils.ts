import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateBatchNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `B-${y}${m}${d}-${rand}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getBaseUrl(request?: Request | { headers: Headers }): string {
  // 1. Check explicitly set NEXTAUTH_URL or APP_URL
  const configured = process.env.NEXTAUTH_URL || process.env.APP_URL;
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  
  // If in production, ignore a misconfigured 'localhost' URL
  if (configured && (!isProduction || !configured.includes("localhost"))) {
    return configured.replace(/\/$/, "");
  }

  // 2. Derive dynamically from incoming request headers
  if (request && "headers" in request) {
    const headers = request.headers;
    const host = headers.get("x-forwarded-host") || headers.get("host");
    if (host) {
      const proto = headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  }

  // 3. Fallback to Vercel system environment variables
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 4. Default to localhost for local development
  return "http://localhost:3000";
}

