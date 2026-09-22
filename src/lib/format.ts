import { format, parseISO, differenceInCalendarDays } from "date-fns";

export const fmtDate = (d?: string | null, f = "MMM d, yyyy") => (d ? format(parseISO(d), f) : "—");
export const fmtShort = (d?: string | null) => (d ? format(parseISO(d), "MMM d") : "—");
export const fmtMoney = (v?: number | null) => {
  if (v == null) return "—";
  const a = Math.abs(v), s = v < 0 ? "−" : "";
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(a >= 1e8 ? 0 : 1)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(0)}K`;
  return `${s}$${a.toFixed(0)}`;
};
export const fmtNum = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(v >= 1e5 ? 0 : 1)}K` : Math.round(v).toString());
export const fmtBytes = (b?: number | null) => (b == null ? "—" : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
export const daysUntil = (d?: string | null) => (d ? differenceInCalendarDays(parseISO(d), new Date()) : null);
