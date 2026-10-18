import type {
  AttentionTicket,
  Customer,
  CustomerDevice,
  CustomerProfile,
  DashboardSummary,
  DeviceServiceHistoryEntry,
  StatusCounts,
  Ticket,
  TicketFilter,
  TicketSummary,
} from "@/backend";
import { TicketStatus } from "@/backend";

export type {
  AttentionTicket,
  Customer,
  CustomerDevice,
  CustomerProfile,
  DashboardSummary,
  DeviceServiceHistoryEntry,
  StatusCounts,
  Ticket,
  TicketFilter,
  TicketSummary,
};

// TicketStatus is a backend enum (a runtime value), so it must be re-exported
// as a value — never with `export type`.
export { TicketStatus };

/** Ordered service workflow: Diterima → Diagnosa → Menunggu Sparepart → Dikerjakan → Selesai → Diambil. */
export const TICKET_STAGE_ORDER: TicketStatus[] = [
  TicketStatus.diterima,
  TicketStatus.diagnosa,
  TicketStatus.menungguSparepart,
  TicketStatus.dikerjakan,
  TicketStatus.selesai,
  TicketStatus.diambil,
];

export interface StageMeta {
  label: string;
  /** Tailwind classes for the pill badge (background tint + text color). */
  badgeClass: string;
  /** Tailwind class for the solid status dot. */
  dotClass: string;
}

export const STAGE_META: Record<TicketStatus, StageMeta> = {
  [TicketStatus.diterima]: {
    label: "Diterima",
    badgeClass: "bg-stage-diterima-bg text-stage-diterima",
    dotClass: "bg-stage-diterima",
  },
  [TicketStatus.diagnosa]: {
    label: "Diagnosa",
    badgeClass: "bg-stage-diagnosa-bg text-stage-diagnosa",
    dotClass: "bg-stage-diagnosa",
  },
  [TicketStatus.menungguSparepart]: {
    label: "Menunggu Sparepart",
    badgeClass: "bg-stage-sparepart-bg text-stage-sparepart",
    dotClass: "bg-stage-sparepart",
  },
  [TicketStatus.dikerjakan]: {
    label: "Dikerjakan",
    badgeClass: "bg-stage-dikerjakan-bg text-stage-dikerjakan",
    dotClass: "bg-stage-dikerjakan",
  },
  [TicketStatus.selesai]: {
    label: "Selesai",
    badgeClass: "bg-stage-selesai-bg text-stage-selesai",
    dotClass: "bg-stage-selesai",
  },
  [TicketStatus.diambil]: {
    label: "Diambil",
    badgeClass: "bg-stage-diambil-bg text-stage-diambil",
    dotClass: "bg-stage-diambil",
  },
};

/** The next stage in the workflow, or null when the ticket is already picked up. */
export function nextStage(status: TicketStatus): TicketStatus | null {
  const index = TICKET_STAGE_ORDER.indexOf(status);
  if (index < 0 || index >= TICKET_STAGE_ORDER.length - 1) return null;
  return TICKET_STAGE_ORDER[index + 1];
}

/** A ticket that has been picked up is final and can no longer change status. */
export function isTicketLocked(status: TicketStatus): boolean {
  return status === TicketStatus.diambil;
}
