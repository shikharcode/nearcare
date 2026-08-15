"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn, today } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  isActive: boolean;
};

type ExistingLog = {
  id: string;
  date: string;
  mood?: number | null;
  painLevel?: number | null;
};

// ── Constants ────────────────────────────────────────────────────────────────

const MOOD_OPTIONS = [
  {
    value: 1,
    emoji: "😞",
    label: "Terrible",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.45)",
    bg: "from-red-50 via-rose-50 to-white dark:from-red-950/40 dark:via-rose-950/30 dark:to-gray-950",
    ring: "ring-red-400",
    selectedBg: "bg-red-50 dark:bg-red-900/30",
    selectedBorder: "border-red-400",
  },
  {
    value: 2,
    emoji: "😕",
    label: "Bad",
    color: "#f97316",
    glow: "rgba(249,115,22,0.45)",
    bg: "from-orange-50 via-amber-50 to-white dark:from-orange-950/40 dark:via-amber-950/30 dark:to-gray-950",
    ring: "ring-orange-400",
    selectedBg: "bg-orange-50 dark:bg-orange-900/30",
    selectedBorder: "border-orange-400",
  },
  {
    value: 3,
    emoji: "😐",
    label: "Okay",
    color: "#eab308",
    glow: "rgba(234,179,8,0.45)",
    bg: "from-yellow-50 via-lime-50 to-white dark:from-yellow-950/40 dark:via-lime-950/30 dark:to-gray-950",
    ring: "ring-yellow-400",
    selectedBg: "bg-yellow-50 dark:bg-yellow-900/30",
    selectedBorder: "border-yellow-400",
  },
  {
    value: 4,
    emoji: "🙂",
    label: "Good",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.45)",
    bg: "from-green-50 via-emerald-50 to-white dark:from-green-950/40 dark:via-emerald-950/30 dark:to-gray-950",
    ring: "ring-green-400",
    selectedBg: "bg-green-50 dark:bg-green-900/30",
    selectedBorder: "border-green-400",
  },
  {
    value: 5,
    emoji: "😄",
    label: "Great",
    color: "#2563eb",
    glow: "rgba(37,99,235,0.45)",
    bg: "from-blue-50 via-indigo-50 to-white dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-gray-950",
    ring: "ring-blue-400",
    selectedBg: "bg-blue-50 dark:bg-blue-900/30",
    selectedBorder: "border-blue-400",
  },
];

const PAIN_OPTIONS = [
  {
    label: "None",
    value: 0,
    emoji: "✅",
    description: "Feeling good",
    gradient: "from-emerald-500 to-green-400",
    shadow: "shadow-emerald-200 dark:shadow-emerald-900/50",
    ring: "focus-visible:ring-emerald-400",
  },
  {
    label: "Mild",
    value: 3,
    emoji: "🟡",
    description: "Slight discomfort",
    gradient: "from-yellow-400 to-amber-300",
    shadow: "shadow-yellow-200 dark:shadow-yellow-900/50",
    ring: "focus-visible:ring-yellow-400",
  },
  {
    label: "Moderate",
    value: 6,
    emoji: "🟠",
    description: "Noticeable pain",
    gradient: "from-orange-500 to-amber-400",
    shadow: "shadow-orange-200 dark:shadow-orange-900/50",
    ring: "focus-visible:ring-orange-400",
  },
  {
    label: "Severe",
    value: 9,
    emoji: "🔴",
    description: "Significant pain",
    gradient: "from-red-600 to-rose-500",
    shadow: "shadow-red-200 dark:shadow-red-900/50",
    ring: "focus-visible:ring-red-400",
  },
];

const MOOD_LABELS: Record<number, string> = {
  1: "Terrible", 2: "Bad", 3: "Okay", 4: "Good", 5: "Great",
};

const MOOD_EMOJIS: Record<number, string> = {
  1: "😞", 2: "😕", 3: "😐", 4: "🙂", 5: "😄",
};

const PAIN_LABELS: Record<number, string> = {
  0: "No pain", 3: "Mild pain", 6: "Moderate pain", 9: "Severe pain",
};

const PAIN_EMOJIS: Record<number, string> = {
  0: "✅", 3: "🟡", 6: "🟠", 9: "🔴",
};

// ── Progress Dots ─────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="relative flex items-center">
            <div
              className={cn(
                "rounded-full transition-all duration-500 ease-out",
                s === step
                  ? "w-8 h-3 bg-blue-600"
                  : s < step
                  ? "w-3 h-3 bg-blue-400"
                  : "w-3 h-3 bg-gray-300 dark:bg-gray-600"
              )}
            />
          </div>
        ))}
      </div>
      <p className="text-base font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase" style={{ fontSize: "14px" }}>
        Step {step} of 3
      </p>
    </div>
  );
}

// ── Step 1: Mood ──────────────────────────────────────────────────────────────

function StepMood({
  onSelect,
  selectedMood,
}: {
  onSelect: (mood: number) => void;
  selectedMood: number | null;
}) {
  const activeMood = selectedMood
    ? MOOD_OPTIONS.find((m) => m.value === selectedMood)
    : null;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
          How are you feeling today?
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Tap your mood to continue
        </p>
      </div>

      <div className="flex justify-center gap-3 w-full flex-wrap">
        {MOOD_OPTIONS.map(({ value, emoji, label, glow, ring, selectedBorder, selectedBg }) => {
          const isSelected = selectedMood === value;
          return (
            <button
              key={value}
              onClick={() => onSelect(value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-3xl border-2 transition-all duration-200",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
                "active:scale-95",
                isSelected
                  ? cn("scale-110 border-2", selectedBorder, selectedBg, ring)
                  : "border-transparent bg-white dark:bg-gray-800 hover:scale-105 hover:border-gray-200 dark:hover:border-gray-600 shadow-lg hover:shadow-xl"
              )}
              style={{
                width: 96,
                height: 120,
                paddingTop: 16,
                paddingBottom: 12,
                boxShadow: isSelected
                  ? `0 0 0 4px ${glow}, 0 8px 24px ${glow}`
                  : undefined,
              }}
              aria-label={label}
              aria-pressed={isSelected}
            >
              <span style={{ fontSize: "52px", lineHeight: 1 }}>{emoji}</span>
              <span
                className={cn(
                  "font-semibold transition-colors",
                  isSelected ? "text-gray-900 dark:text-gray-50" : "text-gray-600 dark:text-gray-300"
                )}
                style={{ fontSize: "14px" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {activeMood && (
        <div
          className={cn(
            "w-full rounded-2xl p-4 text-center transition-all duration-300",
            activeMood.selectedBg,
            "border-2",
            activeMood.selectedBorder
          )}
        >
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            You selected: <span className="font-bold">{activeMood.label}</span>
          </p>
          <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
            Tap again or continue to the next step
          </p>
        </div>
      )}
    </div>
  );
}

// ── Step 2: Pain ──────────────────────────────────────────────────────────────

function StepPain({
  onSelect,
  onBack,
}: {
  onSelect: (pain: number) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
          Any pain today?
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          How much discomfort are you feeling right now?
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {PAIN_OPTIONS.map(({ label, value, emoji, description, gradient, shadow, ring }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={cn(
              "w-full flex items-center gap-5 px-6 rounded-2xl text-white font-bold",
              "bg-gradient-to-r",
              gradient,
              "shadow-lg",
              shadow,
              "hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
              "transition-all duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
              ring
            )}
            style={{ height: 80 }}
          >
            <span style={{ fontSize: "36px", lineHeight: 1 }}>{emoji}</span>
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold leading-tight">{label}</span>
              <span className="text-sm font-normal opacity-90">{description}</span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-lg text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-semibold transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>
    </div>
  );
}

// ── Step 3: Medications ───────────────────────────────────────────────────────

function StepMedications({
  medications,
  loading,
  checked,
  onToggle,
  onDone,
  onSkip,
  onBack,
  submitting,
}: {
  medications: Medication[];
  loading: boolean;
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
  onDone: () => void;
  onSkip: () => void;
  onBack: () => void;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
          Did you take your meds?
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Check off each medication you have taken
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 w-full">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full h-20 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full">
          {medications.map((med) => {
            const isChecked = !!checked[med.id];
            return (
              <button
                key={med.id}
                onClick={() => onToggle(med.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 rounded-2xl border-2 text-left",
                  "transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400",
                  "active:scale-[0.98]",
                  isChecked
                    ? "border-emerald-400 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 shadow-md shadow-emerald-100 dark:shadow-emerald-900/30"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 shadow-md hover:shadow-lg"
                )}
                style={{ height: 80 }}
                aria-pressed={isChecked}
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    "flex items-center justify-center rounded-lg shrink-0 transition-all duration-200",
                    isChecked
                      ? "bg-emerald-500 shadow-md shadow-emerald-200 dark:shadow-emerald-900/50"
                      : "bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600"
                  )}
                  style={{ width: 28, height: 28 }}
                >
                  {isChecked && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Med info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-xl font-bold leading-tight truncate",
                      isChecked ? "text-emerald-800 dark:text-emerald-200" : "text-gray-900 dark:text-gray-50"
                    )}
                  >
                    {med.name}
                  </p>
                  {med.dosage && (
                    <p
                      className={cn(
                        "text-base truncate",
                        isChecked ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {med.dosage}
                    </p>
                  )}
                </div>

                {isChecked && (
                  <span className="text-emerald-500 shrink-0" style={{ fontSize: "24px" }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!loading && medications.length > 0 && (
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onDone}
            disabled={submitting}
            className={cn(
              "w-full rounded-2xl text-xl font-bold text-white shadow-lg",
              "bg-gradient-to-r from-blue-600 to-blue-500",
              "hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:scale-[1.02]",
              "active:scale-[0.98] transition-all duration-150",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400",
              submitting && "opacity-60 cursor-not-allowed pointer-events-none"
            )}
            style={{ height: 56 }}
          >
            {submitting ? "Saving…" : "Done"}
          </button>
          <button
            onClick={onSkip}
            disabled={submitting}
            className="w-full rounded-2xl text-lg font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            style={{ height: 48 }}
          >
            Skip medications
          </button>
        </div>
      )}

      {!loading && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-lg text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-semibold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
      )}
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────

function SuccessScreen({
  onViewHealth,
  mood,
  pain,
  medsTakenCount,
}: {
  onViewHealth: () => void;
  mood: number | null;
  pain: number | null;
  medsTakenCount: number;
}) {
  const moodOpt = mood ? MOOD_OPTIONS.find((m) => m.value === mood) : null;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto text-center">
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg) scale(1);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(900deg) scale(0.5); opacity: 0; }
        }
        @keyframes success-pop {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          80%  { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes success-pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes fade-up {
          0%   { transform: translateY(24px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .confetti-piece {
          position: fixed;
          border-radius: 3px;
          animation: confetti-fall linear forwards;
          pointer-events: none;
          z-index: 50;
        }
        .success-icon-wrap {
          animation: success-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .success-pulse-ring {
          position: absolute;
          inset: -8px;
          border-radius: 9999px;
          border: 3px solid #22c55e;
          animation: success-pulse-ring 1.2s ease-out 0.4s infinite;
        }
        .fade-up-1 { animation: fade-up 0.5s ease-out 0.6s both; }
        .fade-up-2 { animation: fade-up 0.5s ease-out 0.75s both; }
        .fade-up-3 { animation: fade-up 0.5s ease-out 0.9s both; }
        .fade-up-4 { animation: fade-up 0.5s ease-out 1.05s both; }
      `}</style>

      {/* Confetti */}
      {Array.from({ length: 32 }).map((_, i) => {
        const colors = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];
        const size = 8 + (i % 4) * 4;
        const shapes = [2, 50, 0];
        return (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${(i / 32) * 105 - 2}%`,
              top: "-20px",
              width: size,
              height: size,
              backgroundColor: colors[i % colors.length],
              borderRadius: shapes[i % 3],
              animationDelay: `${(i * 0.06).toFixed(2)}s`,
              animationDuration: `${2.0 + (i % 5) * 0.3}s`,
            }}
          />
        );
      })}

      {/* Big check circle */}
      <div className="relative mt-8 success-icon-wrap">
        <div className="success-pulse-ring" />
        <div
          className="flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-2xl shadow-emerald-300 dark:shadow-emerald-900/60"
          style={{ width: 120, height: 120 }}
        >
          <svg
            className="text-white"
            style={{ width: 64, height: 64 }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div className="fade-up-1 flex flex-col gap-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50">
          All done! 🎉
        </h1>
        <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
          Great job taking care of yourself.
        </p>
      </div>

      {/* What was logged */}
      <div className="fade-up-2 w-full flex flex-col gap-3">
        {/* Mood */}
        {mood !== null && moodOpt && (
          <div className={cn(
            "w-full rounded-2xl p-4 flex items-center gap-4",
            moodOpt.selectedBg,
            "border-2",
            moodOpt.selectedBorder
          )}>
            <span style={{ fontSize: "36px", lineHeight: 1 }}>{MOOD_EMOJIS[mood]}</span>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mood logged</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-50">{MOOD_LABELS[mood]}</p>
            </div>
          </div>
        )}

        {/* Pain */}
        {pain !== null && (
          <div className="w-full rounded-2xl p-4 flex items-center gap-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
            <span style={{ fontSize: "36px", lineHeight: 1 }}>{PAIN_EMOJIS[pain] ?? "🩺"}</span>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pain level</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-50">{PAIN_LABELS[pain] ?? `Level ${pain}`}</p>
            </div>
          </div>
        )}

        {/* Meds */}
        <div className="w-full rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <span style={{ fontSize: "24px" }}>💊</span>
          </div>
          <div className="text-left">
            <p className="text-base font-semibold text-gray-900 dark:text-gray-50">Medications</p>
            <p className="text-base text-gray-500 dark:text-gray-400">
              {medsTakenCount > 0
                ? `${medsTakenCount} med${medsTakenCount === 1 ? "" : "s"} marked taken`
                : "No meds marked taken"}
            </p>
          </div>
        </div>
      </div>

      <div className="fade-up-4 w-full">
        <button
          onClick={onViewHealth}
          className={cn(
            "h-14 w-full rounded-2xl text-xl font-bold text-white shadow-xl",
            "bg-gradient-to-r from-blue-600 to-blue-500",
            "hover:from-blue-700 hover:to-blue-600 hover:shadow-2xl hover:scale-[1.02]",
            "active:scale-[0.98] transition-all duration-150",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
          )}
        >
          View Dashboard
        </button>
      </div>
    </div>
  );
}

// ── Already Checked In ────────────────────────────────────────────────────────

function AlreadyCheckedIn({
  log,
  medCount,
  onViewHealth,
}: {
  log: ExistingLog;
  medCount: number;
  onViewHealth: () => void;
}) {
  const moodNum = log.mood ?? 0;
  const painNum = log.painLevel ?? -1;
  const moodOpt = MOOD_OPTIONS.find((m) => m.value === moodNum);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto text-center">
      <div
        className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-xl shadow-blue-200 dark:shadow-blue-900/50 mt-4"
        style={{ width: 88, height: 88 }}
      >
        <svg
          className="text-white"
          style={{ width: 48, height: 48 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Already checked in!
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
          Here&apos;s what you logged today
        </p>
      </div>

      <div className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 flex flex-col gap-5">
        {moodNum > 0 && (
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-2xl",
            moodOpt?.selectedBg ?? "bg-gray-50 dark:bg-gray-700/50"
          )}>
            <span style={{ fontSize: "48px", lineHeight: 1 }}>
              {MOOD_EMOJIS[moodNum] ?? "❓"}
            </span>
            <div className="text-left">
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium">Mood</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {MOOD_LABELS[moodNum] ?? "Unknown"}
              </p>
            </div>
          </div>
        )}
        {painNum >= 0 && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
            <span style={{ fontSize: "48px", lineHeight: 1 }}>
              {PAIN_EMOJIS[painNum] ?? "🩺"}
            </span>
            <div className="text-left">
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium">Pain level</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {PAIN_LABELS[painNum] ?? `Level ${painNum}`}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
          <span style={{ fontSize: "48px", lineHeight: 1 }}>💊</span>
          <div className="text-left">
            <p className="text-base text-gray-500 dark:text-gray-400 font-medium">Medications</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {medCount > 0
                ? `${medCount} med${medCount === 1 ? "" : "s"} marked taken`
                : "No meds recorded"}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onViewHealth}
        className={cn(
          "h-14 w-full rounded-2xl text-xl font-bold text-white shadow-xl",
          "bg-gradient-to-r from-blue-600 to-blue-500",
          "hover:from-blue-700 hover:to-blue-600 hover:shadow-2xl hover:scale-[1.02]",
          "active:scale-[0.98] transition-all duration-150",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
        )}
      >
        View Dashboard
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CheckInPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check-in data
  const [mood, setMood] = useState<number | null>(null);
  const [pain, setPain] = useState<number | null>(null);
  const [checkedMeds, setCheckedMeds] = useState<Record<string, boolean>>({});

  // Medications
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medsLoading, setMedsLoading] = useState(true);

  // Already checked in today
  const [existingLog, setExistingLog] = useState<ExistingLog | null>(null);
  const [existingMedCount, setExistingMedCount] = useState(0);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Track meds taken count for success screen
  const [medsTakenCount, setMedsTakenCount] = useState(0);

  // Check for existing log on mount
  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/health-logs?limit=1");
        if (!res.ok) return;
        const logs: ExistingLog[] = await res.json();
        const todayStr = today();
        const todayLog = logs.find((l) => l.date === todayStr);
        if (todayLog) {
          setExistingLog(todayLog);
          // Try to fetch med count for today
          try {
            const medRes = await fetch("/api/medications/log?date=" + todayStr);
            if (medRes.ok) {
              const medLogs: { taken: boolean }[] = await medRes.json();
              setExistingMedCount(medLogs.filter((ml) => ml.taken).length);
            }
          } catch {
            // ignore, just show 0
          }
        }
      } catch {
        // ignore — let user proceed
      } finally {
        setCheckingExisting(false);
      }
    }
    checkExisting();
  }, []);

  // Fetch medications when reaching step 3
  useEffect(() => {
    if (step !== 3) return;
    async function fetchMeds() {
      setMedsLoading(true);
      try {
        const res = await fetch("/api/medications");
        if (!res.ok) throw new Error("Failed");
        const all: Medication[] = await res.json();
        const active = all.filter((m) => m.isActive);
        setMedications(active);
        // If no active meds, skip directly to submission
        if (active.length === 0) {
          handleSubmit(true);
        }
      } catch {
        setMedications([]);
        // On error, skip meds step
        handleSubmit(true);
      } finally {
        setMedsLoading(false);
      }
    }
    fetchMeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleMoodSelect = useCallback((value: number) => {
    setMood(value);
    // Short delay so user sees the selected state before advancing
    setTimeout(() => setStep(2), 350);
  }, []);

  const handlePainSelect = useCallback((value: number) => {
    setPain(value);
    setStep(3);
  }, []);

  const toggleMed = useCallback((id: string) => {
    setCheckedMeds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSubmit = useCallback(async (skipMeds = false) => {
    setSubmitting(true);
    try {
      // POST health log
      await fetch("/api/health-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: mood ?? undefined,
          painLevel: pain ?? undefined,
          date: today(),
        }),
      });

      // POST medication logs for checked meds
      if (!skipMeds) {
        const takenIds = Object.entries(checkedMeds)
          .filter(([, v]) => v)
          .map(([id]) => id);

        setMedsTakenCount(takenIds.length);

        await Promise.all(
          takenIds.map((medicationId) =>
            fetch("/api/medications/log", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ medicationId, taken: true, date: today() }),
            })
          )
        );
      } else {
        setMedsTakenCount(0);
      }

      setDone(true);
    } catch {
      // Still show success — don't block user
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }, [mood, pain, checkedMeds]);

  const goToDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  // Derive background gradient from selected mood
  const moodBg = mood
    ? MOOD_OPTIONS.find((m) => m.value === mood)?.bg
    : "from-slate-50 via-blue-50/30 to-white dark:from-gray-950 dark:via-blue-950/20 dark:to-gray-950";

  // ── Loading ────────────────────────────────────────────────────────────────
  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/30 animate-pulse" />
          <p className="text-xl text-gray-400 dark:text-gray-500 animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Already checked in ────────────────────────────────────────────────────
  if (existingLog && !done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-start justify-center px-5 py-10">
        <AlreadyCheckedIn log={existingLog} medCount={existingMedCount} onViewHealth={goToDashboard} />
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-start justify-center px-5 py-10 overflow-hidden">
        <SuccessScreen
          onViewHealth={goToDashboard}
          mood={mood}
          pain={pain}
          medsTakenCount={medsTakenCount}
        />
      </div>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b transition-all duration-700",
        moodBg ?? "from-slate-50 via-blue-50/30 to-white dark:from-gray-950 dark:via-blue-950/20 dark:to-gray-950"
      )}
    >
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 gap-10">
        {/* Progress */}
        <div className="w-full max-w-lg flex justify-center">
          <ProgressDots step={step} />
        </div>

        {/* Step content */}
        <div className="w-full max-w-lg flex-1 flex items-center justify-center">
          <div className="w-full">
            {step === 1 && (
              <StepMood
                onSelect={handleMoodSelect}
                selectedMood={mood}
              />
            )}

            {step === 2 && (
              <StepPain
                onSelect={handlePainSelect}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <StepMedications
                medications={medications}
                loading={medsLoading}
                checked={checkedMeds}
                onToggle={toggleMed}
                onDone={() => handleSubmit(false)}
                onSkip={() => handleSubmit(true)}
                onBack={() => setStep(2)}
                submitting={submitting}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
