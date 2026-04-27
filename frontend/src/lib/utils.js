import { clsx } from "clsx";

/**
 * Merges class names together, filtering falsy values.
 * Equivalent to the shadcn `cn` utility (without tailwind-merge since we're not using Tailwind).
 */
export function cn(...inputs) {
  return clsx(inputs);
}
