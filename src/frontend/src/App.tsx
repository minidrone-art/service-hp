import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { AccessDeniedPage } from "@/pages/AccessDeniedPage";
import { CustomerListPage } from "@/pages/CustomerListPage";
import { CustomerProfilePage } from "@/pages/CustomerProfilePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { TicketDetailPage } from "@/pages/TicketDetailPage";
import { TicketFormPage } from "@/pages/TicketFormPage";
import { TicketListPage } from "@/pages/TicketListPage";
import { TicketStatus } from "@/types";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useParams,
} from "@tanstack/react-router";
import { Loader2, RefreshCw } from "lucide-react";

/* ------------------------------------------------------------------- shell */

function FullScreenLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      data-ocid="app.loading_state"
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2
          className="size-6 animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="text-sm">Memuat aplikasi…</p>
      </div>
    </div>
  );
}

/**
 * Shown when the admin role could not be resolved (actor creation or the role
 * lookup failed). Offers a retry instead of stranding the user on a dead end.
 */
function RoleErrorPage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4 md:p-8">
      <div
        className="w-full max-w-md animate-fade-in-up rounded-lg border border-border bg-card p-6 text-center shadow-panel md:p-8"
        data-ocid="role_error.panel"
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <RefreshCw className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
          Gagal memuat akses
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kami tidak dapat memverifikasi peran akun Anda. Periksa koneksi lalu
          coba lagi.
        </p>
        <Button
          type="button"
          onClick={onRetry}
          data-ocid="role_error.retry_button"
          className="mt-6 w-full"
        >
          Coba lagi
        </Button>
      </div>
    </div>
  );
}

/**
 * Gates every management route behind the admin check: unauthenticated visitors
 * see the branded login page, signed-in non-admins see the access-denied state.
 * Renders the shared sidebar + top bar shell around the matched child route.
 */
function AuthGate() {
  const {
    isAuthenticated,
    isInitializing,
    isAdmin,
    isRoleLoading,
    isRoleError,
    retryRole,
  } = useAuth();

  if (isInitializing) return <FullScreenLoader />;
  if (!isAuthenticated) return <LoginPage />;
  if (isRoleLoading) return <FullScreenLoader />;
  if (isRoleError) return <RoleErrorPage onRetry={retryRole} />;
  if (!isAdmin) return <AccessDeniedPage />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

/* ------------------------------------------------------------------ routes */

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

/** Layout route: every child below is admin-gated and wrapped in the app shell. */
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AuthGate,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: DashboardPage,
});

const ALL_STATUS = "semua";

interface TicketSearch {
  q: string;
  status: TicketStatus | typeof ALL_STATUS;
}

const VALID_STATUSES: string[] = [ALL_STATUS, ...Object.values(TicketStatus)];

/** Search params are validated so a hand-edited or stale URL never breaks the page. */
function validateTicketSearch(search: Record<string, unknown>): TicketSearch {
  const rawQuery = typeof search.q === "string" ? search.q : "";
  const rawStatus =
    typeof search.status === "string" ? search.status : ALL_STATUS;
  return {
    q: rawQuery,
    status: VALID_STATUSES.includes(rawStatus)
      ? (rawStatus as TicketStatus | typeof ALL_STATUS)
      : ALL_STATUS,
  };
}

const ticketsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/tiket",
  validateSearch: validateTicketSearch,
  component: TicketListPage,
});

const newTicketRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/tiket/baru",
  component: TicketFormPage,
});

const ticketDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/tiket/$ticketId",
  component: TicketDetailPage,
});

const editTicketRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/tiket/$ticketId/ubah",
  component: TicketFormPage,
});

const customersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/pelanggan",
  component: CustomerListPage,
});

/** Reads the route param and hands the parsed customer id to the profile page. */
function CustomerProfileRouteComponent() {
  const { customerId } = useParams({ from: "/app/pelanggan/$customerId" });
  return <CustomerProfilePage customerId={BigInt(customerId)} />;
}

const customerProfileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/pelanggan/$customerId",
  component: CustomerProfileRouteComponent,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([
    dashboardRoute,
    ticketsRoute,
    newTicketRoute,
    ticketDetailRoute,
    editTicketRoute,
    customersRoute,
    customerProfileRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
