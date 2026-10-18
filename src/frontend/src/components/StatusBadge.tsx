import { cn } from "@/lib/utils";
import { STAGE_META, type TicketStatus } from "@/types";

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

/**
 * The signature detail of the app: a consistent pill badge + colored dot pair
 * that turns a dense ticket table into an instantly readable workflow map.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STAGE_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        meta.badgeClass,
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", meta.dotClass)}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}
