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

/**
 * Typed local actor mock for the frontend suite.
 *
 * The app talks to the backend through `useActor(createActor)`; tests replace
 * that hook with a mock whose methods are these functions. Every method is
 * typed against the app's own `backendInterface` shape so a signature drift in
 * the generated bindings surfaces as a type error here rather than as a test
 * that silently exercises a stale contract.
 */

export interface MockBackend {
  isCallerAdmin: () => Promise<boolean>;
  getDashboardSummary: () => Promise<DashboardSummary>;
  listTickets: (filter: TicketFilter) => Promise<TicketSummary[]>;
  getTicket: (id: bigint) => Promise<Ticket | null>;
  createTicket: (
    input: unknown,
  ) => Promise<
    { __kind__: "ok"; ok: Ticket } | { __kind__: "err"; err: unknown }
  >;
  updateTicket: (
    id: bigint,
    input: unknown,
  ) => Promise<
    { __kind__: "ok"; ok: Ticket } | { __kind__: "err"; err: unknown }
  >;
  deleteTicket: (
    id: bigint,
  ) => Promise<
    { __kind__: "ok"; ok: null } | { __kind__: "err"; err: unknown }
  >;
  changeTicketStatus: (
    id: bigint,
    status: TicketStatus,
    note: string,
  ) => Promise<
    { __kind__: "ok"; ok: Ticket } | { __kind__: "err"; err: unknown }
  >;
  addTechnicianNote: (
    id: bigint,
    note: string,
  ) => Promise<
    { __kind__: "ok"; ok: Ticket } | { __kind__: "err"; err: unknown }
  >;
  listCustomers: (search: string | null) => Promise<Customer[]>;
  getCustomerProfile: (id: bigint) => Promise<CustomerProfile | null>;
  getDeviceHistory: (imei: string) => Promise<DeviceServiceHistoryEntry[]>;
  createCustomer: (
    input: unknown,
  ) => Promise<
    { __kind__: "ok"; ok: Customer } | { __kind__: "err"; err: unknown }
  >;
  updateCustomer: (
    id: bigint,
    input: unknown,
  ) => Promise<
    { __kind__: "ok"; ok: Customer } | { __kind__: "err"; err: unknown }
  >;
}

export const EMPTY_COUNTS: StatusCounts = {
  diterima: 0n,
  diagnosa: 0n,
  menungguSparepart: 0n,
  dikerjakan: 0n,
  selesai: 0n,
  diambil: 0n,
};

export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 1n,
    ticketNumber: "TSV-000001",
    customerId: 1n,
    customerName: "Budi Santoso",
    customerPhone: "0812-3456-7890",
    device: {
      id: 1n,
      brand: "Samsung",
      model: "Galaxy A54",
      color: "Hitam",
      imei: "356938035643809",
      accessories: ["Charger"],
    },
    complaint: "Layar retak.",
    accessories: ["Charger"],
    estimatedCost: 350_000n,
    estimatedCompletionDate: 4_000_000_000_000_000_000n,
    status: TicketStatus.diterima,
    statusHistory: [
      {
        status: TicketStatus.diterima,
        timestamp: 1_700_000_000_000_000_000n,
        note: "Tiket diterima",
      },
    ],
    technicianNotes: [],
    createdAt: 1_700_000_000_000_000_000n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

export function makeSummary(
  overrides: Partial<TicketSummary> = {},
): TicketSummary {
  const ticket = makeTicket();
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone,
    deviceBrand: ticket.device.brand,
    deviceModel: ticket.device.model,
    imei: ticket.device.imei,
    status: ticket.status,
    estimatedCost: ticket.estimatedCost,
    estimatedCompletionDate: ticket.estimatedCompletionDate,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    ...overrides,
  };
}

export function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1n,
    name: "Budi Santoso",
    phone: "0812-3456-7890",
    email: "budi@example.com",
    address: "Jl. Merdeka 1",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

export function makeDevice(
  overrides: Partial<CustomerDevice> = {},
): CustomerDevice {
  return {
    id: 1n,
    customerId: 1n,
    brand: "Samsung",
    model: "Galaxy A54",
    color: "Hitam",
    imei: "356938035643809",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

export function makeAttention(
  overrides: Partial<AttentionTicket> = {},
): AttentionTicket {
  return {
    id: 1n,
    ticketNumber: "TSV-000001",
    customerName: "Budi Santoso",
    status: TicketStatus.menungguSparepart,
    estimatedCompletionDate: 4_000_000_000_000_000_000n,
    overdue: false,
    ...overrides,
  };
}

/** A mock backend whose every method resolves to an empty/neutral value. */
export function makeMockBackend(
  overrides: Partial<MockBackend> = {},
): MockBackend {
  const base: MockBackend = {
    isCallerAdmin: async () => true,
    getDashboardSummary: async () => ({
      counts: EMPTY_COUNTS,
      attention: [],
      totalRevenue: 0n,
    }),
    listTickets: async () => [],
    getTicket: async () => null,
    createTicket: async () => ({ __kind__: "ok", ok: makeTicket() }),
    updateTicket: async () => ({ __kind__: "ok", ok: makeTicket() }),
    deleteTicket: async () => ({ __kind__: "ok", ok: null }),
    changeTicketStatus: async () => ({ __kind__: "ok", ok: makeTicket() }),
    addTechnicianNote: async () => ({ __kind__: "ok", ok: makeTicket() }),
    listCustomers: async () => [],
    getCustomerProfile: async () => null,
    getDeviceHistory: async () => [],
    createCustomer: async () => ({ __kind__: "ok", ok: makeCustomer() }),
    updateCustomer: async () => ({ __kind__: "ok", ok: makeCustomer() }),
  };
  return { ...base, ...overrides };
}
