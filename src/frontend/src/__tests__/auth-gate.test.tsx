import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderApp } from "./render";
import { type MockBackend, makeMockBackend } from "./test-utils";

/**
 * Mutable auth/actor state behind the mocked infrastructure module. `vi.hoisted`
 * runs before imports, so the object is created here and the factory below
 * closes over it.
 */
const state = vi.hoisted(() => ({
  actor: null as unknown,
  isFetching: false,
  isAuthenticated: false,
  isInitializing: false,
  isLoggingIn: false,
  login: () => {},
  clear: () => {},
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: state.actor, isFetching: state.isFetching }),
  useInternetIdentity: () => ({
    identity: state.isAuthenticated ? {} : undefined,
    login: state.login,
    clear: state.clear,
    loginStatus: state.isAuthenticated ? "success" : "idle",
    isInitializing: state.isInitializing,
    isLoginIdle: !state.isAuthenticated,
    isLoggingIn: state.isLoggingIn,
    isLoginSuccess: false,
    isLoginError: false,
    isSessionExpired: false,
    isAuthenticated: state.isAuthenticated,
  }),
  InternetIdentityProvider: ({ children }: { children: unknown }) => children,
}));

import App from "@/App";

function setActor(actor: MockBackend | null) {
  state.actor = actor;
}

describe("admin auth gate", () => {
  beforeEach(() => {
    state.actor = null;
    state.isFetching = false;
    state.isAuthenticated = false;
    state.isInitializing = false;
    state.isLoggingIn = false;
    state.login = vi.fn();
    state.clear = vi.fn();
    window.history.pushState({}, "", "/");
  });

  it("shows the branded login page to an unauthenticated visitor", async () => {
    renderApp(<App />);

    expect(await screen.findByText("Bengkel Presisi")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /masuk dengan internet identity/i }),
    ).toBeInTheDocument();
    // The management shell must not be reachable while signed out.
    expect(screen.queryByText("Panel Manajemen")).not.toBeInTheDocument();
  });

  it("invokes login when the sign-in button is pressed", async () => {
    const user = userEvent.setup();
    renderApp(<App />);

    const button = await screen.findByRole("button", {
      name: /masuk dengan internet identity/i,
    });
    await user.click(button);

    expect(state.login).toHaveBeenCalledTimes(1);
  });

  it("shows the access-denied page to a signed-in non-admin", async () => {
    state.isAuthenticated = true;
    setActor(makeMockBackend({ isCallerAdmin: async () => false }));
    renderApp(<App />);

    expect(await screen.findByText("Akses Ditolak")).toBeInTheDocument();
    expect(screen.queryByText("Panel Manajemen")).not.toBeInTheDocument();
  });

  it("renders the management shell for an admin", async () => {
    state.isAuthenticated = true;
    setActor(makeMockBackend({ isCallerAdmin: async () => true }));
    renderApp(<App />);

    await waitFor(() => {
      expect(screen.getByText("Panel Manajemen")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("navigation", { name: /navigasi utama/i }),
    ).toBeInTheDocument();
  });

  it("shows a full-screen loader while the identity is initializing", () => {
    state.isInitializing = true;
    renderApp(<App />);

    expect(screen.getByText("Memuat aplikasi…")).toBeInTheDocument();
    expect(screen.queryByText("Bengkel Presisi")).not.toBeInTheDocument();
  });
});
