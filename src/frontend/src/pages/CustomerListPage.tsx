import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomerProfile, useCustomers } from "@/hooks/useQueries";
import { formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Search, SearchX, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";

/** Per-row service-record count, resolved from the customer's profile. */
function ServiceCountCell({ customerId }: { customerId: bigint }) {
  const profile = useCustomerProfile(customerId);

  if (profile.isLoading) {
    return <Skeleton className="ml-auto h-4 w-8" />;
  }
  if (profile.isError || !profile.data) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="font-tabular font-medium text-foreground">
      {profile.data.tickets.length}
    </span>
  );
}

function CustomerTableSkeleton() {
  const rows = Array.from({ length: 6 }, (_, i) => `customer-skeleton-${i}`);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nama</TableHead>
            <TableHead>Nomor HP</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Riwayat Servis</TableHead>
            <TableHead>Terdaftar</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((id) => (
            <TableRow key={id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-4 w-4" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyState({
  variant,
  onReset,
}: {
  variant: "none" | "filtered";
  onReset: () => void;
}) {
  const isFiltered = variant === "filtered";
  const Icon = isFiltered ? SearchX : Users;
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center"
      data-ocid={
        isFiltered ? "customer.empty_state.filtered" : "customer.empty_state"
      }
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {isFiltered
            ? "Tidak ada pelanggan yang cocok"
            : "Belum ada pelanggan"}
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {isFiltered
            ? "Coba ubah kata kunci pencarian berdasarkan nama atau nomor HP pelanggan."
            : "Pelanggan akan muncul di sini setelah tiket servis pertama dibuat."}
        </p>
      </div>
      {isFiltered ? (
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          data-ocid="customer.reset_filter_button"
        >
          Reset pencarian
        </Button>
      ) : (
        <Button asChild data-ocid="customer.empty_new_button">
          <Link to="/tiket/baru">
            <UserPlus className="size-4" aria-hidden="true" />
            Tiket Baru
          </Link>
        </Button>
      )}
    </div>
  );
}

export function CustomerListPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // Debounce the search box so the backend is not queried on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const customers = useCustomers(debounced);
  const rows = customers.data ?? [];
  const hasActiveFilter = debounced.trim() !== "";

  return (
    <div className="space-y-6" data-ocid="customer.page">
      <PageHeader
        title="Pelanggan"
        description="Daftar pelanggan bengkel beserta kontak dan riwayat servis perangkatnya."
      />

      <Card
        className="rounded-lg border-border p-4 shadow-subtle"
        data-ocid="customer.filter_panel"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau nomor HP pelanggan…"
            aria-label="Cari pelanggan berdasarkan nama atau nomor HP"
            className="pl-9"
            data-ocid="customer.search_input"
          />
        </div>
      </Card>

      {customers.isLoading ? (
        <CustomerTableSkeleton />
      ) : customers.isError ? (
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
          data-ocid="customer.error_state"
        >
          <p className="text-sm font-medium text-foreground">
            Gagal memuat daftar pelanggan.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void customers.refetch()}
            data-ocid="customer.retry_button"
          >
            Coba lagi
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          variant={hasActiveFilter ? "filtered" : "none"}
          onReset={() => setQuery("")}
        />
      ) : (
        <div
          className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle"
          data-ocid="customer.table"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Nama</TableHead>
                <TableHead className="font-semibold">Nomor HP</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="text-right font-semibold">
                  Riwayat Servis
                </TableHead>
                <TableHead className="font-semibold">Terdaftar</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((customer, index) => (
                <TableRow
                  key={customer.id.toString()}
                  className="group transition-smooth hover:bg-muted/40"
                  data-ocid={`customer.row.${index + 1}`}
                >
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {initials(customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <Link
                        to="/pelanggan/$customerId"
                        params={{ customerId: customer.id.toString() }}
                        className="truncate font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                        data-ocid={`customer.name_link.${index + 1}`}
                      >
                        {customer.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {customer.phone}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.email ? (
                      <span className="truncate">{customer.email}</span>
                    ) : (
                      <span className="text-muted-foreground/70">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ServiceCountCell customerId={customer.id} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(customer.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="size-8"
                    >
                      <Link
                        to="/pelanggan/$customerId"
                        params={{ customerId: customer.id.toString() }}
                        aria-label={`Lihat profil ${customer.name}`}
                        data-ocid={`customer.profile_link.${index + 1}`}
                      >
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!customers.isLoading && !customers.isError && rows.length > 0 ? (
        <p
          className={cn("text-xs text-muted-foreground")}
          data-ocid="customer.result_count"
        >
          Menampilkan {rows.length} pelanggan.
        </p>
      ) : null}
    </div>
  );
}
