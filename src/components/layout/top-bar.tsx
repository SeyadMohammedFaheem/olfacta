"use client";

import { useState } from "react";
import { Bell, LogOut, Search, User as UserIcon, CheckCircle2, AlertTriangle, Factory, Clock, ShieldCheck, Command, Settings, ChevronDown } from "lucide-react";
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

interface TopBarProps {
  user: SessionUser;
}

export function TopBar({ user }: TopBarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      {/* Global Command Palette Trigger */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex h-9 w-72 items-center justify-between rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted/70 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Search anything...</span>
          </span>
          <kbd className="pointer-events-none rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            Ctrl+K
          </kbd>
        </button>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Organization */}
        <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
          {user.organizationName}
        </span>

        {/* Notifications Center */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Notifications</span>
              <span className="text-[10px] text-muted-foreground">3 unread</span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y text-xs">
              <div className="p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-compliant shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Vanilla Woods v1.0 Approved</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Approved by Compliance. Ready for batch scaling.</p>
                    <span className="text-[10px] text-muted-foreground mt-1 inline-block">10m ago</span>
                  </div>
                </div>
              </div>

              <div className="p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Compliance Warning on Rose Musk</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Beta-Damascenone is at 80% of IFRA category limit.</p>
                    <span className="text-[10px] text-muted-foreground mt-1 inline-block">1h ago</span>
                  </div>
                </div>
              </div>

              <div className="p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-2">
                  <Factory className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Batch B-2608-001 In Production</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">25 kg scaled batch entered dispensing stage.</p>
                    <span className="text-[10px] text-muted-foreground mt-1 inline-block">3h ago</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 border-t text-center">
              <Link href="/dashboard" className="text-[11px] font-medium text-primary hover:underline">
                View all activity in Dashboard
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-muted/60 border border-transparent hover:border-border transition-all"
              aria-label="User menu"
            >
              <div className="relative">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-tight">
                  {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold leading-tight text-foreground">{user.name}</p>
                <p className="text-[10px] text-muted-foreground leading-none">{user.role}</p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60 ml-0.5 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-0 overflow-hidden">
            {/* Rich Identity Header */}
            <div className="p-3.5 bg-muted/30 border-b">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground leading-snug truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground leading-none truncate">{user.email}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {user.role}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      • AromaLabs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="p-1">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs rounded-md">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Lab Settings & Team</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/compliance" className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs rounded-md">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Regulatory Standards</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer flex items-center justify-between px-3 py-2 text-xs rounded-md"
                onSelect={() => setPaletteOpen(true)}
              >
                <span className="flex items-center gap-2.5">
                  <Command className="h-4 w-4 text-muted-foreground" />
                  <span>Search Palette</span>
                </span>
                <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                  Ctrl+K
                </kbd>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="m-0" />

            {/* Sign Out */}
            <div className="p-1">
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2.5 px-3 py-2 text-xs rounded-md"
                onSelect={async () => {
                  await logoutAction();
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
