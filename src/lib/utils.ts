import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMM d, yyyy")
}

export function today() {
  return format(new Date(), "yyyy-MM-dd")
}

export function moodLabel(mood: number) {
  return ["", "Terrible", "Bad", "Okay", "Good", "Great"][mood] || "Unknown"
}

export function moodEmoji(mood: number) {
  return ["", "😞", "😕", "😐", "🙂", "😄"][mood] || "❓"
}

export function energyLabel(energy: number) {
  return ["", "Exhausted", "Low", "Normal", "Good", "High"][energy] || "Unknown"
}
