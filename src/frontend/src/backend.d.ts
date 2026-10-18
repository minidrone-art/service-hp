import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AttentionTicket {
    id: TicketId;
    customerName: string;
    status: TicketStatus;
    ticketNumber: string;
    overdue: boolean;
    estimatedCompletionDate: Timestamp;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface CreateCustomerInput {
    name: string;
    email?: string;
    address?: string;
    phone: string;
}
export interface CreateTicketInput {
    customerName: string;
    customerPhone: string;
    accessories: Array<string>;
    deviceColor: string;
    imei: string;
    complaint: string;
    deviceBrand: string;
    estimatedCost: bigint;
    estimatedCompletionDate: Timestamp;
    deviceModel: string;
}
export interface Customer {
    id: CustomerId;
    name: string;
    createdAt: Timestamp;
    email?: string;
    address?: string;
    phone: string;
}
export interface CustomerDevice {
    id: DeviceId;
    model: string;
    imei: string;
    createdAt: Timestamp;
    color: string;
    customerId: CustomerId;
    brand: string;
}
export type CustomerError = {
    __kind__: "notFound";
    notFound: CustomerId;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export type CustomerId = bigint;
export interface CustomerProfile {
    tickets: Array<TicketId>;
    customer: Customer;
    devices: Array<CustomerDevice>;
}
export interface DashboardSummary {
    attention: Array<AttentionTicket>;
    totalRevenue: bigint;
    counts: StatusCounts;
}
export interface Device {
    id: DeviceId;
    model: string;
    accessories: Array<string>;
    imei: string;
    color: string;
    brand: string;
}
export type DeviceId = bigint;
export interface DeviceServiceHistoryEntry {
    status: string;
    createdAt: Timestamp;
    complaint: string;
    ticketNumber: string;
    ticketId: TicketId;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type Result = {
    __kind__: "ok";
    ok: Ticket;
} | {
    __kind__: "err";
    err: TicketError;
};
export type Result_1 = {
    __kind__: "ok";
    ok: Customer;
} | {
    __kind__: "err";
    err: CustomerError;
};
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: TicketError;
};
export type Result_3 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface StatusCounts {
    diterima: bigint;
    diambil: bigint;
    selesai: bigint;
    menungguSparepart: bigint;
    diagnosa: bigint;
    dikerjakan: bigint;
}
export interface StatusHistoryEntry {
    status: TicketStatus;
    note: string;
    timestamp: Timestamp;
}
export interface TechnicianNote {
    note: string;
    timestamp: Timestamp;
}
export interface Ticket {
    id: TicketId;
    customerName: string;
    status: TicketStatus;
    customerPhone: string;
    accessories: Array<string>;
    technicianNotes: Array<TechnicianNote>;
    createdAt: Timestamp;
    complaint: string;
    statusHistory: Array<StatusHistoryEntry>;
    ticketNumber: TicketNumber;
    device: Device;
    updatedAt: Timestamp;
    customerId: CustomerId;
    estimatedCost: bigint;
    estimatedCompletionDate: Timestamp;
}
export type TicketError = {
    __kind__: "notFound";
    notFound: TicketId;
} | {
    __kind__: "alreadyPickedUp";
    alreadyPickedUp: TicketId;
} | {
    __kind__: "invalidTransition";
    invalidTransition: {
        to: TicketStatus;
        from: TicketStatus;
    };
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface TicketFilter {
    status?: TicketStatus;
    search?: string;
}
export type TicketId = bigint;
export type TicketNumber = string;
export interface TicketSummary {
    id: TicketId;
    customerName: string;
    status: TicketStatus;
    customerPhone: string;
    imei: string;
    createdAt: Timestamp;
    ticketNumber: TicketNumber;
    updatedAt: Timestamp;
    deviceBrand: string;
    estimatedCost: bigint;
    estimatedCompletionDate: Timestamp;
    deviceModel: string;
}
export type Timestamp = bigint;
export interface UpdateCustomerInput {
    name?: string;
    email?: string;
    address?: string;
    phone?: string;
}
export interface UpdateTicketInput {
    customerName?: string;
    customerPhone?: string;
    accessories?: Array<string>;
    deviceColor?: string;
    imei?: string;
    complaint?: string;
    deviceBrand?: string;
    estimatedCost?: bigint;
    estimatedCompletionDate?: Timestamp;
    deviceModel?: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum TicketStatus {
    diterima = "diterima",
    diambil = "diambil",
    selesai = "selesai",
    menungguSparepart = "menungguSparepart",
    diagnosa = "diagnosa",
    dikerjakan = "dikerjakan"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Tambah catatan teknisi pada tiket (admin).
     */
    addTechnicianNote(id: TicketId, note: string): Promise<Result>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Ubah status tiket mengikuti alur tahapan (admin).
     */
    changeTicketStatus(id: TicketId, status: TicketStatus, note: string): Promise<Result>;
    /**
     * / Buat pelanggan baru (admin).
     */
    createCustomer(input: CreateCustomerInput): Promise<Result_1>;
    /**
     * / Buat tiket servis baru (admin).
     */
    createTicket(input: CreateTicketInput): Promise<Result>;
    /**
     * / Hapus tiket (admin).
     */
    deleteTicket(id: TicketId): Promise<Result_2>;
    execute(qJson: string): Promise<Result__1>;
    /**
     * / Mengembalikan dokumentasi Markdown dari API publik backend.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Profil pelanggan beserta perangkat dan riwayat servisnya (admin).
     */
    getCustomerProfile(id: CustomerId): Promise<CustomerProfile | null>;
    /**
     * / Ringkasan dashboard: jumlah per status, tiket perlu perhatian, total pendapatan (admin).
     */
    getDashboardSummary(): Promise<DashboardSummary>;
    /**
     * / Riwayat perbaikan perangkat berdasarkan IMEI/serial (admin).
     */
    getDeviceHistory(imei: string): Promise<Array<DeviceServiceHistoryEntry>>;
    /**
     * / Detail lengkap sebuah tiket (admin).
     */
    getTicket(id: TicketId): Promise<Ticket | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Daftar pelanggan dengan pencarian nama atau nomor HP (admin).
     * / Pencarian kosong mengembalikan seluruh pelanggan.
     */
    listCustomers(search: string): Promise<Array<Customer>>;
    /**
     * / Daftar tiket dengan pencarian dan filter status (admin).
     */
    listTickets(filter: TicketFilter): Promise<Array<TicketSummary>>;
    schema(): Promise<string>;
    /**
     * / Perbarui data pelanggan (admin).
     */
    updateCustomer(id: CustomerId, input: UpdateCustomerInput): Promise<Result_1>;
    /**
     * / Perbarui data tiket (admin). Tiket yang sudah diambil tidak dapat diubah.
     */
    updateTicket(id: TicketId, input: UpdateTicketInput): Promise<Result>;
}
