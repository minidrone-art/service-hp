import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert } from "lucide-react";

/**
 * Shown to signed-in users who do not hold the admin role. Offers a recovery
 * path (sign out and try another identity) instead of a dead end.
 */
export function AccessDeniedPage() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4 md:p-8">
      <div
        className="w-full max-w-md animate-fade-in-up rounded-lg border border-border bg-card p-6 text-center shadow-panel md:p-8"
        data-ocid="access_denied.panel"
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
          Akses Ditolak
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Akun Anda tidak memiliki peran admin. Hubungi pemilik toko untuk
          mendapatkan akses ke area manajemen.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={logout}
          data-ocid="access_denied.logout_button"
          className="mt-6 w-full"
        >
          Keluar dan coba akun lain
        </Button>
      </div>
    </div>
  );
}
