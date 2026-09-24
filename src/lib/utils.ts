import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a money amount for display. Accepts integer cents by default
 * (matching the database storage), or major units when `fromCents` is false.
 */
export function formatMoney(
  amount: number,
  currency = "USD",
  locale = "en-US",
  fromCents = true,
): string {
  const value = fromCents ? amount / 100 : amount;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

/** Truncate a string to a max length, adding an ellipsis when shortened. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

/** Join class names, dropping falsy values. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
