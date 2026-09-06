"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Search,
  ChevronsUpDown,
  ChevronRight,
  CircleDot,
  FlaskConical,
  Droplets,
  Factory,
  ShieldCheck,
  LineChart,
  Gauge,
  Eye,
  FileSpreadsheet,
  Globe,
  SlidersHorizontal,
  AppWindow,
  Plug,
  Store,
  Database,
  ToggleLeft,
  Sparkles,
  MoreHorizontal,
  Bell,
  LogOut,
  Settings,
  User as UserIcon,
  Check,
  Building2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/ui/command-palette";
import { logoutAction } from "@/app/(auth)/actions";
import type { SessionUser } from "@/types";

interface SidebarProps {
  user?: SessionUser;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  hasSubmenu?: boolean;
  matchExact?: boolean;
}

const primaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: CircleDot, matchExact: true },
  { href: "/formulas", label: "Formulas", icon: FlaskConical, hasSubmenu: true },
  { href: "/ingredients", label: "Raw Materials", icon: Droplets, hasSubmenu: true },
  { href: "/batches", label: "Production Batches", icon: Factory, hasSubmenu: true },
  { href: "/compliance", label: "Compliance & IFRA", icon: ShieldCheck, hasSubmenu: true },
  { href: "/reports", label: "Reports & COA", icon: FileText, hasSubmenu: false },
  { href: "/dashboard#analytics", label: "Analytics", icon: LineChart, hasSubmenu: false },
  { href: "/dashboard#speed", label: "Speed Insights", icon: Gauge, hasSubmenu: false },
  { href: "/settings#audit", label: "Observability", icon: Eye, hasSubmenu: true },
  { href: "/compliance#rules", label: "Firewall & IFRA", icon: FileSpreadsheet, hasSubmenu: true },
  { href: "/ingredients#suppliers", label: "CDN & Suppliers", icon: Globe, hasSubmenu: true },
];

const secondaryNavItems: NavItem[] = [
  { href: "/settings#env", label: "Environment Variables", icon: SlidersHorizontal, hasSubmenu: false },
  { href: "/settings#domains", label: "Domains & Access", icon: AppWindow, hasSubmenu: false },
  { href: "/settings#connect", label: "Connect", icon: Plug, hasSubmenu: true },
  { href: "/settings#integrations", label: "Integrations", icon: Store, hasSubmenu: false },
  { href: "/settings#storage", label: "Storage (Neon DB)", icon: Database, hasSubmenu: false },
  { href: "/settings#flags", label: "Flags", icon: ToggleLeft, hasSubmenu: true },
  { href: "/formulas#ai", label: "Agent & Formulation AI", icon: Sparkles, hasSubmenu: true },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeOrg, setActiveOrg] = useState(user?.organizationName || "Olfacta Lab");

  const displayName = user?.name || user?.email?.split("@")[0] || "faheemseyadm";
  const truncatedHandle = displayName.length > 14 ? `${displayName.slice(0, 12)}...` : displayName;

  // Keyboard shortcut listener for 'f' to open find palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user presses 'f' outside input/textarea or Ctrl+K
      if (
        (e.key === "f" || e.key === "F") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName) &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <aside className="flex h-screen w-64 flex-col border-r border-border/70 bg-sidebar text-sidebar-foreground select-none shrink-0 font-sans">
        {/* 1. Account / Org Switcher Header */}
        <div className="p-3 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg p-1.5 text-left transition-colors hover:bg-sidebar-accent/70 focus-visible:outline-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Patterned Blue Avatar */}
                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-none overflow-hidden ring-1 ring-blue-500/30">
                    <svg viewBox="0 0 24 24" className="h-full w-full fill-current p-1 opacity-90">
                      <circle cx="6" cy="6" r="2.5" />
                      <circle cx="12" cy="6" r="2.5" />
                      <circle cx="18" cy="6" r="2.5" />
                      <circle cx="6" cy="12" r="2.5" />
                      <circle cx="12" cy="12" r="2.5" />
                      <circle cx="18" cy="12" r="2.5" />
                      <circle cx="6" cy="18" r="2.5" />
                      <circle cx="12" cy="18" r="2.5" />
                      <circle cx="18" cy="18" r="2.5" />
                    </svg>
                  </div>

                  {/* Account Name */}
                  <span className="truncate text-[13px] font-semibold tracking-tight text-foreground">
                    {truncatedHandle}
                  </span>

                  {/* Plan Badge */}
                  <span className="inline-flex shrink-0 items-center rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/40">
                    Hobby
                  </span>
                </div>

                {/* Switcher Arrows */}
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-1" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Personal Account
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setActiveOrg(displayName)}
                className="flex items-center justify-between text-xs font-medium cursor-pointer"
              >
                <span>{displayName} (Hobby)</span>
                {activeOrg === displayName && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Organizations
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setActiveOrg(user?.organizationName || "Olfacta Enterprise")}
                className="flex items-center justify-between text-xs font-medium cursor-pointer"
              >
                <span>{user?.organizationName || "Olfacta Lab"} (Pro)</span>
                {activeOrg !== displayName && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="text-xs cursor-pointer">
                  <Building2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Manage Organization
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 2. Search / Find Trigger Button */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-8 w-full items-center justify-between rounded-md border border-input/60 bg-muted/30 px-2.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all cursor-pointer shadow-none"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Find</span>
            </span>
            <kbd className="pointer-events-none inline-flex h-4 items-center justify-center rounded border border-border/60 bg-background/80 px-1 font-mono text-[10px] font-medium text-muted-foreground shadow-none">
              F
            </kbd>
          </button>
        </div>

        {/* 3. Navigation Items (Scrollable List) */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin">
          {/* Primary Nav List */}
          {primaryNavItems.map((item) => {
            const isActive = item.matchExact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-accent text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Icon */}
                  {isActive && item.label === "Overview" ? (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-background" />
                    </div>
                  ) : (
                    <item.icon className="h-4 w-4 shrink-0 stroke-[1.75]" />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>

                {/* Submenu Indicator Chevron */}
                {item.hasSubmenu && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:text-foreground group-hover:translate-x-0.5" />
                )}
              </Link>
            );
          })}

          {/* Hairline Divider */}
          <div className="my-2.5 mx-2 border-t border-border/50" />

          {/* Secondary Nav List */}
          {secondaryNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-accent text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <item.icon className="h-4 w-4 shrink-0 stroke-[1.75]" />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.hasSubmenu && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:text-foreground group-hover:translate-x-0.5" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 4. Bottom User Profile & Notification Bar */}
        <div className="border-t border-border/60 p-2.5 flex items-center justify-between gap-2 bg-sidebar shrink-0">
          {/* User Info / Avatar */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-800 text-[10px] font-bold text-amber-100 overflow-hidden ring-1 ring-border/40">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <span className="truncate text-xs font-medium text-foreground">
              {truncatedHandle}-2...
            </span>
          </div>

          {/* Action Buttons: More Options + Notifications */}
          <div className="flex items-center gap-1 shrink-0">
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-background/50 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer"
                  aria-label="User menu"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal text-xs">
                  <div className="font-medium text-foreground">{user?.name || "Faheem"}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{user?.email || "faheem@example.com"}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="text-xs cursor-pointer">
                    <Settings className="mr-2 h-3.5 w-3.5" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="text-xs cursor-pointer">
                    <UserIcon className="mr-2 h-3.5 w-3.5" />
                    Profile & API Keys
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutAction()}
                  className="text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification Bell with Blue Dot Indicator */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative flex h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-background/50 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="h-3.5 w-3.5" />
                  {/* Blue Unread Dot matching screenshot */}
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-background" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-0">
                <div className="p-2.5 border-b flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Notifications</span>
                  <span className="text-[10px] text-muted-foreground">3 unread</span>
                </div>
                <div className="divide-y text-xs max-h-56 overflow-y-auto">
                  <div className="p-2.5 hover:bg-muted/50 transition-colors">
                    <p className="font-medium text-foreground">Vanilla Woods v1.0 Approved</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Approved by Compliance. Ready for batch scaling.</p>
                    <span className="text-[10px] text-muted-foreground mt-1 inline-block">10m ago</span>
                  </div>
                  <div className="p-2.5 hover:bg-muted/50 transition-colors">
                    <p className="font-medium text-foreground">IFRA Alert on Rose Musk</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Beta-Damascenone is at 80% category limit.</p>
                    <span className="text-[10px] text-muted-foreground mt-1 inline-block">1h ago</span>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Global Command Palette */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
