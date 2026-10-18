import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddTechnicianNote,
  useChangeTicketStatus,
  useDeleteTicket,
  useTicket,
} from "@/hooks/useQueries";
import { formatDateTime, formatDueLabel, formatRupiah } from "@/lib/format";
import {
  STAGE_META,
  TICKET_STAGE_ORDER,
  type Ticket,
  type TicketStatus,
  isTicketLocked,
  nextStage,
} from "@/types";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  History,
  MessageSquarePlus,
  Package,
  Pencil,
  Phone,
  Smartphone,
  Trash2,
  User,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

/* ------------------------------------------------------------- info helpers */

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p
          className={`mt-0.5 break-words text-sm font-medium text-foreground ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- status control */

function StatusControl({ ticket }: { ticket: Ticket }) {
  const changeStatus = useChangeTicketStatus();
  const [note, setNote] = useState("");
  const locked = isTicketLocked(ticket.status);
  const target = nextStage(ticket.status);
  const targetMeta = target ? STAGE_META[target] : null;

  function handleAdvance() {
    if (!target) return;
    const captured = note.trim();
    setNote("");
    changeStatus.mutate(
      { id: ticket.id, status: target, note: captured },
      {
        onSuccess: () => {
          toast.success(`Status diperbarui ke ${STAGE_META[target].label}.`);
        },
        onError: () => {
          setNote((current) => (current === "" ? captured : current));
          toast.error("Gagal memperbarui status tiket.");
        },
      },
    );
  }

  return (
    <Card
      className="gap-0 overflow-hidden rounded-lg border-border shadow-subtle"
      data-ocid="ticket.status.card"
    >
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRight className="size-5 text-primary" aria-hidden="true" />
          Alur Status Servis
        </CardTitle>
        <CardDescription>
          Tahapan servis berjalan berurutan dari Diterima hingga Diambil.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-5">
        {/* Stage rail */}
        <ol
          className="flex flex-wrap items-center gap-1.5"
          aria-label="Tahapan servis"
        >
          {TICKET_STAGE_ORDER.map((stage, index) => {
            const meta = STAGE_META[stage];
            const currentIndex = TICKET_STAGE_ORDER.indexOf(ticket.status);
            const done = index < currentIndex;
            const active = index === currentIndex;
            return (
              <li key={stage} className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    active
                      ? meta.badgeClass
                      : done
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted/60 text-muted-foreground/70"
                  }`}
                  data-ocid={`ticket.status.stage.${index + 1}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      active ? meta.dotClass : "bg-muted-foreground/40"
                    }`}
                    aria-hidden="true"
                  />
                  {meta.label}
                </span>
                {index < TICKET_STAGE_ORDER.length - 1 ? (
                  <span className="text-muted-foreground/40" aria-hidden="true">
                    ›
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>

        <Separator />

        {locked ? (
          <div
            className="flex items-start gap-3 rounded-md bg-stage-diambil-bg p-3"
            data-ocid="ticket.status.locked_state"
          >
            <CheckCircle2
              className="mt-0.5 size-5 shrink-0 text-stage-diambil"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Tiket sudah diambil
              </p>
              <p className="text-sm text-muted-foreground">
                Perangkat telah diserahkan ke pelanggan. Status tiket tidak
                dapat diubah lagi.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="status-note"
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Catatan perubahan status (opsional)
              </label>
              <Textarea
                id="status-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Contoh: LCD pengganti sudah terpasang dan diuji."
                rows={2}
                data-ocid="ticket.status.note_input"
              />
            </div>
            <Button
              type="button"
              onClick={handleAdvance}
              disabled={changeStatus.isPending || !target}
              data-ocid="ticket.status.advance_button"
              className="w-full sm:w-auto"
            >
              {changeStatus.isPending ? (
                "Menyimpan…"
              ) : (
                <>
                  Lanjut ke {targetMeta?.label}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------------- history timeline */

function StatusTimeline({ ticket }: { ticket: Ticket }) {
  const entries = [...ticket.statusHistory].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0,
  );

  return (
    <Card
      className="gap-0 overflow-hidden rounded-lg border-border shadow-subtle"
      data-ocid="ticket.history.card"
    >
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="size-5 text-primary" aria-hidden="true" />
          Riwayat Status
        </CardTitle>
        <CardDescription>
          Setiap perubahan status tercatat lengkap dengan waktu dan catatan.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-5">
        {entries.length === 0 ? (
          <p
            className="py-6 text-center text-sm text-muted-foreground"
            data-ocid="ticket.history.empty_state"
          >
            Belum ada riwayat perubahan status.
          </p>
        ) : (
          <ol className="relative space-y-5" data-ocid="ticket.history.list">
            {entries.map((entry, index) => {
              const meta = STAGE_META[entry.status];
              return (
                <li
                  key={`${entry.status}-${entry.timestamp.toString()}`}
                  className="relative flex gap-3 pl-1"
                  data-ocid={`ticket.history.item.${index + 1}`}
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1 size-2.5 shrink-0 rounded-full ${meta.dotClass}`}
                      aria-hidden="true"
                    />
                    {index < entries.length - 1 ? (
                      <span
                        className="mt-1 w-px flex-1 bg-border"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={entry.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(entry.timestamp)}
                      </span>
                    </div>
                    {entry.note.trim() !== "" ? (
                      <p className="mt-1.5 text-sm text-foreground">
                        {entry.note}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------------- technician notes */

function TechnicianNotes({ ticket }: { ticket: Ticket }) {
  const addNote = useAddTechnicianNote();
  const [draft, setDraft] = useState("");
  const notes = [...ticket.technicianNotes].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const captured = draft.trim();
    if (captured === "") return;
    setDraft("");
    addNote.mutate(
      { id: ticket.id, note: captured },
      {
        onSuccess: () => {
          toast.success("Catatan teknisi ditambahkan.");
        },
        onError: () => {
          setDraft((current) => (current === "" ? captured : current));
          toast.error("Gagal menambahkan catatan.");
        },
      },
    );
  }

  return (
    <Card
      className="gap-0 overflow-hidden rounded-lg border-border shadow-subtle"
      data-ocid="ticket.notes.card"
    >
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="size-5 text-primary" aria-hidden="true" />
          Catatan Teknisi
        </CardTitle>
        <CardDescription>
          Catatan internal pengerjaan perangkat, tidak terlihat oleh pelanggan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-5">
        <form onSubmit={handleSubmit} className="space-y-2">
          <label
            htmlFor="technician-note"
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Catatan baru
          </label>
          <Textarea
            id="technician-note"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Tulis temuan atau tindakan yang dilakukan pada perangkat."
            rows={3}
            data-ocid="ticket.notes.input"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={addNote.isPending || draft.trim() === ""}
              data-ocid="ticket.notes.submit_button"
            >
              <MessageSquarePlus className="size-4" aria-hidden="true" />
              {addNote.isPending ? "Menyimpan…" : "Tambah catatan"}
            </Button>
          </div>
        </form>

        <Separator />

        {notes.length === 0 ? (
          <p
            className="py-4 text-center text-sm text-muted-foreground"
            data-ocid="ticket.notes.empty_state"
          >
            Belum ada catatan teknisi untuk tiket ini.
          </p>
        ) : (
          <ul className="space-y-3" data-ocid="ticket.notes.list">
            {notes.map((entry, index) => (
              <li
                key={entry.timestamp.toString()}
                className="rounded-md border border-border bg-muted/40 p-3"
                data-ocid={`ticket.notes.item.${index + 1}`}
              >
                <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                  {entry.note}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3" aria-hidden="true" />
                  {formatDateTime(entry.timestamp)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------------------- page states */

function DetailSkeleton() {
  return (
    <div className="space-y-6" data-ocid="ticket.loading_state">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- page */

export function TicketDetailPage() {
  const { ticketId } = useParams({ from: "/app/tiket/$ticketId" });
  const navigate = useNavigate();
  const id = (() => {
    try {
      return BigInt(ticketId);
    } catch {
      return null;
    }
  })();

  const { data: ticket, isLoading, isError, refetch } = useTicket(id);
  const deleteTicket = useDeleteTicket();

  function handleDelete() {
    if (!ticket) return;
    deleteTicket.mutate(ticket.id, {
      onSuccess: () => {
        toast.success("Tiket berhasil dihapus.");
        void navigate({ to: "/tiket", search: { q: "", status: "semua" } });
      },
      onError: () => {
        toast.error("Gagal menghapus tiket.");
      },
    });
  }

  if (isLoading) return <DetailSkeleton />;

  if (isError || !ticket) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
        data-ocid="ticket.error_state"
      >
        <AlertTriangle className="size-9 text-destructive" aria-hidden="true" />
        <p className="text-base font-semibold text-foreground">
          Tiket tidak ditemukan
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Tiket yang Anda cari mungkin sudah dihapus atau tautannya tidak valid.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            data-ocid="ticket.retry_button"
          >
            Coba lagi
          </Button>
          <Button asChild size="sm">
            <Link
              to="/tiket"
              search={{ q: "", status: "semua" }}
              data-ocid="ticket.back_button"
            >
              Kembali ke daftar tiket
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const locked = isTicketLocked(ticket.status);

  return (
    <div className="space-y-6" data-ocid="ticket.page">
      <PageHeader
        title={ticket.ticketNumber}
        description={`Tiket servis untuk ${ticket.customerName}.`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link
                to="/tiket"
                search={{ q: "", status: "semua" }}
                data-ocid="ticket.back_button"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Kembali
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link
                to="/tiket/$ticketId/ubah"
                params={{ ticketId: ticket.id.toString() }}
                data-ocid="ticket.edit_button"
              >
                <Pencil className="size-4" aria-hidden="true" />
                Ubah
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  data-ocid="ticket.delete_button"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="ticket.delete_dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus tiket ini?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tiket {ticket.ticketNumber} beserta seluruh riwayat status
                    dan catatan teknisi akan dihapus permanen. Tindakan ini
                    tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="ticket.delete_cancel_button">
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteTicket.isPending}
                    data-ocid="ticket.delete_confirm_button"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteTicket.isPending ? "Menghapus…" : "Ya, hapus tiket"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        }
      />

      {/* Status summary bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-subtle">
        <StatusBadge status={ticket.status} className="text-sm" />
        <span className="text-sm text-muted-foreground">
          {locked
            ? "Perangkat telah diambil pelanggan."
            : `Tahap berikutnya: ${STAGE_META[nextStage(ticket.status) ?? ticket.status].label}`}
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          Diperbarui {formatDateTime(ticket.updatedAt)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column --------------------------------------------------- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Device + complaint */}
          <Card
            className="gap-0 overflow-hidden rounded-lg border-border shadow-subtle"
            data-ocid="ticket.device.card"
          >
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                Perangkat & Keluhan
              </CardTitle>
              <CardDescription>
                Data perangkat yang diterima dan keluhan pelanggan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-5">
              <div className="grid gap-x-6 sm:grid-cols-2">
                <InfoRow
                  icon={<Smartphone className="size-4" />}
                  label="Merek"
                  value={ticket.device.brand}
                />
                <InfoRow
                  icon={<Smartphone className="size-4" />}
                  label="Model"
                  value={ticket.device.model}
                />
                <InfoRow
                  icon={<Package className="size-4" />}
                  label="Warna"
                  value={ticket.device.color}
                />
                <InfoRow
                  icon={<ClipboardList className="size-4" />}
                  label="IMEI"
                  value={ticket.device.imei}
                  mono
                />
              </div>

              <Separator className="my-3" />

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Keluhan
                </p>
                <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                  {ticket.complaint}
                </p>
              </div>

              <Separator className="my-3" />

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Kelengkapan yang dititipkan
                </p>
                {ticket.accessories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada kelengkapan yang dititipkan.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {ticket.accessories.map((item) => (
                      <li
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        <Package className="size-3" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          <StatusControl ticket={ticket} />
          <StatusTimeline ticket={ticket} />
        </div>

        {/* Right column -------------------------------------------------- */}
        <div className="space-y-6">
          {/* Customer */}
          <Card
            className="gap-0 overflow-hidden rounded-lg border-border shadow-subtle"
            data-ocid="ticket.customer.card"
          >
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="size-5 text-primary" aria-hidden="true" />
                Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Nama
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {ticket.customerName}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Telepon
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 font-mono text-sm font-medium text-foreground">
                  <Phone className="size-3.5" aria-hidden="true" />
                  {ticket.customerPhone}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link
                  to="/pelanggan/$customerId"
                  params={{ customerId: ticket.customerId.toString() }}
                  data-ocid="ticket.customer.link"
                >
                  <User className="size-4" aria-hidden="true" />
                  Lihat profil pelanggan
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Cost + schedule */}
          <Card
            className="gap-0 overflow-hidden rounded-lg border-border shadow-subtle"
            data-ocid="ticket.cost.card"
          >
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                Biaya & Jadwal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Estimasi biaya
                </p>
                <p
                  className="mt-0.5 font-tabular text-2xl font-bold tracking-tight text-foreground"
                  data-ocid="ticket.cost.value"
                >
                  {formatRupiah(ticket.estimatedCost)}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Estimasi selesai
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {formatDateTime(ticket.estimatedCompletionDate)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDueLabel(ticket.estimatedCompletionDate)}
                </p>
              </div>
              <Separator />
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center justify-between gap-2">
                  <span>Dibuat</span>
                  <span className="font-medium text-foreground">
                    {formatDateTime(ticket.createdAt)}
                  </span>
                </p>
                <p className="flex items-center justify-between gap-2">
                  <span>Diperbarui</span>
                  <span className="font-medium text-foreground">
                    {formatDateTime(ticket.updatedAt)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <TechnicianNotes ticket={ticket} />
        </div>
      </div>
    </div>
  );
}
