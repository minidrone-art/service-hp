import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSummary } from "@/hooks/useQueries";
import { formatDueLabel, formatRupiah } from "@/lib/format";
import {
  type AttentionTicket,
  STAGE_META,
  TICKET_STAGE_ORDER,
  type TicketStatus,
} from "@/types";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Inbox,
  PackageSearch,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* --------------------------------------------------------------- KPI config */

interface KpiConfig {
  status: TicketStatus;
  icon: LucideIcon;
  /** Tailwind classes for the icon chip (tint + text color). */
  chipClass: string;
}

const KPI_CARDS: KpiConfig[] = [
  {
    status: TICKET_STAGE_ORDER[0],
    icon: Inbox,
    chipClass: "bg-stage-diterima-bg text-stage-diterima",
  },
  {
    status: TICKET_STAGE_ORDER[1],
    icon: PackageSearch,
    chipClass: "bg-stage-diagnosa-bg text-stage-diagnosa",
  },
  {
    status: TICKET_STAGE_ORDER[2],
    icon: CalendarClock,
    chipClass: "bg-stage-sparepart-bg text-stage-sparepart",
  },
  {
    status: TICKET_STAGE_ORDER[3],
    icon: Wrench,
    chipClass: "bg-stage-dikerjakan-bg text-stage-dikerjakan",
  },
  {
    status: TICKET_STAGE_ORDER[4],
    icon: CheckCircle2,
    chipClass: "bg-stage-selesai-bg text-stage-selesai",
  },
  {
    status: TICKET_STAGE_ORDER[5],
    icon: Banknote,
    chipClass: "bg-stage-diambil-bg text-stage-diambil",
  },
];

/* ------------------------------------------------------------- sub-components */

function KpiCard({ config, count }: { config: KpiConfig; count: bigint }) {
  const meta = STAGE_META[config.status];
  const Icon = config.icon;
  return (
    <Card
      className="gap-0 overflow-hidden rounded-lg border-border shadow-subtle transition-smooth hover:shadow-elevated"
      data-ocid={`dashboard.kpi.${config.status}`}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${config.chipClass}`}
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {meta.label}
          </p>
          <p className="font-tabular text-2xl font-bold leading-tight text-foreground">
            {count.toString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card className="gap-0 rounded-lg border-border shadow-subtle">
      <CardContent className="flex items-center gap-3 p-4">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-10" />
        </div>
      </CardContent>
    </Card>
  );
}

function AttentionRow({
  ticket,
  index,
}: {
  ticket: AttentionTicket;
  index: number;
}) {
  return (
    <li
      className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
      data-ocid={`dashboard.attention.item.${index + 1}`}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {ticket.ticketNumber}
          </span>
          <StatusBadge status={ticket.status} />
          {ticket.overdue ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
              <AlertTriangle className="size-3" aria-hidden="true" />
              Terlambat
            </span>
          ) : null}
        </div>
        <p className="truncate text-sm font-medium text-foreground">
          {ticket.customerName}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDueLabel(ticket.estimatedCompletionDate)}
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="shrink-0 self-start sm:self-auto"
      >
        <Link
          to="/tiket/$ticketId"
          params={{ ticketId: ticket.id.toString() }}
          data-ocid={`dashboard.attention.link.${index + 1}`}
        >
          Lihat tiket
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </li>
  );
}

function AttentionSkeleton() {
  const ids = Array.from({ length: 3 }, (_, i) => `attention-skeleton-${i}`);
  return (
    <ul className="divide-y divide-border">
      {ids.map((id) => (
        <li key={id} className="flex items-center justify-between px-4 py-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------------- page */

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  const counts = data?.counts;
  const attention = data?.attention ?? [];

  return (
    <div className="space-y-6" data-ocid="dashboard.page">
      <PageHeader
        title="Dashboard"
        description="Ringkasan tiket servis dan pendapatan toko hari ini."
      />

      {/* KPI cards ------------------------------------------------------- */}
      <section
        aria-label="Ringkasan tiket per status"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        data-ocid="dashboard.kpi.section"
      >
        {isLoading || !counts
          ? Array.from({ length: 6 }, (_, i) => `kpi-skeleton-${i}`).map(
              (id) => <KpiSkeleton key={id} />,
            )
          : KPI_CARDS.map((config) => (
              <KpiCard
                key={config.status}
                config={config}
                count={counts[config.status]}
              />
            ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attention list ------------------------------------------------ */}
        <Card
          className="gap-0 overflow-hidden rounded-lg border-border shadow-subtle lg:col-span-2"
          data-ocid="dashboard.attention.card"
        >
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle
                className="size-5 text-warning"
                aria-hidden="true"
              />
              Perlu Perhatian
            </CardTitle>
            <CardDescription>
              Tiket yang menunggu sparepart atau sudah melewati estimasi
              selesai.
            </CardDescription>
          </CardHeader>

          {isLoading ? (
            <AttentionSkeleton />
          ) : isError ? (
            <div
              className="flex flex-col items-center gap-3 px-4 py-10 text-center"
              data-ocid="dashboard.attention.error_state"
            >
              <AlertTriangle
                className="size-8 text-destructive"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">
                Gagal memuat daftar tiket. Coba lagi.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                data-ocid="dashboard.attention.retry_button"
              >
                Coba lagi
              </Button>
            </div>
          ) : attention.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 px-4 py-12 text-center"
              data-ocid="dashboard.attention.empty_state"
            >
              <CheckCircle2
                className="size-9 text-success"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-foreground">
                Semua tiket terkendali
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Tidak ada tiket yang menunggu sparepart atau melewati estimasi
                selesai saat ini.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {attention.map((ticket, index) => (
                <AttentionRow
                  key={ticket.id.toString()}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </ul>
          )}
        </Card>

        {/* Revenue card -------------------------------------------------- */}
        <Card
          className="gap-0 overflow-hidden rounded-lg border-border shadow-subtle"
          data-ocid="dashboard.revenue.card"
        >
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Banknote className="size-5 text-success" aria-hidden="true" />
              Total Pendapatan
            </CardTitle>
            <CardDescription>
              Akumulasi dari tiket yang sudah diambil.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading || !data ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            ) : (
              <div className="space-y-2">
                <p
                  className="font-tabular text-3xl font-bold tracking-tight text-foreground"
                  data-ocid="dashboard.revenue.value"
                >
                  {formatRupiah(data.totalRevenue)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {counts ? counts.diambil.toString() : "0"} tiket telah diambil
                  pelanggan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
