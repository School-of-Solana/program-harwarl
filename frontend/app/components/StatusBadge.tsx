import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import type { EscrowStatus } from "../types/escrow";

interface StatusBadgeProps {
  status: EscrowStatus;
  className?: string;
}

const statusConfig: Record<
  EscrowStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "default" },
  closed: { label: "Closed", variant: "destructive" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn("font-medium", className)}>
      {config.label}
    </Badge>
  );
}
