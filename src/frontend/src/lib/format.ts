const RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * Motoko `Time.now()` values are nanosecond bigints. Convert through this
 * helper before any JavaScript Date operation.
 */
export function timestampToDate(
  timestamp: bigint | null | undefined,
): Date | null {
  if (timestamp === null || timestamp === undefined) return null;
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a backend timestamp as `15 Okt 2023`. */
export function formatDate(timestamp: bigint | null | undefined): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** Format a backend timestamp as `15 Okt 2023, 14.30`. */
export function formatDateTime(timestamp: bigint | null | undefined): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(timestamp)}, ${hours}.${minutes}`;
}

/** Format a bigint amount as `Rp 1.250.000`. */
export function formatRupiah(
  amount: bigint | number | null | undefined,
): string {
  if (amount === null || amount === undefined) return "—";
  const value = typeof amount === "bigint" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "—";
  return RUPIAH.format(value);
}

/** Relative day distance used for "mendekati / melewati estimasi" hints. */
export function daysUntil(timestamp: bigint | null | undefined): number | null {
  const date = timestampToDate(timestamp);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** Human label for an estimated completion date relative to today. */
export function formatDueLabel(timestamp: bigint | null | undefined): string {
  const days = daysUntil(timestamp);
  if (days === null) return "Tanpa estimasi";
  if (days < 0) return `Terlambat ${Math.abs(days)} hari`;
  if (days === 0) return "Jatuh tempo hari ini";
  if (days === 1) return "Jatuh tempo besok";
  return `${days} hari lagi`;
}

/** Initials for avatar fallbacks, e.g. "Budi Santoso" → "BS". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
