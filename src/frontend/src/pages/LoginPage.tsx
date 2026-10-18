import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldCheck, Smartphone, Wrench } from "lucide-react";

/**
 * Branded sign-in screen for the phone-repair shop. Shown to unauthenticated
 * visitors before any management route is reachable.
 */
export function LoginPage() {
  const { login, isLoggingIn } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-subtle">
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="rounded-lg border border-border bg-card p-6 shadow-panel md:p-8">
            <div className="flex flex-col items-center text-center">
              <span className="flex size-14 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elevated">
                <Wrench className="size-7" aria-hidden="true" />
              </span>
              <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
                Bengkel Presisi
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sistem manajemen servis HP — dari intake perangkat sampai
                pengambilan.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-md bg-muted/60 p-3">
                <Smartphone
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Kelola tiket servis, pelanggan, dan perangkat dalam satu alur
                  kerja yang rapi.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-md bg-muted/60 p-3">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Area manajemen hanya dapat diakses oleh admin toko.
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="login.submit_button"
              className="mt-8 w-full"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Menghubungkan…
                </>
              ) : (
                "Masuk dengan Internet Identity"
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Gunakan identitas Internet Identity Anda untuk melanjutkan.
            </p>
          </div>
        </div>
      </div>
      <footer className="px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Dibuat dengan{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
