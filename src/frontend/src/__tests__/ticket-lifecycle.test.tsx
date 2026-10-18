import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { infrastructureModule } from "./mock-infrastructure";
import { renderApp } from "./render";
import {
  type MockBackend,
  makeMockBackend,
  makeSummary,
  makeTicket,
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

describe("ticket lifecycle", () => {
  beforeEach(() => {
    state.actor = null;
    state.isFetching = false;
    state.isAuthenticated = true;
    state.isInitializing = false;
    state.isLoggingIn = false;
    state.login = vi.fn();
    state.clear = vi.fn();
    at("/tiket");
  });

  it("lists tickets returned by the backend", async () => {
    setActor(
      makeMockBackend({
        listTickets: async () => [
          makeSummary({
            id: 1n,
            ticketNumber: "TSV-000001",
            customerName: "Budi Santoso",
          }),
          makeSummary({
            id: 2n,
            ticketNumber: "TSV-000002",
            customerName: "Siti Aminah",
          }),
        ],
      }),
    );
    renderApp(<App />);

    expect(await screen.findByText("TSV-000001")).toBeInTheDocument();
    expect(screen.getByText("TSV-000002")).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Siti Aminah")).toBeInTheDocument();
  });

  it("passes the typed search term to listTickets", async () => {
    const listTickets = vi.fn(async () => [
      makeSummary({ customerName: "Budi Santoso" }),
    ]);
    setActor(makeMockBackend({ listTickets }));
    const user = userEvent.setup();
    renderApp(<App />);

    const input = await screen.findByLabelText("Cari tiket servis");
    await user.type(input, "Budi");

    await waitFor(() => {
      expect(listTickets).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Budi" }),
      );
    });
  });

  it("filters by status through the URL search param", async () => {
    const listTickets = vi.fn(async () => [makeSummary()]);
    setActor(makeMockBackend({ listTickets }));
    const user = userEvent.setup();
    renderApp(<App />);

    const trigger = await screen.findByLabelText("Filter status tiket");
    await user.click(trigger);
    const option = await screen.findByRole("option", { name: "Dikerjakan" });
    await user.click(option);

    await waitFor(() => {
      expect(listTickets).toHaveBeenCalledWith(
        expect.objectContaining({ status: TicketStatus.dikerjakan }),
      );
    });
    // The filter is persisted in the URL so a refresh keeps it.
    expect(window.location.search).toContain("status=dikerjakan");
  });

  it("shows the empty state when no ticket matches the filter", async () => {
    setActor(makeMockBackend({ listTickets: async () => [] }));
    renderApp(<App />);

    expect(
      await screen.findByText("Belum ada tiket servis"),
    ).toBeInTheDocument();
  });

  it("creates a ticket from the form and sends the typed input", async () => {
    const createTicket = vi.fn(async (_input: unknown) => ({
      __kind__: "ok" as const,
      ok: makeTicket({ id: 9n }),
    }));
    setActor(makeMockBackend({ createTicket }));
    const user = userEvent.setup();
    at("/tiket/baru");
    renderApp(<App />);

    await user.type(
      await screen.findByLabelText("Nama pelanggan"),
      "Budi Santoso",
    );
    await user.type(screen.getByLabelText("Nomor HP"), "0812-3456-7890");
    await user.type(screen.getByLabelText("Merek"), "Samsung");
    await user.type(screen.getByLabelText("Model"), "Galaxy A54");
    await user.type(
      screen.getByLabelText("IMEI / Nomor seri"),
      "356938035643809",
    );
    await user.type(screen.getByLabelText("Keluhan pelanggan"), "Layar retak.");
    await user.type(screen.getByLabelText("Perkiraan biaya (Rp)"), "350000");

    // Pick an estimated completion date from the calendar popover. The trigger
    // is labelled by the "Estimasi selesai" field label.
    await user.click(screen.getByRole("button", { name: /estimasi selesai/i }));
    // react-day-picker renders each day as a button carrying a `data-day`
    // attribute; the accessible name is the full localized date, so select by
    // the attribute rather than by name.
    const dayButtons = await waitFor(() => {
      const buttons =
        document.querySelectorAll<HTMLButtonElement>("button[data-day]");
      expect(buttons.length).toBeGreaterThan(0);
      return buttons;
    });
    await user.click(dayButtons[dayButtons.length - 1]);

    await user.click(screen.getByRole("button", { name: /buat tiket/i }));

    await waitFor(() => {
      expect(createTicket).toHaveBeenCalledTimes(1);
    });
    const input = createTicket.mock.calls[0][0] as Record<string, unknown>;
    expect(input).toMatchObject({
      customerName: "Budi Santoso",
      customerPhone: "0812-3456-7890",
      deviceBrand: "Samsung",
      deviceModel: "Galaxy A54",
      imei: "356938035643809",
      complaint: "Layar retak.",
      estimatedCost: 350_000n,
    });
  });

  it("blocks submission and shows validation errors when required fields are empty", async () => {
    const createTicket = vi.fn(async () => ({
      __kind__: "ok" as const,
      ok: makeTicket(),
    }));
    setActor(makeMockBackend({ createTicket }));
    const user = userEvent.setup();
    at("/tiket/baru");
    renderApp(<App />);

    await user.click(
      await screen.findByRole("button", { name: /buat tiket/i }),
    );

    expect(
      await screen.findByText("Nama pelanggan wajib diisi."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("IMEI atau nomor seri wajib diisi."),
    ).toBeInTheDocument();
    expect(createTicket).not.toHaveBeenCalled();
  });

  it("shows ticket detail with device info, history, and cost", async () => {
    setActor(
      makeMockBackend({
        getTicket: async () =>
          makeTicket({
            id: 5n,
            ticketNumber: "TSV-000005",
            customerName: "Budi Santoso",
            complaint: "Layar retak.",
            estimatedCost: 350_000n,
            statusHistory: [
              {
                status: TicketStatus.diterima,
                timestamp: 1_700_000_000_000_000_000n,
                note: "Tiket diterima",
              },
            ],
          }),
      }),
    );
    at("/tiket/5");
    renderApp(<App />);

    expect(await screen.findByText("TSV-000005")).toBeInTheDocument();
    expect(screen.getByText("Samsung")).toBeInTheDocument();
    expect(screen.getByText("Galaxy A54")).toBeInTheDocument();
    expect(screen.getByText("356938035643809")).toBeInTheDocument();
    expect(screen.getByText("Layar retak.")).toBeInTheDocument();
    expect(screen.getByText("Rp 350.000")).toBeInTheDocument();
    // History entry from the backend is rendered.
    expect(screen.getByText("Tiket diterima")).toBeInTheDocument();
  });

  it("advances the status and sends the typed transition", async () => {
    const changeTicketStatus = vi.fn(async () => ({
      __kind__: "ok" as const,
      ok: makeTicket({ status: TicketStatus.diagnosa }),
    }));
    setActor(
      makeMockBackend({
        getTicket: async () =>
          makeTicket({ id: 5n, status: TicketStatus.diterima }),
        changeTicketStatus,
      }),
    );
    const user = userEvent.setup();
    at("/tiket/5");
    renderApp(<App />);

    const advance = await screen.findByRole("button", {
      name: /lanjut ke diagnosa/i,
    });
    await user.click(advance);

    await waitFor(() => {
      expect(changeTicketStatus).toHaveBeenCalledWith(
        5n,
        TicketStatus.diagnosa,
        "",
      );
    });
  });

  it("locks a picked-up ticket against further status changes", async () => {
    setActor(
      makeMockBackend({
        getTicket: async () =>
          makeTicket({ id: 5n, status: TicketStatus.diambil }),
      }),
    );
    at("/tiket/5");
    renderApp(<App />);

    expect(await screen.findByText("Tiket sudah diambil")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /lanjut ke/i }),
    ).not.toBeInTheDocument();
  });

  it("edits a ticket and sends the typed update", async () => {
    const updateTicket = vi.fn(async (_id: bigint, _input: unknown) => ({
      __kind__: "ok" as const,
      ok: makeTicket(),
    }));
    setActor(
      makeMockBackend({
        getTicket: async () =>
          makeTicket({
            id: 5n,
            complaint: "Layar retak.",
            estimatedCost: 350_000n,
          }),
        updateTicket,
      }),
    );
    const user = userEvent.setup();
    at("/tiket/5/ubah");
    renderApp(<App />);

    const complaint = await screen.findByLabelText("Keluhan pelanggan");
    await user.clear(complaint);
    await user.type(complaint, "Baterai cepat habis.");
    await user.click(screen.getByRole("button", { name: /simpan perubahan/i }));

    await waitFor(() => {
      expect(updateTicket).toHaveBeenCalledTimes(1);
    });
    const [id, input] = updateTicket.mock.calls[0] as [
      bigint,
      Record<string, unknown>,
    ];
    expect(id).toBe(5n);
    expect(input).toMatchObject({ complaint: "Baterai cepat habis." });
  });

  it("deletes a ticket after confirmation", async () => {
    const deleteTicket = vi.fn(async () => ({
      __kind__: "ok" as const,
      ok: null,
    }));
    setActor(
      makeMockBackend({
        getTicket: async () =>
          makeTicket({ id: 5n, ticketNumber: "TSV-000005" }),
        deleteTicket,
      }),
    );
    const user = userEvent.setup();
    at("/tiket/5");
    renderApp(<App />);

    await user.click(await screen.findByRole("button", { name: /^hapus$/i }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: /ya, hapus tiket/i }),
    );

    await waitFor(() => {
      expect(deleteTicket).toHaveBeenCalledWith(5n);
    });
  });
});
