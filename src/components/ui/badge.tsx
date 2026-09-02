import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        // Status variants
        draft: "border-transparent bg-muted text-muted-foreground",
        inReview: "border-transparent bg-review-bg text-review-foreground",
        approved: "border-transparent bg-compliant-bg text-compliant-foreground",
        rejected: "border-transparent bg-violation-bg text-violation-foreground",
        archived: "border-transparent bg-muted text-muted-foreground",
        // Compliance variants
        compliant: "border-transparent bg-compliant-bg text-compliant-foreground",
        warning: "border-transparent bg-warning-bg text-warning-foreground",
        violation: "border-transparent bg-violation-bg text-violation-foreground",
        review: "border-transparent bg-review-bg text-review-foreground",
        // Batch variants
        planned: "border-transparent bg-muted text-muted-foreground",
        inProduction: "border-transparent bg-review-bg text-review-foreground",
        qc: "border-transparent bg-warning-bg text-warning-foreground",
        completed: "border-transparent bg-compliant-bg text-compliant-foreground",
        cancelled: "border-transparent bg-muted text-muted-foreground",
        // Demo
        demo: "border-dashed border-warning text-warning-foreground bg-warning-bg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
