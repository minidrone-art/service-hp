import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateTicket,
  useTicket,
  useUpdateTicket,
} from "@/hooks/useQueries";
import { formatDate, formatRupiah, timestampToDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { isTicketLocked } from "@/types";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarIcon,
  Check,
  Loader2,
  Lock,
  Plus,
  Save,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ helpers */

/** Parse a user-typed Rupiah string ("1.250.000", "Rp 1.250.000") into a bigint. */
function parseRupiah(value: string): bigint {
  const digits = value.replace(/[^\d]/g, "");
  if (digits === "") return 0n;
  return BigInt(digits);
}

/** Format a numeric string with Indonesian thousands separators for display. */
function formatThousands(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (digits === "") return "";
  return new Intl.NumberFormat("id-ID").format(BigInt(digits));
}

/** Convert a JS Date to a nanosecond bigint timestamp at local midnight. */
function dateToTimestamp(date: Date): bigint {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  return BigInt(midnight.getTime()) * 1_000_000n;
}

interface AccessoryItem {
  id: string;
  label: string;
}

interface FormState {
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  deviceColor: string;
  imei: string;
  complaint: string;
  accessories: AccessoryItem[];
  estimatedCost: string;
  estimatedCompletionDate: Date | undefined;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  customerName: "",
  customerPhone: "",
  deviceBrand: "",
  deviceModel: "",
  deviceColor: "",
  imei: "",
  complaint: "",
  accessories: [],
  estimatedCost: "",
  estimatedCompletionDate: undefined,
};

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.customerName.trim() === "")
    errors.customerName = "Nama pelanggan wajib diisi.";
  if (form.customerPhone.trim() === "")
    errors.customerPhone = "Nomor HP pelanggan wajib diisi.";
  if (form.deviceBrand.trim() === "")
    errors.deviceBrand = "Merek perangkat wajib diisi.";
  if (form.deviceModel.trim() === "")
    errors.deviceModel = "Model perangkat wajib diisi.";
  if (form.imei.trim() === "")
    errors.imei = "IMEI atau nomor seri wajib diisi.";
  if (form.complaint.trim() === "")
    errors.complaint = "Keluhan pelanggan wajib diisi.";
  if (form.estimatedCost.trim() === "")
    errors.estimatedCost = "Perkiraan biaya wajib diisi.";
  if (!form.estimatedCompletionDate)
    errors.estimatedCompletionDate = "Tanggal estimasi selesai wajib dipilih.";
  return errors;
}

/* ------------------------------------------------------------- sub-components */

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6" data-ocid="ticket_form.loading_state">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {Array.from({ length: 2 }, (_, i) => `form-skeleton-${i}`).map(
            (id) => (
              <Card key={id} className="rounded-lg border-border shadow-subtle">
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ),
          )}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- page */

export function TicketFormPage() {
  const params = useParams({ strict: false }) as { ticketId?: string };
  const ticketId = params.ticketId ?? null;
  const isEdit = ticketId !== null;

  const navigate = useNavigate();
  const ticketQuery = useTicket(isEdit ? BigInt(ticketId) : null);
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [accessoryDraft, setAccessoryDraft] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const initializedRef = useRef(false);

  const ticket = ticketQuery.data ?? null;
  const locked = ticket ? isTicketLocked(ticket.status) : false;

  // One-time initialization of the draft from the loaded ticket (edit mode).
  useEffect(() => {
    if (!isEdit || initializedRef.current || !ticket) return;
    initializedRef.current = true;
    setForm({
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone,
      deviceBrand: ticket.device.brand,
      deviceModel: ticket.device.model,
      deviceColor: ticket.device.color,
      imei: ticket.device.imei,
      complaint: ticket.complaint,
      accessories: ticket.accessories.map((label, index) => ({
        id: `existing-${index}`,
        label,
      })),
      estimatedCost: formatThousands(ticket.estimatedCost.toString()),
      estimatedCompletionDate:
        timestampToDate(ticket.estimatedCompletionDate) ?? undefined,
    });
  }, [isEdit, ticket]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function addAccessory() {
    const value = accessoryDraft.trim();
    if (value === "") return;
    setForm((prev) => ({
      ...prev,
      accessories: [
        ...prev.accessories,
        { id: `new-${Date.now()}-${prev.accessories.length}`, label: value },
      ],
    }));
    setAccessoryDraft("");
  }

  function removeAccessory(id: string) {
    setForm((prev) => ({
      ...prev,
      accessories: prev.accessories.filter((item) => item.id !== id),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const estimatedCompletionDate = dateToTimestamp(
      form.estimatedCompletionDate as Date,
    );
    const estimatedCost = parseRupiah(form.estimatedCost);

    if (isEdit && ticketId !== null) {
      updateTicket.mutate(
        {
          id: BigInt(ticketId),
          input: {
            customerName: form.customerName.trim(),
            customerPhone: form.customerPhone.trim(),
            deviceBrand: form.deviceBrand.trim(),
            deviceModel: form.deviceModel.trim(),
            deviceColor: form.deviceColor.trim(),
            imei: form.imei.trim(),
            complaint: form.complaint.trim(),
            accessories: form.accessories.map((item) => item.label),
            estimatedCost,
            estimatedCompletionDate,
          },
        },
        {
          onSuccess: (result) => {
            if (result.__kind__ === "err") {
              setSubmitError(
                "Tiket gagal diperbarui. Periksa kembali data yang diisi.",
              );
              return;
            }
            void navigate({
              to: "/tiket/$ticketId",
              params: { ticketId },
            });
          },
          onError: () => {
            setSubmitError(
              "Terjadi kesalahan saat menyimpan perubahan. Coba lagi.",
            );
          },
        },
      );
      return;
    }

    createTicket.mutate(
      {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        deviceBrand: form.deviceBrand.trim(),
        deviceModel: form.deviceModel.trim(),
        deviceColor: form.deviceColor.trim(),
        imei: form.imei.trim(),
        complaint: form.complaint.trim(),
        accessories: form.accessories.map((item) => item.label),
        estimatedCost,
        estimatedCompletionDate,
      },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "err") {
            setSubmitError(
              "Tiket gagal dibuat. Periksa kembali data yang diisi.",
            );
            return;
          }
          void navigate({
            to: "/tiket/$ticketId",
            params: { ticketId: result.ok.id.toString() },
          });
        },
        onError: () => {
          setSubmitError("Terjadi kesalahan saat membuat tiket. Coba lagi.");
        },
      },
    );
  }

  const isPending = createTicket.isPending || updateTicket.isPending;

  if (isEdit && ticketQuery.isLoading) {
    return <FormSkeleton />;
  }

  if (isEdit && (ticketQuery.isError || (!ticketQuery.isLoading && !ticket))) {
    return (
      <div className="space-y-6" data-ocid="ticket_form.page">
        <PageHeader
          title="Ubah Tiket"
          description="Perbarui data tiket servis."
        />
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
          data-ocid="ticket_form.error_state"
        >
          <AlertTriangle
            className="size-8 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-foreground">
            Tiket tidak ditemukan atau gagal dimuat.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void ticketQuery.refetch()}
            data-ocid="ticket_form.retry_button"
          >
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  const title = isEdit ? "Ubah Tiket" : "Tiket Baru";
  const description = isEdit
    ? "Perbarui data perangkat, keluhan, dan estimasi servis."
    : "Catat intake perangkat pelanggan untuk memulai alur servis.";

  return (
    <div className="space-y-6" data-ocid="ticket_form.page">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              isEdit && ticketId !== null
                ? void navigate({
                    to: "/tiket/$ticketId",
                    params: { ticketId },
                  })
                : void navigate({
                    to: "/tiket",
                    search: { q: "", status: "semua" },
                  })
            }
            data-ocid="ticket_form.back_button"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali
          </Button>
        }
      />

      {locked ? (
        <Alert
          className="border-warning/40 bg-warning/10"
          data-ocid="ticket_form.locked_notice"
        >
          <Lock className="text-warning" aria-hidden="true" />
          <AlertTitle>Tiket sudah diambil</AlertTitle>
          <AlertDescription>
            Perangkat telah diserahkan ke pelanggan. Tiket yang sudah diambil
            tidak dapat diubah lagi.
          </AlertDescription>
        </Alert>
      ) : null}

      {isEdit && ticket ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle">
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {ticket.ticketNumber}
          </span>
          <StatusBadge status={ticket.status} />
          <span className="text-xs text-muted-foreground">
            Dibuat {formatDate(ticket.createdAt)}
          </span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Customer ---------------------------------------------------- */}
            <Card
              className="rounded-lg border-border shadow-subtle"
              data-ocid="ticket_form.customer_card"
            >
              <CardHeader>
                <CardTitle className="text-lg">Data Pelanggan</CardTitle>
                <CardDescription>
                  Kontak yang dapat dihubungi terkait servis perangkat.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nama pelanggan</Label>
                  <Input
                    id="customerName"
                    value={form.customerName}
                    onChange={(e) => update("customerName", e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    disabled={locked}
                    aria-invalid={!!errors.customerName}
                    aria-describedby={
                      errors.customerName ? "customerName-error" : undefined
                    }
                    data-ocid="ticket_form.customer_name_input"
                  />
                  <FieldError
                    id="customerName-error"
                    message={errors.customerName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Nomor HP</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    inputMode="tel"
                    value={form.customerPhone}
                    onChange={(e) => update("customerPhone", e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    disabled={locked}
                    aria-invalid={!!errors.customerPhone}
                    aria-describedby={
                      errors.customerPhone ? "customerPhone-error" : undefined
                    }
                    data-ocid="ticket_form.customer_phone_input"
                  />
                  <FieldError
                    id="customerPhone-error"
                    message={errors.customerPhone}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Device ------------------------------------------------------ */}
            <Card
              className="rounded-lg border-border shadow-subtle"
              data-ocid="ticket_form.device_card"
            >
              <CardHeader>
                <CardTitle className="text-lg">Data Perangkat</CardTitle>
                <CardDescription>
                  Identitas perangkat yang diterima untuk diservis.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deviceBrand">Merek</Label>
                  <Input
                    id="deviceBrand"
                    value={form.deviceBrand}
                    onChange={(e) => update("deviceBrand", e.target.value)}
                    placeholder="Contoh: Samsung"
                    disabled={locked}
                    aria-invalid={!!errors.deviceBrand}
                    aria-describedby={
                      errors.deviceBrand ? "deviceBrand-error" : undefined
                    }
                    data-ocid="ticket_form.device_brand_input"
                  />
                  <FieldError
                    id="deviceBrand-error"
                    message={errors.deviceBrand}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceModel">Model</Label>
                  <Input
                    id="deviceModel"
                    value={form.deviceModel}
                    onChange={(e) => update("deviceModel", e.target.value)}
                    placeholder="Contoh: Galaxy A54"
                    disabled={locked}
                    aria-invalid={!!errors.deviceModel}
                    aria-describedby={
                      errors.deviceModel ? "deviceModel-error" : undefined
                    }
                    data-ocid="ticket_form.device_model_input"
                  />
                  <FieldError
                    id="deviceModel-error"
                    message={errors.deviceModel}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceColor">Warna</Label>
                  <Input
                    id="deviceColor"
                    value={form.deviceColor}
                    onChange={(e) => update("deviceColor", e.target.value)}
                    placeholder="Contoh: Hitam"
                    disabled={locked}
                    data-ocid="ticket_form.device_color_input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imei">IMEI / Nomor seri</Label>
                  <Input
                    id="imei"
                    value={form.imei}
                    onChange={(e) => update("imei", e.target.value)}
                    placeholder="Contoh: 356938035643809"
                    disabled={locked}
                    className="font-mono"
                    aria-invalid={!!errors.imei}
                    aria-describedby={errors.imei ? "imei-error" : undefined}
                    data-ocid="ticket_form.imei_input"
                  />
                  <FieldError id="imei-error" message={errors.imei} />
                </div>
              </CardContent>
            </Card>

            {/* Complaint --------------------------------------------------- */}
            <Card
              className="rounded-lg border-border shadow-subtle"
              data-ocid="ticket_form.complaint_card"
            >
              <CardHeader>
                <CardTitle className="text-lg">Keluhan & Kelengkapan</CardTitle>
                <CardDescription>
                  Deskripsi masalah dan barang bawaan yang ditinggal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="complaint">Keluhan pelanggan</Label>
                  <Textarea
                    id="complaint"
                    value={form.complaint}
                    onChange={(e) => update("complaint", e.target.value)}
                    placeholder="Contoh: Layar retak dan sentuhan tidak responsif setelah terjatuh."
                    rows={4}
                    disabled={locked}
                    aria-invalid={!!errors.complaint}
                    aria-describedby={
                      errors.complaint ? "complaint-error" : undefined
                    }
                    data-ocid="ticket_form.complaint_textarea"
                  />
                  <FieldError id="complaint-error" message={errors.complaint} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessoryDraft">
                    Kelengkapan yang ditinggal
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="accessoryDraft"
                      value={accessoryDraft}
                      onChange={(e) => setAccessoryDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAccessory();
                        }
                      }}
                      placeholder="Contoh: Charger, casing, SIM card"
                      disabled={locked}
                      data-ocid="ticket_form.accessory_input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAccessory}
                      disabled={locked || accessoryDraft.trim() === ""}
                      data-ocid="ticket_form.add_accessory_button"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Tambah
                    </Button>
                  </div>
                  {form.accessories.length === 0 ? (
                    <p
                      className="text-xs text-muted-foreground"
                      data-ocid="ticket_form.accessory_empty_state"
                    >
                      Belum ada kelengkapan yang dicatat.
                    </p>
                  ) : (
                    <ul
                      className="flex flex-wrap gap-2"
                      data-ocid="ticket_form.accessory_list"
                    >
                      {form.accessories.map((item, index) => (
                        <li
                          key={item.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                          data-ocid={`ticket_form.accessory_item.${index + 1}`}
                        >
                          {item.label}
                          {!locked ? (
                            <button
                              type="button"
                              onClick={() => removeAccessory(item.id)}
                              aria-label={`Hapus kelengkapan ${item.label}`}
                              className="rounded-full text-muted-foreground transition-smooth hover:text-destructive"
                              data-ocid={`ticket_form.remove_accessory_button.${index + 1}`}
                            >
                              <X className="size-3.5" aria-hidden="true" />
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estimate sidebar --------------------------------------------- */}
          <div className="space-y-6">
            <Card
              className="rounded-lg border-border shadow-subtle lg:sticky lg:top-24"
              data-ocid="ticket_form.estimate_card"
            >
              <CardHeader>
                <CardTitle className="text-lg">Estimasi Servis</CardTitle>
                <CardDescription>
                  Perkiraan biaya dan tanggal penyelesaian.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Perkiraan biaya (Rp)</Label>
                  <Input
                    id="estimatedCost"
                    inputMode="numeric"
                    value={form.estimatedCost}
                    onChange={(e) =>
                      update("estimatedCost", formatThousands(e.target.value))
                    }
                    placeholder="Contoh: 350.000"
                    disabled={locked}
                    className="font-tabular"
                    aria-invalid={!!errors.estimatedCost}
                    aria-describedby={
                      errors.estimatedCost ? "estimatedCost-error" : undefined
                    }
                    data-ocid="ticket_form.estimated_cost_input"
                  />
                  <FieldError
                    id="estimatedCost-error"
                    message={errors.estimatedCost}
                  />
                  {form.estimatedCost.trim() !== "" && !errors.estimatedCost ? (
                    <p className="text-xs text-muted-foreground">
                      {formatRupiah(parseRupiah(form.estimatedCost))}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedCompletionDate">
                    Estimasi selesai
                  </Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="estimatedCompletionDate"
                        type="button"
                        variant="outline"
                        disabled={locked}
                        aria-invalid={!!errors.estimatedCompletionDate}
                        aria-describedby={
                          errors.estimatedCompletionDate
                            ? "estimatedCompletionDate-error"
                            : undefined
                        }
                        data-ocid="ticket_form.estimated_date_button"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.estimatedCompletionDate &&
                            "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="size-4" aria-hidden="true" />
                        {form.estimatedCompletionDate
                          ? formatDate(
                              dateToTimestamp(form.estimatedCompletionDate),
                            )
                          : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.estimatedCompletionDate}
                        onSelect={(date) => {
                          update("estimatedCompletionDate", date ?? undefined);
                          setDateOpen(false);
                        }}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldError
                    id="estimatedCompletionDate-error"
                    message={errors.estimatedCompletionDate}
                  />
                </div>

                {submitError ? (
                  <Alert
                    variant="destructive"
                    data-ocid="ticket_form.submit_error_state"
                  >
                    <AlertTriangle aria-hidden="true" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}

                {!locked ? (
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      data-ocid="ticket_form.submit_button"
                    >
                      {isPending ? (
                        <>
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                          Menyimpan…
                        </>
                      ) : (
                        <>
                          {isEdit ? (
                            <Save className="size-4" aria-hidden="true" />
                          ) : (
                            <Check className="size-4" aria-hidden="true" />
                          )}
                          {isEdit ? "Simpan Perubahan" : "Buat Tiket"}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() =>
                        isEdit && ticketId !== null
                          ? void navigate({
                              to: "/tiket/$ticketId",
                              params: { ticketId },
                            })
                          : void navigate({
                              to: "/tiket",
                              search: { q: "", status: "semua" },
                            })
                      }
                      data-ocid="ticket_form.cancel_button"
                    >
                      Batal
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
