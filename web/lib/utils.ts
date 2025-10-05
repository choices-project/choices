/**
 * Utility functions
 * 
 * This module provides common utility functions for the application.
 * It replaces the old @/shared/utils/lib/utils imports.
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}











