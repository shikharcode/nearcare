"use client"

import React from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormState = {
  mood: number | null
  painLevel: number | null
  systolic: string
  diastolic: string
  heartRate: string
  bloodSugar: string
  symptoms: string
  notes: string
}

// ---------------------------------------------------------------------------
// Mood picker options
// ---------------------------------------------------------------------------

const MOODS = [
  { value: 1, emoji: "😞", label: "Terrible" },
  { value: 2, emoji: "😕", label: "Bad" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
]

const defaultForm: FormState = {
  mood: null,
  painLevel: null,
  systolic: "",
  diastolic: "",
  heartRate: "",
  bloodSugar: "",
  symptoms: "",
  notes: "",
}

// ---------------------------------------------------------------------------
// CaregiverForm
// ---------------------------------------------------------------------------

export function CaregiverForm({
  patientName,
  token,
}: {
  patientName: string
  token: string
}) {
  const [form, setForm] = React.useState<FormState>(defaultForm)
  const [submitting, setSubmitting] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        mood: form.mood ?? undefined,
        painLevel: form.painLevel ?? undefined,
        symptoms: form.symptoms.trim() || undefined,
        notes: form.notes.trim() || undefined,
        heartRate: form.heartRate ? parseInt(form.heartRate) : undefined,
        systolic: form.systolic ? parseInt(form.systolic) : undefined,
        diastolic: form.diastolic ? parseInt(form.diastolic) : undefined,
        bloodSugar: form.bloodSugar ? parseFloat(form.bloodSugar) : undefined,
      }

      const res = await fetch(`/api/caregiver/${token}/health-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Failed to submit")
      }

      setSuccess(true)
      setForm(defaultForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-4xl">
          ✓
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Logged successfully for {patientName}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          The health reading has been recorded. Family contacts will be notified if any values are outside normal range.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          Log another reading
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Mood */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          How is {patientName} feeling?
        </h2>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setField("mood", m.value)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all min-w-[64px] flex-1",
                form.mood === m.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-sm"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Pain level */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Pain level{" "}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            (0 = none, 10 = severe)
          </span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setField("painLevel", n)}
              className={cn(
                "h-11 w-11 rounded-xl border-2 text-sm font-semibold transition-all",
                form.painLevel === n
                  ? n >= 7
                    ? "border-red-500 bg-red-500 text-white shadow-sm"
                    : n >= 4
                    ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                    : "border-green-500 bg-green-500 text-white shadow-sm"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {/* Vitals */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Key vitals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Blood pressure */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Blood Pressure (mmHg)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Systolic"
                value={form.systolic}
                onChange={(e) => setField("systolic", e.target.value)}
                min={50}
                max={250}
                className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 text-base text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <span className="text-gray-400 font-medium">/</span>
              <input
                type="number"
                placeholder="Diastolic"
                value={form.diastolic}
                onChange={(e) => setField("diastolic", e.target.value)}
                min={30}
                max={150}
                className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 text-base text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Heart rate */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Heart Rate (bpm)
            </p>
            <input
              type="number"
              placeholder="e.g. 72"
              value={form.heartRate}
              onChange={(e) => setField("heartRate", e.target.value)}
              min={30}
              max={220}
              className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 text-base text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Blood sugar */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:col-span-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Blood Sugar (mg/dL)
            </p>
            <input
              type="number"
              placeholder="e.g. 110"
              value={form.bloodSugar}
              onChange={(e) => setField("bloodSugar", e.target.value)}
              min={20}
              max={600}
              className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 text-base text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Symptoms */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Symptoms{" "}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(optional)</span>
        </h2>
        <input
          type="text"
          placeholder="e.g. headache, dizziness, shortness of breath"
          value={form.symptoms}
          onChange={(e) => setField("symptoms", e.target.value)}
          className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-base text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </section>

      {/* Notes */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Notes{" "}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(optional)</span>
        </h2>
        <textarea
          placeholder="Any additional observations or context..."
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-base text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
        />
      </section>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-semibold transition-colors shadow-sm"
      >
        {submitting ? "Saving…" : `Submit health log for ${patientName}`}
      </button>
    </form>
  )
}
