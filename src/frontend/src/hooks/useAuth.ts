import { createActor } from "@/backend";
import { queryKeys } from "@/lib/queryKeys";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export interface AuthState {
  /** True once a valid, non-anonymous identity is present (login or restored session). */
  isAuthenticated: boolean;
  /** True while the stored identity is being restored on first load. */
  isInitializing: boolean;
  /** True while the Internet Identity popup flow is in progress. */
  isLoggingIn: boolean;
  /** True when the signed-in identity holds the admin role. */
  isAdmin: boolean;
  /** True while the admin role is still being resolved from the backend. */
  isRoleLoading: boolean;
  /** True when the actor or role lookup failed and the role is still unknown. */
  isRoleError: boolean;
  /** Retry resolving the admin role after a failed actor/role lookup. */
  retryRole: () => void;
  /** Sign in with Internet Identity. */
  login: () => void;
  /** Sign out and clear the stored identity. */
  logout: () => void;
}

/**
 * Wraps Internet Identity sign-in/out and resolves the caller's admin role from
 * the backend. Every management route gates on `isAdmin`.
 */
export function useAuth(): AuthState {
  const {
    identity,
    login,
    clear,
    isInitializing,
    isLoggingIn,
    isAuthenticated,
  } = useInternetIdentity();
  const { actor, isFetching } = useActor(createActor);

  const roleQuery = useQuery({
    queryKey: queryKeys.isAdmin,
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });

  // The role is only truly resolved once the query has produced data. While the
  // actor is still being created (query disabled) or the query is in flight, the
  // role is unknown — never treat that window as "not admin".
  const isRoleResolved = roleQuery.data !== undefined;
  const isRoleError = !!identity && !isRoleResolved && roleQuery.isError;

  return {
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isAdmin: roleQuery.data === true,
    isRoleLoading: !!identity && !isRoleResolved && !isRoleError,
    isRoleError,
    retryRole: () => {
      void roleQuery.refetch();
    },
    login: () => login(),
    logout: () => clear(),
  };
}
