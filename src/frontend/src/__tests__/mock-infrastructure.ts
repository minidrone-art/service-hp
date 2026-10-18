import type { MockBackend } from "./test-utils";

/**
 * Shared, mutable state behind the `@caffeineai/core-infrastructure` mock.
 *
 * `vi.mock` factories are hoisted above imports, so the mock cannot close over
 * module-scope variables. Tests instead call `vi.hoisted` to create this state
 * and hand it to the factory; the helpers below read and write it.
 */
export interface InfrastructureState {
  actor: MockBackend | null;
  isFetching: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  login: () => void;
  clear: () => void;
}

export function createInfrastructureState(): InfrastructureState {
  return {
    actor: null,
    isFetching: false,
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    login: () => {},
    clear: () => {},
  };
}

/**
 * The module shape `@caffeineai/core-infrastructure` must present to the app.
 * `useActor` returns the configured mock actor; `useInternetIdentity` returns
 * the configured auth flags.
 */
export function infrastructureModule(state: InfrastructureState) {
  return {
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
  };
}
