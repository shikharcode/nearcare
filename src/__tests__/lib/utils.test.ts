import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { cn, formatDate, moodLabel, moodEmoji, energyLabel, today } from "@/lib/utils"

describe("cn()", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes — truthy condition included", () => {
    expect(cn("base", true && "active")).toBe("base active")
  })

  it("handles conditional classes — falsy condition excluded", () => {
    expect(cn("base", false && "active")).toBe("base")
  })

  it("handles undefined values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar")
  })

  it("handles null values", () => {
    expect(cn("foo", null, "bar")).toBe("foo bar")
  })

  it("resolves Tailwind padding conflict — last padding wins (p-2)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2")
  })

  it("resolves Tailwind text color conflict — last wins", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })

  it("handles object syntax for conditional classes", () => {
    expect(cn({ hidden: false, block: true })).toBe("block")
  })

  it("returns empty string when no inputs", () => {
    expect(cn()).toBe("")
  })
})

describe("formatDate()", () => {
  it("formats a string date '2026-08-15' to 'Aug 15, 2026'", () => {
    expect(formatDate("2026-08-15")).toBe("Aug 15, 2026")
  })

  it("formats a Date object correctly", () => {
    // Use UTC midnight to avoid timezone offset shifting the day
    const d = new Date("2024-01-05T00:00:00")
    expect(formatDate(d)).toBe("Jan 5, 2024")
  })

  it("formats a string date '2023-12-31' to 'Dec 31, 2023'", () => {
    expect(formatDate("2023-12-31")).toBe("Dec 31, 2023")
  })

  it("formats a single-digit day without leading zero", () => {
    expect(formatDate("2026-03-01")).toBe("Mar 1, 2026")
  })
})

describe("moodLabel()", () => {
  it("1 returns 'Terrible'", () => {
    expect(moodLabel(1)).toBe("Terrible")
  })

  it("2 returns 'Bad'", () => {
    expect(moodLabel(2)).toBe("Bad")
  })

  it("3 returns 'Okay'", () => {
    expect(moodLabel(3)).toBe("Okay")
  })

  it("4 returns 'Good'", () => {
    expect(moodLabel(4)).toBe("Good")
  })

  it("5 returns 'Great'", () => {
    expect(moodLabel(5)).toBe("Great")
  })

  it("0 returns 'Unknown'", () => {
    expect(moodLabel(0)).toBe("Unknown")
  })

  it("6 returns 'Unknown'", () => {
    expect(moodLabel(6)).toBe("Unknown")
  })

  it("-1 returns 'Unknown'", () => {
    expect(moodLabel(-1)).toBe("Unknown")
  })
})

describe("moodEmoji()", () => {
  it("1 returns '😞'", () => {
    expect(moodEmoji(1)).toBe("😞")
  })

  it("2 returns '😕'", () => {
    expect(moodEmoji(2)).toBe("😕")
  })

  it("3 returns '😐'", () => {
    expect(moodEmoji(3)).toBe("😐")
  })

  it("4 returns '🙂'", () => {
    expect(moodEmoji(4)).toBe("🙂")
  })

  it("5 returns '😄'", () => {
    expect(moodEmoji(5)).toBe("😄")
  })

  it("0 returns '❓'", () => {
    expect(moodEmoji(0)).toBe("❓")
  })

  it("6 returns '❓'", () => {
    expect(moodEmoji(6)).toBe("❓")
  })

  it("-1 returns '❓'", () => {
    expect(moodEmoji(-1)).toBe("❓")
  })
})

describe("energyLabel()", () => {
  it("1 returns 'Exhausted'", () => {
    expect(energyLabel(1)).toBe("Exhausted")
  })

  it("2 returns 'Low'", () => {
    expect(energyLabel(2)).toBe("Low")
  })

  it("3 returns 'Normal'", () => {
    expect(energyLabel(3)).toBe("Normal")
  })

  it("4 returns 'Good'", () => {
    expect(energyLabel(4)).toBe("Good")
  })

  it("5 returns 'High'", () => {
    expect(energyLabel(5)).toBe("High")
  })

  it("0 returns 'Unknown'", () => {
    expect(energyLabel(0)).toBe("Unknown")
  })

  it("6 returns 'Unknown'", () => {
    expect(energyLabel(6)).toBe("Unknown")
  })
})

describe("today()", () => {
  beforeEach(() => {
    // Fix Date to 2026-08-15 so the test is deterministic
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns a string in YYYY-MM-DD format", () => {
    const result = today()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("returns the current date as a valid date string", () => {
    const result = today()
    const parsed = new Date(result)
    expect(isNaN(parsed.getTime())).toBe(false)
  })

  it("returns the mocked date '2026-08-15'", () => {
    expect(today()).toBe("2026-08-15")
  })
})
