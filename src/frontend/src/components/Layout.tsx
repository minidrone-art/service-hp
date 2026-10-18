import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Smartphone,
  Ticket,
  Users,
  Wrench,
} from "lucide-react";
import { type ReactNode, useState } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tiket", label: "Tiket Servis", icon: Ticket },
  { to: "/pelanggan", label: "Pelanggan", icon: Users },
];

function isActivePath(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function BrandMark() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5"
      data-ocid="nav.brand_link"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-subtle">
        <Wrench className="size-4" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-base font-bold tracking-tight text-foreground">
          Bengkel Presisi
        </span>
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
          Manajemen Servis HP
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  return (
    <nav className="flex flex-col gap-1" aria-label="Navigasi utama">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            data-ocid={`nav.${item.to === "/" ? "dashboard" : item.to.slice(1)}.link`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-smooth",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-subtle"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { logout } = useAuth();
  return (
    <div className="space-y-3 border-t border-sidebar-border pt-4">
      <div className="flex items-center gap-3 px-1">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            AD
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            Admin Toko
          </p>
          <p className="truncate text-xs text-muted-foreground">Akses penuh</p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={logout}
        data-ocid="nav.logout_button"
        className="w-full justify-start text-muted-foreground hover:text-foreground"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Keluar
      </Button>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="px-1 pb-6">
          <BrandMark />
        </div>
        <div className="flex-1">
          <NavLinks />
        </div>
        <SidebarFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-4 shadow-subtle md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Buka menu navigasi"
                data-ocid="nav.menu_button"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-4">
              <SheetHeader className="px-1 pb-4 text-left">
                <SheetTitle className="sr-only">Navigasi</SheetTitle>
                <BrandMark />
              </SheetHeader>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 lg:hidden">
            <Smartphone className="size-4 text-primary" aria-hidden="true" />
            <span className="font-display text-sm font-bold tracking-tight">
              Bengkel Presisi
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
              Panel Manajemen
            </span>
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                AD
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 bg-background p-4 md:p-6 lg:p-8">
          {children}
        </main>

        <footer className="border-t border-border bg-muted/40 px-4 py-4 md:px-6">
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
    </div>
  );
}
