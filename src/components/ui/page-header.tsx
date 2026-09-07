import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  action,
  badge,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        className
      )}
      {...props}
    >
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {action && <div className="flex items-center gap-2">{action}</div>}
      {children}
    </div>
  );
}

interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FilterBar({ className, children, ...props }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface FilterTagProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  label: string;
  count?: number;
}

export function FilterTag({
  active = false,
  label,
  count,
  className,
  ...props
}: FilterTagProps) {
  return (
    <button
      type="button"
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
        active
          ? "bg-primary text-primary-foreground font-semibold shadow-none"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        className
      )}
      {...props}
    >
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "ml-1.5 text-[11px]",
            active ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          ({count})
        </span>
      )}
    </button>
  );
}
