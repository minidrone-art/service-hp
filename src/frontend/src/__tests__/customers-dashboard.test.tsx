import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { infrastructureModule } from "./mock-infrastructure";
import { renderApp } from "./render";
import {
  type MockBackend,
  makeCustomer,
  makeDevice,
  makeMockBackend,
} from "./test-utils";

/**
 * Mutable auth/actor state behind the mocked infrastructure module. `vi.hoisted`
 * runs before imports, so the object is created here and the factory below
 * closes over it.
 */
const state = vi.hoisted(() => ({
  actor: null as MockBackend | null,
  isFetching: false,
  isAuthenticated: true,
  isInitializing: false,
  isLoggingIn: false,
  login: () => {},
  clear: () => {},
}));

vi.mock("@caffeineai/core-infrastructure", () => infrastructureModule(state));

import App from "@/App";
import { TicketStatus } from "@/types";

function setActor(actor: MockBackend) {
  state.actor = actor;
}

/** Navigate the jsdom history before the router mounts. */
function at(path: string) {
  window.history.pushState({}, "", path);
}

describe("customer directory", () => {
  beforeEach(() => {
    state.actor = null;
    state.isFetching = false;
    state.isAuthenticated = true;
    state.isInitializing = false;
    state.isLoggingIn = false;
    state.login = vi.fn();
    state.clear = vi.fn();
    at("/pelanggan");
  });

  it("lists customers and shows their service-record count", async () => {
    setActor(
      makeMockBackend({
        listCustomers: async () => [
          makeCustomer({
            id: 1n,
            name: "Budi Santoso",
            phone: "0812-3456-7890",
          }),
          makeCustomer({
            id: 2n,
            name: "Siti Aminah",
            phone: "0813-1111-2222",
          }),
        ],
        getCustomerProfile: async (id) => ({
          customer: makeCustomer({ id }),
          devices: [],
          tickets: id === 1n ? [1n, 2n] : [3n],
        }),
      }),
    );
    renderApp(<App />);

    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Siti Aminah")).toBeInTheDocument();
    expect(screen.getByText("0812-3456-7890")).toBeInTheDocument();
    // Service-record counts come from each customer's profile.
    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("passes the typed search term to listCustomers", async () => {
    const listCustomers = vi.fn(async () => [makeCustomer()]);
    setActor(makeMockBackend({ listCustomers }));
    const user = userEvent.setup();
    renderApp(<App />);

    const input = await screen.findByLabelText(
      "Cari pelanggan berdasarkan nama atau nomor HP",
    );
    await user.type(input, "Budi");

    await waitFor(() => {
      expect(listCustomers).toHaveBeenCalledWith("Budi");
    });
  });

  it("shows the filtered empty state when no customer matches", async () => {
    setActor(makeMockBackend({ listCustomers: async () => [] }));
    const user = userEvent.setup();
    renderApp(<App />);

    const input = await screen.findByLabelText(
      "Cari pelanggan berdasarkan nama atau nomor HP",
    );
    await user.type(input, "Tidak Ada");

    expect(
      await screen.findByText("Tidak ada pelanggan yang cocok"),
    ).toBeInTheDocument();
  });

  it("shows the customer profile with contact details and devices", async () => {
    setActor(
      makeMockBackend({
        getCustomerProfile: async () => ({
          customer: makeCustomer({
            id: 1n,
            name: "Budi Santoso",
            phone: "0812-3456-7890",
            email: "budi@example.com",
            address: "Jl. Merdeka 1",
          }),
          devices: [
            makeDevice({ id: 1n, brand: "Samsung", model: "Galaxy A54" }),
          ],
          tickets: [1n],
        }),
      }),
    );
    at("/pelanggan/1");
    renderApp(<App />);

    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("0812-3456-7890")).toBeInTheDocument();
    expect(screen.getByText("budi@example.com")).toBeInTheDocument();
    expect(screen.getByText("Jl. Merdeka 1")).toBeInTheDocument();
    expect(screen.getByText("Samsung Galaxy A54")).toBeInTheDocument();
  });

  it("loads device repair history by IMEI when the device panel is expanded", async () => {
    const getDeviceHistory = vi.fn(async () => [
      {
        ticketId: 7n,
        ticketNumber: "TSV-000007",
        status: TicketStatus.selesai,
        complaint: "Ganti LCD.",
        createdAt: 1_700_000_000_000_000_000n,
      },
    ]);
    setActor(
      makeMockBackend({
        getCustomerProfile: async () => ({
          customer: makeCustomer({ id: 1n, name: "Budi Santoso" }),
          devices: [makeDevice({ id: 1n, imei: "356938035643809" })],
          tickets: [7n],
        }),
        getDeviceHistory,
      }),
    );
    const user = userEvent.setup();
    at("/pelanggan/1");
    renderApp(<App />);

    const toggle = await screen.findByRole("button", {
      name: /riwayat perbaikan/i,
    });
    await user.click(toggle);

    expect(await screen.findByText("TSV-000007")).toBeInTheDocument();
    expect(screen.getByText("Ganti LCD.")).toBeInTheDocument();
    expect(getDeviceHistory).toHaveBeenCalledWith("356938035643809");
  });

  it("shows the not-found state when the profile is missing", async () => {
    setActor(makeMockBackend({ getCustomerProfile: async () => null }));
    at("/pelanggan/999");
    renderApp(<App />);

    expect(
      await screen.findByText("Pelanggan tidak ditemukan"),
    ).toBeInTheDocument();
  });
});

describe("dashboard summary", () => {
  beforeEach(() => {
    state.actor = null;
    state.isFetching = false;
    state.isAuthenticated = true;
    state.isInitializing = false;
    state.isLoggingIn = false;
    state.login = vi.fn();
    state.clear = vi.fn();
    at("/");
  });

  it("renders per-status counts and total revenue", async () => {
    setActor(
      makeMockBackend({
        getDashboardSummary: async () => ({
          counts: {
            diterima: 2n,
            diagnosa: 1n,
            menungguSparepart: 3n,
            dikerjakan: 4n,
            selesai: 5n,
            diambil: 6n,
          },
          attention: [],
          totalRevenue: 1_250_000n,
        }),
      }),
    );
    renderApp(<App />);

    // Wait for the KPI cards to replace their loading skeletons.
    await waitFor(() => {
      expect(
        document.querySelector('[data-ocid="dashboard.kpi.diterima"]'),
      ).not.toBeNull();
    });
    const kpiSection = screen.getByRole("region", {
      name: "Ringkasan tiket per status",
    });
    // Each KPI card shows its stage label and count.
    expect(within(kpiSection).getByText("Diterima")).toBeInTheDocument();
    expect(within(kpiSection).getByText("Dikerjakan")).toBeInTheDocument();
    expect(within(kpiSection).getByText("Diambil")).toBeInTheDocument();
    expect(within(kpiSection).getByText("4")).toBeInTheDocument();
    expect(within(kpiSection).getByText("6")).toBeInTheDocument();

    expect(await screen.findByText("Rp 1.250.000")).toBeInTheDocument();
  });

  it("lists tickets that need attention", async () => {
    setActor(
      makeMockBackend({
        getDashboardSummary: async () => ({
          counts: {
            diterima: 0n,
            diagnosa: 0n,
            menungguSparepart: 1n,
            dikerjakan: 0n,
            selesai: 0n,
            diambil: 0n,
          },
          attention: [
            {
              id: 9n,
              ticketNumber: "TSV-000009",
              customerName: "Siti Aminah",
              status: TicketStatus.menungguSparepart,
              estimatedCompletionDate: 4_000_000_000_000_000_000n,
              overdue: true,
            },
          ],
          totalRevenue: 0n,
        }),
      }),
    );
    renderApp(<App />);

    expect(await screen.findByText("TSV-000009")).toBeInTheDocument();
    expect(screen.getByText("Siti Aminah")).toBeInTheDocument();
    expect(screen.getByText("Terlambat")).toBeInTheDocument();
  });

  it("shows the all-clear state when nothing needs attention", async () => {
    setActor(
      makeMockBackend({
        getDashboardSummary: async () => ({
          counts: {
            diterima: 0n,
            diagnosa: 0n,
            menungguSparepart: 0n,
            dikerjakan: 0n,
            selesai: 0n,
            diambil: 0n,
          },
          attention: [],
          totalRevenue: 0n,
        }),
      }),
    );
    renderApp(<App />);

    expect(
      await screen.findByText("Semua tiket terkendali"),
    ).toBeInTheDocument();
  });
});
