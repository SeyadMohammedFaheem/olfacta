"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  FlaskConical,
  Beaker,
  Factory,
  ShieldCheck,
  Plus,
  Search,
  FileBarChart,
  Settings,
  Sparkles,
  ArrowRight,
  Droplets,
  Layers,
  Scale,
  CornerDownLeft,
  X,
  Compass,
  Command,
} from "lucide-react";
import { searchPaletteGlobal } from "@/services/ingredient/actions";
import { StatusBadge } from "@/components/ui/status-badge";

interface PaletteItem {
  id: string;
  title: string;
  description?: string;
  category: "action" | "navigation" | "formula" | "ingredient" | "batch";
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href: string;
  badge?: string;
  shortcut?: string;
}

const STATIC_ACTIONS: PaletteItem[] = [
  {
    id: "action-new-formula",
    title: "Create New Formula",
    description: "Start a new scent formulation workspace with IFRA limits",
    category: "action",
    icon: Plus,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    href: "/formulas/new",
    shortcut: "⌘N",
    badge: "Action",
  },
  {
    id: "action-new-ingredient",
    title: "Add Raw Material / Oil",
    description: "Register an essential oil, chemical isolate, or custom accord",
    category: "action",
    icon: Droplets,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
    href: "/ingredients",
    shortcut: "⌘M",
    badge: "Action",
  },
  {
    id: "action-run-compliance",
    title: "Run IFRA Compliance Scan",
    description: "Evaluate formulas against 51st Amendment safety standards",
    category: "action",
    icon: ShieldCheck,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    href: "/compliance",
    badge: "Safety",
  },
  {
    id: "action-new-batch",
    title: "Production Batch Dispensing",
    description: "Scale an approved formulation into manufacturing queue",
    category: "action",
    icon: Factory,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    href: "/batches",
    badge: "Production",
  },
];

const STATIC_NAVIGATION: PaletteItem[] = [
  {
    id: "nav-dashboard",
    title: "Laboratory Dashboard",
    description: "Operational KPIs, formulation pipeline & real-time activity",
    category: "navigation",
    icon: Compass,
    iconBg: "bg-muted",
    iconColor: "text-foreground",
    href: "/dashboard",
    shortcut: "G D",
  },
  {
    id: "nav-formulas",
    title: "Formulation Catalog",
    description: "Browse, compare and manage fragrance versions",
    category: "navigation",
    icon: FlaskConical,
    iconBg: "bg-muted",
    iconColor: "text-foreground",
    href: "/formulas",
    shortcut: "G F",
  },
  {
    id: "nav-ingredients",
    title: "Raw Materials & Oils Library",
    description: "Stock collection, CAS numbers, dilutions & cost records",
    category: "navigation",
    icon: Beaker,
    iconBg: "bg-muted",
    iconColor: "text-foreground",
    href: "/ingredients",
    shortcut: "G I",
  },
  {
    id: "nav-batches",
    title: "Production Batches & QC",
    description: "Active manufacturing, scale factors & compounding",
    category: "navigation",
    icon: Factory,
    iconBg: "bg-muted",
    iconColor: "text-foreground",
    href: "/batches",
    shortcut: "G B",
  },
  {
    id: "nav-compliance",
    title: "Compliance & Regulatory Safety",
    description: "IFRA standards, maximum allowable limits & allergen checks",
    category: "navigation",
    icon: ShieldCheck,
    iconBg: "bg-muted",
    iconColor: "text-foreground",
    href: "/compliance",
    shortcut: "G C",
  },
  {
    id: "nav-reports",
    title: "Reports & Export Center",
    description: "Formulation sheets, supplier inventory & audit logs",
    category: "navigation",
    icon: FileBarChart,
    iconBg: "bg-muted",
    iconColor: "text-foreground",
    href: "/reports",
    shortcut: "G R",
  },
  {
    id: "nav-settings",
    title: "Lab Settings & Team",
    description: "Organization profile, member roles & security audit trail",
    category: "navigation",
    icon: Settings,
    iconBg: "bg-muted",
    iconColor: "text-foreground",
    href: "/settings",
    shortcut: "G S",
  },
];

export interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps = {}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === "function" ? value(open) : value;
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, open, onOpenChange]
  );

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<CategoryFilter>("ALL");
  const [searching, setSearching] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  const [liveResults, setLiveResults] = React.useState<{
    formulas: PaletteItem[];
    ingredients: PaletteItem[];
    batches: PaletteItem[];
  }>({
    formulas: [],
    ingredients: [],
    batches: [],
  });

  // Global hotkey Ctrl+K / Cmd+K & custom open event
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener("keydown", down, true);
    document.addEventListener("keydown", down, true);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", down, true);
      document.removeEventListener("keydown", down, true);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [setOpen]);

  // Live database search debounce
  React.useEffect(() => {
    if (query.trim().length >= 2) {
      setSearching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await searchPaletteGlobal(query);
          
          const mappedFormulas: PaletteItem[] = (res.formulas || []).map((f) => ({
            id: `formula-${f.id}`,
            title: f.name,
            description: `${f.productType.replace(/_/g, " ")} • Status: ${f.status}`,
            category: "formula",
            icon: FlaskConical,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            href: `/formulas/${f.id}`,
            badge: f.status,
          }));

          const mappedIngredients: PaletteItem[] = (res.ingredients || []).map((ing) => ({
            id: `ing-${ing.id}`,
            title: ing.name,
            description: `${ing.materialType.replace(/_/g, " ")}${ing.casNumber ? ` • CAS: ${ing.casNumber}` : ""}${ing.dilutionPercentage && ing.dilutionPercentage < 100 ? ` • ${ing.dilutionPercentage}% in ${ing.diluentSolvent || "DPG"}` : " • Neat (100%)"}`,
            category: "ingredient",
            icon: Beaker,
            iconBg: "bg-violet-500/10",
            iconColor: "text-violet-600",
            href: `/ingredients/${ing.id}`,
            badge: ing.materialType.split("_")[0],
          }));

          const mappedBatches: PaletteItem[] = (res.batches || []).map((b) => ({
            id: `batch-${b.id}`,
            title: `Batch #${b.batchNumber}`,
            description: `${b.formula?.name || "Formula"} • Target: ${b.targetQuantity}${b.unit}`,
            category: "batch",
            icon: Factory,
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-600",
            href: `/batches/${b.id}`,
            badge: b.status,
          }));

          setLiveResults({
            formulas: mappedFormulas,
            ingredients: mappedIngredients,
            batches: mappedBatches,
          });
        } catch {
          setLiveResults({ formulas: [], ingredients: [], batches: [] });
        } finally {
          setSearching(false);
        }
      }, 200);

      return () => clearTimeout(timer);
    } else {
      setLiveResults({ formulas: [], ingredients: [], batches: [] });
      setSearching(false);
    }
  }, [query]);

  // Compute all visible items based on search query and category tab filter
  const visibleItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    // If typing a query, filter static actions and combine with live results
    if (q.length > 0) {
      let items: PaletteItem[] = [];

      if (filter === "ALL" || filter === "ACTIONS") {
        const filteredActions = STATIC_ACTIONS.filter(
          (a) => a.title.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q))
        );
        items = [...items, ...filteredActions];
      }

      if (filter === "ALL" || filter === "FORMULAS") {
        items = [...items, ...liveResults.formulas];
      }

      if (filter === "ALL" || filter === "MATERIALS") {
        items = [...items, ...liveResults.ingredients];
      }

      if (filter === "ALL" || filter === "BATCHES") {
        items = [...items, ...liveResults.batches];
      }

      if (filter === "ALL" || filter === "ACTIONS") {
        const filteredNav = STATIC_NAVIGATION.filter(
          (n) => n.title.toLowerCase().includes(q) || (n.description && n.description.toLowerCase().includes(q))
        );
        items = [...items, ...filteredNav];
      }

      return items;
    }

    // Default view when query is empty
    let items: PaletteItem[] = [];
    if (filter === "ALL" || filter === "ACTIONS") {
      items = [...items, ...STATIC_ACTIONS];
    }
    if (filter === "ALL") {
      items = [...items, ...STATIC_NAVIGATION];
    } else if (filter === "FORMULAS") {
      items = [
        {
          id: "nav-formulas",
          title: "Browse All Formulas",
          description: "View complete formulation catalog",
          category: "navigation",
          icon: FlaskConical,
          iconBg: "bg-muted",
          iconColor: "text-foreground",
          href: "/formulas",
        },
      ];
    } else if (filter === "MATERIALS") {
      items = [
        {
          id: "nav-ingredients",
          title: "Browse All Raw Materials",
          description: "View collection of essential oils and aroma chemicals",
          category: "navigation",
          icon: Beaker,
          iconBg: "bg-muted",
          iconColor: "text-foreground",
          href: "/ingredients",
        },
      ];
    } else if (filter === "BATCHES") {
      items = [
        {
          id: "nav-batches",
          title: "Browse Production Batches",
          description: "View dispensing and manufacturing logs",
          category: "navigation",
          icon: Factory,
          iconBg: "bg-muted",
          iconColor: "text-foreground",
          href: "/batches",
        },
      ];
    }

    return items;
  }, [query, filter, liveResults]);

  // Reset selected index when visible items change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [visibleItems.length, filter]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, visibleItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + visibleItems.length) % Math.max(1, visibleItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (visibleItems[selectedIndex]) {
        handleSelect(visibleItems[selectedIndex].href);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Group visible items by category for visual headers
  const groupedSections = React.useMemo(() => {
    const sections: { title: string; items: { item: PaletteItem; index: number }[] }[] = [];
    const categoryMap: Record<string, { title: string; items: { item: PaletteItem; index: number }[] }> = {
      action: { title: "Quick Actions", items: [] },
      formula: { title: "Formulas Found", items: [] },
      ingredient: { title: "Raw Materials & Oils", items: [] },
      batch: { title: "Production Batches", items: [] },
      navigation: { title: "Laboratory Navigation", items: [] },
    };

    visibleItems.forEach((item, index) => {
      if (categoryMap[item.category]) {
        categoryMap[item.category].items.push({ item, index });
      }
    });

    Object.values(categoryMap).forEach((sec) => {
      if (sec.items.length > 0) {
        sections.push(sec);
      }
    });

    return sections;
  }, [visibleItems]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={handleKeyDown}
        className="p-0 max-w-2xl overflow-hidden border border-border/80 bg-background/98 backdrop-blur-xl shadow-2xl rounded-2xl gap-0 duration-150"
      >
        {/* ─── Search Input Header ─── */}
        <div className="flex items-center px-4 py-2 border-b border-border/60 bg-muted/[0.02]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground shrink-0 mr-2.5">
            {searching ? (
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            ) : (
              <Search className="h-4.5 w-4.5" />
            )}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a formula, raw oil, CAS #, or command..."
            style={{ outline: "none", boxShadow: "none", border: "none" }}
            className="flex h-11 w-full bg-transparent text-[15px] font-normal border-none ring-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/60 text-foreground"
            autoFocus
          />
          <div className="flex items-center gap-2 shrink-0">
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Clear input"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-6 items-center gap-1 rounded-md border border-border/80 bg-muted/60 px-2 font-mono text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Close palette"
            >
              <span>Esc</span>
            </button>
          </div>
        </div>

        {/* ─── Filter Pills Bar ─── */}
        <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-border/40 bg-muted/20 overflow-x-auto text-xs">
          {(
            [
              { key: "ALL", label: "All" },
              { key: "ACTIONS", label: "Actions" },
              { key: "FORMULAS", label: "Formulas" },
              { key: "MATERIALS", label: "Materials" },
              { key: "BATCHES", label: "Batches" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                filter === t.key
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {t.label}
            </button>
          ))}
          {query.trim().length >= 2 && (
            <span className="ml-auto text-[11px] font-mono text-muted-foreground/70 shrink-0">
              {visibleItems.length} result{visibleItems.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ─── Results / Navigation List ─── */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 text-sm space-y-4 select-none"
        >
          {visibleItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="h-8 w-8 mx-auto text-muted-foreground/30 stroke-[1.5]" />
              <p className="text-sm font-medium text-foreground">No matching items found</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Try searching for a different perfume name, ingredient, CAS number, or clear the filter.
              </p>
            </div>
          ) : (
            groupedSections.map((sec) => (
              <div key={sec.title} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center justify-between">
                  <span>{sec.title}</span>
                  <span className="font-mono text-[9px] text-muted-foreground/60">
                    {sec.items.length}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {sec.items.map(({ item, index }) => {
                    const isSelected = index === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        data-index={index}
                        onClick={() => handleSelect(item.href)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-all cursor-pointer group ${
                          isSelected
                            ? "bg-primary/10 text-foreground font-medium ring-1 ring-primary/20 shadow-xs"
                            : "hover:bg-muted/60 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors ${
                              isSelected ? "bg-primary text-primary-foreground shadow-xs" : `${item.iconBg} ${item.iconColor}`
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm truncate font-medium ${
                                  isSelected ? "text-foreground font-semibold" : "text-foreground"
                                }`}
                              >
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border bg-muted/60 text-muted-foreground shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {item.shortcut && (
                            <kbd className="hidden sm:inline-flex h-5 select-none items-center rounded border border-border/80 bg-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                              {item.shortcut}
                            </kbd>
                          )}
                          <ArrowRight
                            className={`h-3.5 w-3.5 transition-all ${
                              isSelected
                                ? "text-primary translate-x-0.5 opacity-100"
                                : "text-muted-foreground/0 opacity-0 group-hover:opacity-100 group-hover:text-muted-foreground"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── Footer Helper Bar ─── */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border bg-background px-1 font-mono text-[9px] font-semibold">
                ↑
              </kbd>
              <kbd className="inline-flex h-4 items-center rounded border bg-background px-1 font-mono text-[9px] font-semibold">
                ↓
              </kbd>
              <span className="ml-0.5">Navigate</span>
            </span>

            <span className="text-muted-foreground/40">•</span>

            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border bg-background px-1 font-mono text-[9px] font-semibold">
                ↵
              </kbd>
              <span className="ml-0.5">Select</span>
            </span>

            <span className="text-muted-foreground/40">•</span>

            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border bg-background px-1 font-mono text-[9px] font-semibold">
                ESC
              </kbd>
              <span className="ml-0.5">Close</span>
            </span>
          </div>

          <span className="font-mono text-[10px] text-muted-foreground/70 hidden sm:inline">
            Olfacta Spotlight
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
