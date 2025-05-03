import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names using clsx and optimizes them with tailwind-merge
 * This utility helps avoid Tailwind CSS conflicts when using dynamic classNames
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 