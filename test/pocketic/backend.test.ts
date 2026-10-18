import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * PocketIC backend lane for the phone-repair service app.
 *
 * Installs the app's own compiled wasm into the platform's PocketIC replica and
 * drives the real public API. The frontend suite mocks the actor, so it passes
 * unchanged against a canister whose methods are all `Debug.todo()` stubs; this
 * lane is what actually proves the backend answers.
 *
 * The actor is built from `declarations/backend.did.js`, so results decode in
 * the raw Candid shape — `{ ok: ... }` / `{ err: ... }`, `[] | [T]` for
 * optionals, `{ variantName: null }` for variants — NOT the `backend.ts`
 * wrapper's `{ __kind__: "ok", ok: ... }` shape. Assertions below use the
 * declarations' shape deliberately.
 *
 * Every public method here is admin-only, so the canister is installed by an
 * admin identity and `_initialize_access_control` is called as that identity —
 * the first caller to initialize access control receives the admin role.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

const admin = createIdentity("backend-lane-admin");
const stranger = createIdentity("backend-lane-stranger");

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

/** A nanosecond timestamp far in the future so a fresh ticket is not overdue. */
const FAR_FUTURE = 4_000_000_000_000_000_000n;

interface TicketInputOverrides {
  customerName?: string;
  customerPhone?: string;
  deviceBrand?: string;
  deviceModel?: string;
  deviceColor?: string;
  imei?: string;
  complaint?: string;
  accessories?: string[];
  estimatedCost?: bigint;
  estimatedCompletionDate?: bigint;
}

function ticketInput(overrides: TicketInputOverrides = {}) {
  return {
    customerName: "Budi Santoso",
    customerPhone: "0812-3456-7890",
    deviceBrand: "Samsung",
    deviceModel: "Galaxy A54",
    deviceColor: "Hitam",
    imei: "356938035643809",
    complaint: "Layar retak dan sentuhan tidak responsif.",
    accessories: ["Charger", "Casing"],
    estimatedCost: 350_000n,
    estimatedCompletionDate: FAR_FUTURE,
    ...overrides,
  };
}

/**
 * A full `UpdateTicketInput`. Candid records are not partial: every optional
 * field must be present as `[] | [T]`, so a partial object fails to encode with
 * `Record is missing key`. Only the fields named here are changed.
 */
function updateInput(overrides: Partial<Record<string, [] | [unknown]>> = {}) {
  return {
    customerName: [],
    customerPhone: [],
    accessories: [],
    deviceColor: [],
    imei: [],
    complaint: [],
    deviceBrand: [],
    estimatedCost: [],
    estimatedCompletionDate: [],
    deviceModel: [],
    ...overrides,
  } as Parameters<Actor<_SERVICE>["updateTicket"]>[1];
}

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
      sender: admin.getPrincipal(),
    }));
  } else {
    // `[baseline, current]`, the same install contract the hosted deploy uses
    // for a converted project. The upgrade replays the chain from the legacy
    // schema.
    const installed = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BASELINE_WASM,
      sender: admin.getPrincipal(),
    });
    await pic.upgradeCanister({
      canisterId: installed.canisterId,
      wasm: BACKEND_WASM,
      arg: new Uint8Array(),
    });
    ({ actor, canisterId } = installed);
  }
  actor.setIdentity(admin);
  await actor._initialize_access_control();
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

describe("admin gate", () => {
  it("grants the initializing caller the admin role", async () => {
    actor.setIdentity(admin);
    await expect(actor.isCallerAdmin()).resolves.toBe(true);
  });

  it("hides data from a non-admin caller", async () => {
    const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
    guest.setIdentity(stranger);
    await expect(guest.listTickets({ search: [], status: [] })).resolves.toEqual([]);
    await expect(guest.listCustomers("")).resolves.toEqual([]);
    await expect(guest.getTicket(0n)).resolves.toEqual([]);
    await expect(guest.getCustomerProfile(0n)).resolves.toEqual([]);
    await expect(guest.getDeviceHistory("356938035643809")).resolves.toEqual([]);
    const summary = await guest.getDashboardSummary();
    expect(summary.totalRevenue).toBe(0n);
    expect(summary.attention).toEqual([]);
  });

  it("rejects a non-admin mutation with #unauthorized", async () => {
    const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
    guest.setIdentity(stranger);
    const result = await guest.createTicket(ticketInput());
    expect(result).toEqual({ err: { unauthorized: null } });
  });
});

describe("ticket lifecycle", () => {
  it("creates a ticket and reads it back through the real canister", async () => {
    actor.setIdentity(admin);
    const created = await actor.createTicket(
      ticketInput({ customerName: "Siti Aminah", imei: "111111111111111" }),
    );
    expect(created).toHaveProperty("ok");
    if (!("ok" in created)) return;

    const ticket = created.ok;
    expect(ticket.ticketNumber).toMatch(/^TSV-\d{6}$/);
    expect(ticket.status).toEqual({ diterima: null });
    expect(ticket.statusHistory).toHaveLength(1);
    expect(ticket.statusHistory[0].status).toEqual({ diterima: null });

    const fetched = await actor.getTicket(ticket.id);
    expect(fetched).toHaveLength(1);
    expect(fetched[0].customerName).toBe("Siti Aminah");
    expect(fetched[0].device.imei).toBe("111111111111111");
  });

  it("advances status one step at a time and appends history", async () => {
    actor.setIdentity(admin);
    const created = await actor.createTicket(
      ticketInput({ customerName: "Rina", imei: "222222222222222" }),
    );
    if (!("ok" in created)) throw new Error("createTicket failed");
    const id = created.ok.id;

    const advanced = await actor.changeTicketStatus(id, { diagnosa: null }, "Mulai diagnosa");
    expect(advanced).toHaveProperty("ok");
    if (!("ok" in advanced)) return;
    expect(advanced.ok.status).toEqual({ diagnosa: null });
    expect(advanced.ok.statusHistory).toHaveLength(2);
    expect(advanced.ok.statusHistory[1].note).toBe("Mulai diagnosa");
  });

  it("rejects a skipped or backward transition with #invalidTransition", async () => {
    actor.setIdentity(admin);
    const created = await actor.createTicket(
      ticketInput({ customerName: "Joko", imei: "333333333333333" }),
    );
    if (!("ok" in created)) throw new Error("createTicket failed");
    const id = created.ok.id;

    const skipped = await actor.changeTicketStatus(id, { dikerjakan: null }, "lompat");
    expect(skipped).toEqual({
      err: {
        invalidTransition: {
          from: { diterima: null },
          to: { dikerjakan: null },
        },
      },
    });

    const backward = await actor.changeTicketStatus(id, { diterima: null }, "mundur");
    expect(backward).toHaveProperty("err");
  });

  it("locks a picked-up ticket against further status changes", async () => {
    actor.setIdentity(admin);
    const created = await actor.createTicket(
      ticketInput({ customerName: "Dewi", imei: "444444444444444" }),
    );
    if (!("ok" in created)) throw new Error("createTicket failed");
    const id = created.ok.id;

    for (const status of [
      { diagnosa: null },
      { menungguSparepart: null },
      { dikerjakan: null },
      { selesai: null },
      { diambil: null },
    ] as const) {
      const step = await actor.changeTicketStatus(id, status, "");
      expect(step).toHaveProperty("ok");
    }

    const afterPickup = await actor.changeTicketStatus(id, { selesai: null }, "mundur");
    expect(afterPickup).toEqual({ err: { alreadyPickedUp: id } });

    const update = await actor.updateTicket(id, updateInput({ complaint: ["ubah"] }));
    expect(update).toEqual({ err: { alreadyPickedUp: id } });
  });

  it("appends a technician note", async () => {
    actor.setIdentity(admin);
    const created = await actor.createTicket(
      ticketInput({ customerName: "Agus", imei: "555555555555555" }),
    );
    if (!("ok" in created)) throw new Error("createTicket failed");
    const id = created.ok.id;

    const noted = await actor.addTechnicianNote(id, "LCD pengganti terpasang.");
    expect(noted).toHaveProperty("ok");
    if (!("ok" in noted)) return;
    expect(noted.ok.technicianNotes).toHaveLength(1);
    expect(noted.ok.technicianNotes[0].note).toBe("LCD pengganti terpasang.");
  });

  it("updates and deletes a ticket", async () => {
    actor.setIdentity(admin);
    const created = await actor.createTicket(
      ticketInput({ customerName: "Hendra", imei: "666666666666666" }),
    );
    if (!("ok" in created)) throw new Error("createTicket failed");
    const id = created.ok.id;

    const updated = await actor.updateTicket(
      id,
      updateInput({ complaint: ["Baterai cepat habis."] }),
    );
    expect(updated).toHaveProperty("ok");
    if (!("ok" in updated)) return;
    expect(updated.ok.complaint).toBe("Baterai cepat habis.");

    await expect(actor.deleteTicket(id)).resolves.toEqual({ ok: null });
    await expect(actor.deleteTicket(id)).resolves.toEqual({ err: { notFound: id } });
  });
});

describe("search and filter", () => {
  it("finds tickets by customer name, IMEI, and status", async () => {
    actor.setIdentity(admin);
    const unique = `999${Date.now()}`;
    const created = await actor.createTicket(
      ticketInput({
        customerName: `Pencarian ${unique}`,
        imei: `IMEI-${unique}`,
        customerPhone: `08${unique}`,
      }),
    );
    if (!("ok" in created)) throw new Error("createTicket failed");

    const byName = await actor.listTickets({
      search: [`Pencarian ${unique}`],
      status: [],
    });
    expect(byName.map((t) => t.id)).toContain(created.ok.id);

    const byImei = await actor.listTickets({
      search: [`IMEI-${unique}`],
      status: [],
    });
    expect(byImei.map((t) => t.id)).toContain(created.ok.id);

    const byStatus = await actor.listTickets({
      search: [],
      status: [{ diterima: null }],
    });
    expect(byStatus.every((t) => t.status.diterima !== undefined)).toBe(true);
    expect(byStatus.map((t) => t.id)).toContain(created.ok.id);
  });
});

describe("customers and devices", () => {
  it("returns a customer profile with devices and ticket ids", async () => {
    actor.setIdentity(admin);
    const unique = `777${Date.now()}`;
    const created = await actor.createTicket(
      ticketInput({
        customerName: `Profil ${unique}`,
        customerPhone: `07${unique}`,
        imei: `DEV-${unique}`,
      }),
    );
    if (!("ok" in created)) throw new Error("createTicket failed");
    const customerId = created.ok.customerId;

    const profile = await actor.getCustomerProfile(customerId);
    expect(profile).toHaveLength(1);
    if (profile.length === 0) return;
    expect(profile[0].customer.name).toBe(`Profil ${unique}`);
    expect(profile[0].devices.map((d) => d.imei)).toContain(`DEV-${unique}`);
    expect(profile[0].tickets).toContain(created.ok.id);
  });

  it("returns device service history by IMEI", async () => {
    actor.setIdentity(admin);
    const unique = `888${Date.now()}`;
    const imei = `HIST-${unique}`;
    const created = await actor.createTicket(
      ticketInput({ customerName: `Riwayat ${unique}`, imei }),
    );
    if (!("ok" in created)) throw new Error("createTicket failed");

    const history = await actor.getDeviceHistory(imei);
    expect(history).toHaveLength(1);
    expect(history[0].ticketId).toBe(created.ok.id);
    expect(history[0].status).toBe("Diterima");
  });

  it("searches customers by name or phone", async () => {
    actor.setIdentity(admin);
    const unique = `666${Date.now()}`;
    await actor.createCustomer({
      name: `Pelanggan ${unique}`,
      phone: `06${unique}`,
      email: [],
      address: [],
    });

    const byName = await actor.listCustomers(`Pelanggan ${unique}`);
    expect(byName.map((c) => c.name)).toContain(`Pelanggan ${unique}`);

    const byPhone = await actor.listCustomers(`06${unique}`);
    expect(byPhone.map((c) => c.phone)).toContain(`06${unique}`);
  });

  it("returns every customer for an empty search", async () => {
    actor.setIdentity(admin);
    const unique = `665${Date.now()}`;
    await actor.createCustomer({
      name: `Semua ${unique}`,
      phone: `05${unique}`,
      email: [],
      address: [],
    });

    const all = await actor.listCustomers("");
    expect(all.map((c) => c.name)).toContain(`Semua ${unique}`);
  });
});

describe("dashboard summary", () => {
  it("counts tickets per status and totals revenue from picked-up tickets", async () => {
    actor.setIdentity(admin);
    const unique = `555${Date.now()}`;
    const created = await actor.createTicket(
      ticketInput({
        customerName: `Dashboard ${unique}`,
        imei: `DASH-${unique}`,
        estimatedCost: 123_000n,
      }),
    );
    if (!("ok" in created)) throw new Error("createTicket failed");
    const id = created.ok.id;

    for (const status of [
      { diagnosa: null },
      { menungguSparepart: null },
      { dikerjakan: null },
      { selesai: null },
      { diambil: null },
    ] as const) {
      await actor.changeTicketStatus(id, status, "");
    }

    const summary = await actor.getDashboardSummary();
    expect(summary.counts.diambil).toBeGreaterThanOrEqual(1n);
    expect(summary.totalRevenue).toBeGreaterThanOrEqual(123_000n);
  });
});
