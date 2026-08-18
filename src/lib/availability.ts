/** Meal availability states shared by the customer app and every admin panel. */
export type AvailabilityStatus = "available" | "pending" | "unavailable";

export const AVAILABILITY_STATUSES: AvailabilityStatus[] = ["available", "pending", "unavailable"];

export const AVAILABILITY_META: Record<
  AvailabilityStatus,
  { label: string; short: string; hint: string; fg: string; bg: string; border: string }
> = {
  available: {
    label: "Available Now",
    short: "Available",
    hint: "On sale — customers can order it right away.",
    fg: "#065F46",
    bg: "rgba(16,185,129,0.15)",
    border: "rgba(16,185,129,0.5)",
  },
  pending: {
    label: "Pending — coming soon",
    short: "Pending",
    hint: "Shown to customers as coming soon, but not orderable yet.",
    fg: "#92400E",
    bg: "rgba(242,169,0,0.18)",
    border: "rgba(242,169,0,0.55)",
  },
  unavailable: {
    label: "Unavailable",
    short: "Unavailable",
    hint: "Hidden from customers until you turn it back on.",
    fg: "#991B1B",
    bg: "rgba(220,38,38,0.15)",
    border: "rgba(220,38,38,0.45)",
  },
};

export function toStatus(value: unknown, isAvailable?: boolean): AvailabilityStatus {
  if (value === "available" || value === "pending" || value === "unavailable") return value;
  return isAvailable ? "available" : "unavailable";
}
