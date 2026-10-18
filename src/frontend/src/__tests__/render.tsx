import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * Renders a component inside a fresh React Query client.
 *
 * A new client per render keeps cache state from leaking between tests, and
 * `retry: false` makes a rejected query surface immediately instead of after
 * the default retry backoff.
 */
export function renderWithQueryClient(ui: ReactElement): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

/**
 * Renders the full application (router included) inside a fresh query client.
 * `main.tsx` supplies the provider in production; tests must supply it too.
 */
export function renderApp(ui: ReactElement): RenderResult {
  return renderWithQueryClient(ui);
}

/** Wraps children in a fresh query client without rendering a component. */
export function QueryWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
