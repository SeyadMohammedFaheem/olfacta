"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  Beaker,
  Factory,
  ShieldCheck,
  FileBarChart,
  Settings,
  Search,
  ChevronsUpDown,
  ChevronRight,
  MoreHorizontal,
  Bell,
  LogOut,
  User as UserIcon,
  Check,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/app/(auth)/actions";
import type { SessionUser } from "@/types";
import { CommandPalette } from "@/components/ui/command-palette";

interface SidebarProps {
  user?: SessionUser | null;
}

const primaryNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, hasChevron: false },
  { href: "/formulas", label: "Formulas", icon: FlaskConical, hasChevron: false },
  { href: "/ingredients", label: "Raw Materials", icon: Beaker, hasChevron: true },
  { href: "/batches", label: "Batches", icon: Factory, hasChevron: false },
  { href: "/compliance", label: "Compliance & Safety", icon: ShieldCheck, hasChevron: true },
  { href: "/reports", label: "Analytics & Reports", icon: FileBarChart, hasChevron: true },
];

const secondaryNavItems = [
  { href: "/settings", label: "Settings", icon: Settings, hasChevron: true },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const orgName = user?.organizationName || "Olfacta Lab";
  const userDisplayName = user?.name || user?.email?.split("@")[0] || "faheemseyadmd";
  const userRole = user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : "Hobby";

  return (
    <aside className="flex flex-col w-[245px] h-screen border-r border-neutral-200/90 bg-white text-neutral-900 shrink-0 select-none">
      {/* ── 1. Top Section: Workspace Switcher + Find Search Bar (No dividing border) ── */}
      <div className="px-3 pt-3 pb-2 space-y-2.5">
        {/* Workspace Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-between w-full px-1 py-1 rounded-md hover:bg-neutral-100/80 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Globe / Mesh Matrix Avatar Icon */}
                <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shrink-0 overflow-hidden shadow-none">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>

                {/* Workspace Name */}
                <span className="text-[14px] font-medium text-neutral-900 truncate max-w-[100px]">
                  {orgName}
                </span>

                {/* Plan Badge */}
                <span className="px-2 py-0.5 text-[11px] font-normal tracking-tight bg-neutral-100 text-neutral-700 rounded-md border border-neutral-200/70 shrink-0">
                  {userRole}
                </span>
              </div>

              <ChevronsUpDown className="h-4 w-4 text-neutral-500 group-hover:text-neutral-800 transition-colors shrink-0 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Workspace
            </DropdownMenuLabel>
            <DropdownMenuItem className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                {orgName}
              </span>
              <Check className="h-4 w-4 text-primary" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                Workspace Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Find Input Button */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex items-center justify-between w-full h-8 px-2.5 rounded-md border border-neutral-200/90 bg-white hover:border-neutral-300 text-neutral-500 hover:text-neutral-800 transition-colors text-xs cursor-pointer group"
        >
          <span className="flex items-center gap-2 text-neutral-500 group-hover:text-neutral-800">
            <Search className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-600" />
            <span className="text-[13px]">Find</span>
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border border-neutral-200 bg-neutral-50 text-neutral-400 group-hover:text-neutral-600">
            F
          </kbd>
        </button>
      </div>

      {/* ── 2. Navigation Menu Items ── */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13.5px] transition-colors group",
                isActive
                  ? "bg-neutral-100 text-neutral-950 font-semibold"
                  : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50/90 font-normal"
              )}
            >
              <span className="flex items-center gap-2.5 truncate">
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-neutral-950" : "text-neutral-600 group-hover:text-neutral-900"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.hasChevron && (
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 transition-colors shrink-0" />
              )}
            </Link>
          );
        })}

        {/* ── Thin Divider Line ── */}
        <div className="pt-2 pb-1.5 px-1">
          <div className="border-t border-neutral-200/80" />
        </div>

        {/* ── Secondary Section (Settings) ── */}
        {secondaryNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13.5px] transition-colors group",
                isActive
                  ? "bg-neutral-100 text-neutral-950 font-semibold"
                  : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50/90 font-normal"
              )}
            >
              <span className="flex items-center gap-2.5 truncate">
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-neutral-950" : "text-neutral-600 group-hover:text-neutral-900"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.hasChevron && (
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 transition-colors shrink-0" />
              )}
            </Link>
          );
        })}
      </div>

      {/* ── 3. Footer Row: User Avatar + Name + Ellipsis Menu + Notification Bell ── */}
      <div className="p-2.5 border-t border-neutral-200/80 flex items-center justify-between">
        {/* User Profile */}
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-800 text-white font-semibold text-xs shrink-0 overflow-hidden">
            {userDisplayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-[13px] font-medium text-neutral-900 truncate">
            {userDisplayName}
          </span>
        </div>

        {/* Action Buttons: More Options + Notification Bell */}
        <div className="flex items-center gap-1 shrink-0">
          {/* User Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Account options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-xs font-semibold text-foreground">{user?.name || "User"}</div>
                <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <UserIcon className="h-4 w-4" />
                  Profile & Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-sm cursor-pointer transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications Trigger */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span className="font-semibold text-xs">Notifications</span>
                <span className="text-[10px] font-normal text-muted-foreground">3 unread</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-1 p-1 max-h-56 overflow-y-auto">
                <div className="p-2 rounded-md hover:bg-muted/50 text-xs transition-colors">
                  <div className="font-medium text-foreground">IFRA 51st Amendment</div>
                  <div className="text-muted-foreground text-[11px]">Safety rule update applied to 2 formulas.</div>
                </div>
                <div className="p-2 rounded-md hover:bg-muted/50 text-xs transition-colors">
                  <div className="font-medium text-foreground">Batch #BAT-2026-003</div>
                  <div className="text-muted-foreground text-[11px]">QC compounding phase complete.</div>
                </div>
                <div className="p-2 rounded-md hover:bg-muted/50 text-xs transition-colors">
                  <div className="font-medium text-foreground">Stock Alert</div>
                  <div className="text-muted-foreground text-[11px]">Iso E Super inventory below 500g threshold.</div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Global Command Palette modal connected to sidebar Find */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </aside>
  );
}
