function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export type DateOutputFormat = 'dd.MM.yyyy' | 'yyyy-MM-dd';

/**
 * Parses:
 * - ISO dates: "YYYY-MM-DD" (optionally with time)
 * - Custom: "YYYY M04 DD"
 * - Anything else supported by `new Date(value)`
 */
export function parseLooseDate(value: string): Date | null {
  if (!value) return null;

  // Custom "2026 M04 17"
  const m = value.match(/^(\d{4})\s+M(\d{2})\s+(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]); // 01-12
    const day = Number(m[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // ISO "YYYY-MM-DD..." (avoid timezone surprises by anchoring at noon UTC)
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateDisplay(value: string, format: DateOutputFormat = 'dd.MM.yyyy'): string {
  const d = parseLooseDate(value);
  if (!d) return value;

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  if (format === 'yyyy-MM-dd') return `${year}-${pad2(month)}-${pad2(day)}`;
  return `${pad2(day)}.${pad2(month)}.${year}`;
}

