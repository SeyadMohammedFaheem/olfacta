declare module "next/link" {
  export * from "next/dist/client/link";
  export { default } from "next/dist/client/link";
}

declare module "next/navigation" {
  export * from "next/dist/client/components/navigation";
}

declare module "next/headers" {
  export { cookies } from "next/dist/server/request/cookies";
  export { headers } from "next/dist/server/request/headers";
  export { draftMode } from "next/dist/server/request/draft-mode";
  export type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
  export type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
}

declare module "next/server" {
  export * from "next/dist/server/web/exports/index";
}

declare module "next/image" {
  export * from "next/dist/client/image";
  export { default } from "next/dist/client/image";
}

declare module "next/form" {
  export * from "next/dist/client/form";
  export { default } from "next/dist/client/form";
}

declare module "next/dynamic" {
  export * from "next/dist/shared/lib/dynamic";
  export { default } from "next/dist/shared/lib/dynamic";
}
