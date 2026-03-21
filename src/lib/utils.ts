import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function calculateCancellationDate(): Date {
    const now = new Date();
    const year = now.getFullYear();
    // 3 month notice period to the end of the year
    // If we are before Oct 1, cancellation happens at the end of current year
    let targetYear = year;
    if (now.getMonth() > 8) { // > September (0-indexed month 8)
        targetYear++;
    }
    return new Date(targetYear, 11, 31); // Dec 31
}
