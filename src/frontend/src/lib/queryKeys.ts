import type { TicketFilter } from "@/backend";

/**
 * Central query-key factory. Every hook and every invalidation reads from here
 * so a mutation can never miss a cache entry it should refresh.
 */
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  tickets: (filter: TicketFilter) => ["tickets", filter] as const,
  ticket: (id: bigint) => ["ticket", id.toString()] as const,
  customers: (search: string) => ["customers", search] as const,
  customerProfile: (id: bigint) => ["customerProfile", id.toString()] as const,
  deviceHistory: (imei: string) => ["deviceHistory", imei] as const,
  callerRole: ["callerRole"] as const,
  isAdmin: ["isAdmin"] as const,
};
