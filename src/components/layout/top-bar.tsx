"use client";

import { useState } from "react";
import {
  Bell,
  LogOut,
  Search,
  CheckCircle2,
  AlertTriangle,
  Factory,
  Settings,
  User as UserIcon,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/ui/command-palette";
import type { SessionUser } from "@/types";
import { logoutAction } from "@/app/(auth)/actions";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopBarProps {
  user: SessionUser;
}

export function TopBar({ user }: TopBarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();

  const getBreadcrumbTitle = () => {
    if (pathname === "/dashboard") return "Overview";
    if (pathname.startsWith("/formulas")) return "Formulas";
    if (pathname.startsWith("/ingredients")) return "Raw Materials";
    if (pathname.startsWith("/batches")) return "Production Batches";
    if (pathname.startsWith("/compliance")) return "Compliance & IFRA";
    if (pathname.startsWith("/reports")) return "Reports & COA";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Olfacta Workspace";
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "faheemseyadm";
  const truncatedHandle = displayName.length > 14 ? `${displayName.slice(0, 12)}...` : displayName;

  return (
    <header className="flex h-12 items-center justify-between border-b border-border/70 bg-background px-4 select-none shrink-0 font-sans">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-foreground/80 hover:text-foreground cursor-pointer transition-colors">
          {truncatedHandle}
        </span>
        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
        <span className="font-semibold text-foreground">
          olfacta
        </span>
        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
        <span className="inline-flex items-center gap-1 rounded bg-muted/70 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/40">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
          {getBreadcrumbTitle()}
        </span>
      </div>

      {/* Right side: Quick Search + Help + User Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Search Trigger */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden md:flex h-7 w-56 items-center justify-between rounded-md border border-input/60 bg-muted/30 px-2.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all cursor-pointer shadow-none"
        >
          <span className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            <span>Search anything...</span>
          </span>
          <kbd className="pointer-events-none rounded border border-border/60 bg-background/80 px-1 py-0.2 font-mono text-[10px] font-medium text-muted-foreground shadow-none">
            Ctrl+K
          </kbd>
        </button>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

        {/* Feedback / Docs */}
        <Link
          href="/reports"
          className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors font-medium"
        >
          <span>Feedback</span>
        </Link>
        <Link
          href="/compliance"
          className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors font-medium"
        >
          <span>Docs</span>
        </Link>

        {/* User Identity Chip */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-7 items-center gap-2 rounded-full border border-border/60 bg-muted/20 pl-1 pr-2.5 hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-foreground max-w-[100px] truncate">
                {user.name || displayName}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal text-xs">
              <div className="font-semibold text-foreground">{user.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
              <div className="mt-1 text-[10px] text-muted-foreground font-medium">Role: {user.role}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="text-xs cursor-pointer">
                <Settings className="mr-2 h-3.5 w-3.5" />
                Settings
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
      </div>
    </header>
  );
}
