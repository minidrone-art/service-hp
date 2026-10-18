import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTickets } from "@/hooks/useQueries";
import { formatDate, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STAGE_META, TICKET_STAGE_ORDER, type TicketStatus } from "@/types";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowRight,
  Plus,
  Search,
  SearchX,
  Ticket as TicketIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

const ALL_STATUS = "semua";

/** Mirrors the route's validated search shape declared in App.tsx. */
interface TicketSearch {
  q: string;
  status: TicketStatus | typeof ALL_STATUS;
}

const STATUS_OPTIONS: {
  value: TicketStatus | typeof ALL_STATUS;
  label: string;
}[] = [
  { value: ALL_STATUS, label: "Semua status" },
  ...TICKET_STAGE_ORDER.map((status) => ({
    value: status,
    label: STAGE_META[status].label,
  })),
];

function TicketTableSkeleton() {
  const rows = Array.from({ length: 6 }, (_, i) => `ticket-skeleton-${i}`);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>No. Tiket</TableHead>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Perangkat</TableHead>
            <TableHead>IMEI</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Estimasi Biaya</TableHead>
            <TableHead>Estimasi Selesai</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((id) => (
            <TableRow key={id}>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24 rounded-full" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-20" />
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
  const Icon = isFiltered ? SearchX : TicketIcon;
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center"
      data-ocid={
        isFiltered ? "ticket.empty_state.filtered" : "ticket.empty_state"
      }
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {isFiltered ? "Tidak ada tiket yang cocok" : "Belum ada tiket servis"}
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {isFiltered
            ? "Coba ubah kata kunci pencarian atau pilih status lain untuk menemukan tiket."
            : "Mulai catat intake perangkat pelanggan dengan membuat tiket servis pertama."}
        </p>
      </div>
      {isFiltered ? (
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          data-ocid="ticket.reset_filter_button"
        >
          Reset filter
        </Button>
      ) : (
        <Button asChild data-ocid="ticket.empty_new_button">
          <Link to="/tiket/baru">
            <Plus className="size-4" aria-hidden="true" />
            Tiket Baru
          </Link>
        </Button>
      )}
    </div>
  );
}

export function TicketListPage() {
  const search = useSearch({ from: "/app/tiket" });
  const navigate = useNavigate();

  const [query, setQuery] = useState(search.q);

  // Keep the input in sync when the URL changes from outside (e.g. reset).
  useEffect(() => {
    setQuery(search.q);
  }, [search.q]);

  // Debounce the search box into the URL so the filter survives a refresh.
  useEffect(() => {
    if (query === search.q) return;
    const timer = window.setTimeout(() => {
      void navigate({
        to: "/tiket",
        search: (prev) => ({ ...prev, q: query }) as TicketSearch,
        replace: true,
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, search.q, navigate]);

  const statusFilter = search.status;
  const tickets = useTickets({
    search: search.q.trim() === "" ? undefined : search.q.trim(),
    status: statusFilter === ALL_STATUS ? undefined : statusFilter,
  });

  const rows = tickets.data ?? [];
  const hasActiveFilter = search.q.trim() !== "" || statusFilter !== ALL_STATUS;

  function handleStatusChange(value: string) {
    void navigate({
      to: "/tiket",
      search: (prev) =>
        ({
          ...prev,
          status: value as TicketStatus | typeof ALL_STATUS,
        }) as TicketSearch,
      replace: true,
    });
  }

  function handleReset() {
    setQuery("");
    void navigate({
      to: "/tiket",
      search: { q: "", status: ALL_STATUS },
      replace: true,
    });
  }

  return (
    <div className="space-y-6" data-ocid="ticket.page">
      <PageHeader
        title="Tiket Servis"
        description="Daftar seluruh tiket servis perangkat, dari intake sampai pengambilan."
        actions={
          <Button asChild data-ocid="ticket.new_button">
            <Link to="/tiket/baru">
              <Plus className="size-4" aria-hidden="true" />
              Tiket Baru
            </Link>
          </Button>
        }
      />

      <Card
        className="rounded-lg border-border p-4 shadow-subtle"
        data-ocid="ticket.filter_panel"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama pelanggan, nomor HP, IMEI, atau nomor tiket…"
              aria-label="Cari tiket servis"
              className="pl-9"
              data-ocid="ticket.search_input"
            />
          </div>
          <div className="sm:w-56">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger
                aria-label="Filter status tiket"
                data-ocid="ticket.status_select"
              >
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    data-ocid={`ticket.status_option.${option.value}`}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {tickets.isLoading ? (
        <TicketTableSkeleton />
      ) : tickets.isError ? (
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
          data-ocid="ticket.error_state"
        >
          <p className="text-sm font-medium text-foreground">
            Gagal memuat daftar tiket servis.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void tickets.refetch()}
            data-ocid="ticket.retry_button"
          >
            Coba lagi
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          variant={hasActiveFilter ? "filtered" : "none"}
          onReset={handleReset}
        />
      ) : (
        <div
          className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle"
          data-ocid="ticket.table"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">No. Tiket</TableHead>
                <TableHead className="font-semibold">Pelanggan</TableHead>
                <TableHead className="font-semibold">Perangkat</TableHead>
                <TableHead className="font-semibold">IMEI</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">
                  Estimasi Biaya
                </TableHead>
                <TableHead className="font-semibold">
                  Estimasi Selesai
                </TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((ticket, index) => (
                <TableRow
                  key={ticket.id.toString()}
                  className="group transition-smooth hover:bg-muted/40"
                  data-ocid={`ticket.row.${index + 1}`}
                >
                  <TableCell className="font-mono text-xs font-medium text-foreground">
                    {ticket.ticketNumber}
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {ticket.customerName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {ticket.customerPhone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate text-foreground">
                        {ticket.deviceBrand}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {ticket.deviceModel}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {ticket.imei}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell className="text-right font-tabular font-medium text-foreground">
                    {formatRupiah(ticket.estimatedCost)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(ticket.estimatedCompletionDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="size-8"
                    >
                      <Link
                        to="/tiket/$ticketId"
                        params={{ ticketId: ticket.id.toString() }}
                        aria-label={`Lihat detail tiket ${ticket.ticketNumber}`}
                        data-ocid={`ticket.detail_link.${index + 1}`}
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

      {!tickets.isLoading && !tickets.isError && rows.length > 0 ? (
        <p
          className={cn("text-xs text-muted-foreground")}
          data-ocid="ticket.result_count"
        >
          Menampilkan {rows.length} tiket servis.
        </p>
      ) : null}
    </div>
  );
}
