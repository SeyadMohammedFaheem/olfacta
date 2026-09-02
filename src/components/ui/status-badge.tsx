import { CheckCircle2, AlertTriangle, XCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComplianceStatus } from "@/types";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
  IN_REVIEW: { label: "In Review", className: "compliance-review" },
  APPROVED: { label: "Approved", className: "compliance-pass" },
  REJECTED: { label: "Rejected", className: "compliance-violation" },
  ARCHIVED: { label: "Archived", className: "bg-muted text-muted-foreground" },
  PLANNED: { label: "Planned", className: "bg-muted text-muted-foreground" },
  IN_PRODUCTION: { label: "In Production", className: "compliance-review" },
  QC: { label: "QC", className: "compliance-warning" },
  COMPLETED: { label: "Completed", className: "compliance-pass" },
  CANCELLED: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", config.className, className)}>
      {config.label}
    </span>
  );
}

interface ComplianceBadgeProps {
  status: ComplianceStatus;
  showLabel?: boolean;
  className?: string;
}

const complianceConfig: Record<ComplianceStatus, { icon: React.ElementType; label: string; className: string }> = {
  PASS: { icon: CheckCircle2, label: "Compliant", className: "text-compliant" },
  WARNING: { icon: AlertTriangle, label: "Warning", className: "text-warning" },
  VIOLATION: { icon: XCircle, label: "Violation", className: "text-violation" },
  REVIEW_REQUIRED: { icon: Eye, label: "Review Required", className: "text-review" },
};

export function ComplianceBadge({ status, showLabel = true, className }: ComplianceBadgeProps) {
  const config = complianceConfig[status];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1", config.className, className)} aria-label={config.label}>
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span className="text-xs font-medium">{config.label}</span>}
    </span>
  );
}

interface DemoBadgeProps {
  className?: string;
}

export function DemoBadge({ className }: DemoBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded border border-dashed border-warning px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-warning-foreground bg-warning-bg", className)}>
      Demo Data
    </span>
  );
}
