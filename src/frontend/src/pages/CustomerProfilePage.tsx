import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerProfile, useDeviceHistory } from "@/hooks/useQueries";
import { formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CustomerDevice } from "@/types";
import { TicketStatus } from "@/types";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  Mail,
  MapPin,
  Phone,
  Smartphone,
  UserX,
} from "lucide-react";
import { useState } from "react";

/** Map a backend history status string onto the shared status badge enum. */
function toTicketStatus(status: string): TicketStatus | null {
  const values = Object.values(TicketStatus) as string[];
  return values.includes(status) ? (status as TicketStatus) : null;
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="break-words text-sm font-medium text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function DeviceHistory({ imei }: { imei: string }) {
  const history = useDeviceHistory(imei);
  const entries = history.data ?? [];

  if (history.isLoading) {
    return (
      <div
        className="space-y-2 px-4 pb-4"
        data-ocid="device.history.loading_state"
      >
        {Array.from({ length: 2 }, (_, i) => `history-skeleton-${i}`).map(
          (id) => (
            <Skeleton key={id} className="h-12 w-full" />
          ),
        )}
      </div>
    );
  }

  if (history.isError) {
    return (
      <div
        className="flex items-center justify-between gap-3 px-4 pb-4"
        data-ocid="device.history.error_state"
      >
        <p className="text-sm text-muted-foreground">
          Gagal memuat riwayat perbaikan.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void history.refetch()}
          data-ocid="device.history.retry_button"
        >
          Coba lagi
        </Button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p
        className="px-4 pb-4 text-sm text-muted-foreground"
        data-ocid="device.history.empty_state"
      >
        Belum ada riwayat perbaikan untuk perangkat ini.
      </p>
    );
  }

  return (
    <ul className="space-y-2 px-4 pb-4" data-ocid="device.history.list">
      {entries.map((entry, index) => {
        const status = toTicketStatus(entry.status);
        return (
          <li
            key={entry.ticketId.toString()}
            className="rounded-md border border-border bg-background p-3"
            data-ocid={`device.history.item.${index + 1}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to="/tiket/$ticketId"
                params={{ ticketId: entry.ticketId.toString() }}
                className="font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline"
                data-ocid={`device.history.ticket_link.${index + 1}`}
              >
                {entry.ticketNumber}
              </Link>
              <div className="flex items-center gap-2">
                {status ? <StatusBadge status={status} /> : null}
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
            </div>
            <p className="mt-1.5 text-sm text-foreground">{entry.complaint}</p>
          </li>
        );
      })}
    </ul>
  );
}

function DeviceCard({
  device,
  index,
}: {
  device: CustomerDevice;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `device-history-${device.id.toString()}`;

  return (
    <Card
      className="overflow-hidden rounded-lg border-border shadow-subtle"
      data-ocid={`device.card.${index + 1}`}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Smartphone className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {device.brand} {device.model}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {device.color} · IMEI {device.imei}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="shrink-0"
          data-ocid={`device.history_toggle.${index + 1}`}
        >
          Riwayat perbaikan
          <ChevronDown
            className={cn("size-4 transition-smooth", open && "rotate-180")}
            aria-hidden="true"
          />
        </Button>
      </div>
      {open ? (
        <div id={panelId} className="border-t border-border pt-4">
          <DeviceHistory imei={device.imei} />
        </div>
      ) : null}
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6" data-ocid="customer.profile.loading_state">
      <Skeleton className="h-9 w-40" />
      <Card className="rounded-lg border-border p-6 shadow-subtle">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </Card>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function CustomerProfilePage({
  customerId,
}: {
  customerId: bigint;
}) {
  const profile = useCustomerProfile(customerId);

  if (profile.isLoading) return <ProfileSkeleton />;

  if (profile.isError) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
        data-ocid="customer.profile.error_state"
      >
        <p className="text-sm font-medium text-foreground">
          Gagal memuat profil pelanggan.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void profile.refetch()}
          data-ocid="customer.profile.retry_button"
        >
          Coba lagi
        </Button>
      </div>
    );
  }

  if (!profile.data) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center"
        data-ocid="customer.profile.empty_state"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UserX className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Pelanggan tidak ditemukan
          </h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Data pelanggan ini tidak tersedia atau telah dihapus.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          data-ocid="customer.profile.back_button"
        >
          <Link to="/pelanggan">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke daftar pelanggan
          </Link>
        </Button>
      </div>
    );
  }

  const { customer, devices } = profile.data;

  return (
    <div className="space-y-6" data-ocid="customer.profile.page">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
      >
        <Link to="/pelanggan" data-ocid="customer.profile.back_link">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke daftar pelanggan
        </Link>
      </Button>

      <PageHeader
        title={customer.name}
        description={`Pelanggan sejak ${formatDate(customer.createdAt)}`}
      />

      <Card
        className="rounded-lg border-border p-6 shadow-subtle"
        data-ocid="customer.profile.contact_card"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar className="size-16 shrink-0">
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 gap-5 sm:grid-cols-2">
            <ContactRow icon={Phone} label="Nomor HP" value={customer.phone} />
            <ContactRow
              icon={Mail}
              label="Email"
              value={customer.email ?? "Belum diisi"}
            />
            <ContactRow
              icon={MapPin}
              label="Alamat"
              value={customer.address ?? "Belum diisi"}
            />
            <ContactRow
              icon={Smartphone}
              label="Terdaftar"
              value={formatDate(customer.createdAt)}
            />
          </div>
        </div>
      </Card>

      <section
        className="space-y-3"
        data-ocid="customer.profile.devices_section"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Perangkat
          </h2>
          <span className="text-xs text-muted-foreground">
            {devices.length} perangkat
          </span>
        </div>

        {devices.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center"
            data-ocid="customer.profile.devices_empty_state"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Smartphone className="size-5" aria-hidden="true" />
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">
              Belum ada perangkat terdaftar untuk pelanggan ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device, index) => (
              <DeviceCard
                key={device.id.toString()}
                device={device}
                index={index}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
