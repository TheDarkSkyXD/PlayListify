import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility for conditionally joining Tailwind CSS classes together
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 