'use client'

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Settings2 } from "lucide-react";
import Link from "next/link";

// ── Metric definitions ────────────────────────────────────────────────────────

type MetricKey =
  | "bloodPressure"
  | "heartRate"
  | "bloodSugar"
  | "weight"
  | "temperature"
  | "spo2"
  | "sleep"
  | "steps"
  | "water"
  | "exercise"
  | "calories"
  | "painLevel"
  | "moodEnergy";

interface Metric {
  key: MetricKey;
  icon: string;
  name: string;
  description: string;
}

const ALL_METRICS: Metric[] = [
  { key: "bloodPressure", icon: "🩺", name: "Blood Pressure", description: "Systolic & diastolic" },
  { key: "heartRate",     icon: "❤️",  name: "Heart Rate",    description: "Beats per minute" },
  { key: "bloodSugar",   icon: "🩸", name: "Blood Sugar",   description: "mg/dL — for diabetes" },
  { key: "weight",       icon: "⚖️",  name: "Weight",        description: "Track weight changes" },
  { key: "temperature",  icon: "🌡️", name: "Temperature",   description: "Body temperature" },
  { key: "spo2",         icon: "💨", name: "SpO2",          description: "Blood oxygen level" },
  { key: "sleep",        icon: "😴", name: "Sleep",         description: "Hours of sleep" },
  { key: "steps",        icon: "👟", name: "Steps",         description: "Daily step count" },
  { key: "water",        icon: "💧", name: "Water",         description: "Water intake" },
  { key: "exercise",     icon: "🏃", name: "Exercise",      description: "Activity minutes" },
  { key: "calories",     icon: "🔥", name: "Calories",      description: "Caloric intake" },
  { key: "painLevel",    icon: "😣", name: "Pain Level",    description: "Pain 0-10 scale" },
  { key: "moodEnergy",   icon: "😊", name: "Mood & Energy", description: "How you feel" },
];

const ALL_KEYS = ALL_METRICS.map(m => m.key);

// ── Preset bundles ─────────────────────────────────────────────────────────────

interface Bundle {
  label: string;
  emoji: string;
  keys: MetricKey[];
}

const BUNDLES: Bundle[] = [
  {
    label: "Diabetes Pack",
    emoji: "🩸",
    keys: ["bloodSugar", "weight", "bloodPressure", "steps"],
  },
  {
    label: "Heart Health Pack",
    emoji: "❤️",
    keys: ["bloodPressure", "heartRate", "weight", "spo2"],
  },
  {
    label: "Basic Pack",
    emoji: "🌿",
    keys: ["moodEnergy", "sleep", "water"],
  },
  {
    label: "Everything",
    emoji: "✨",
    keys: ALL_KEYS,
  },
];

const STORAGE_KEY = "nearcare_tracked_metrics";

// ── Page component ─────────────────────────────────────────────────────────────

export default function MetricsPage() {
  const [selected, setSelected] = useState<Set<MetricKey>>(new Set(ALL_KEYS));

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: MetricKey[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelected(new Set(parsed));
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const toggle = (key: MetricKey) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Don't allow deselecting all
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const applyBundle = (keys: MetricKey[]) => {
    setSelected(new Set(keys));
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selected)));
    toast.success("Preferences saved!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings2 className="h-5 w-5 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Metric Preferences</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Choose which vitals to track. Only your selected metrics will appear in the health log form.
          </p>
        </div>
        <Link
          href="/dashboard/health-log"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 font-medium"
        >
          Back to Health Log
        </Link>
      </div>

      {/* Preset bundles */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
          Quick Presets
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BUNDLES.map(bundle => {
            const isActive =
              bundle.keys.length === selected.size &&
              bundle.keys.every(k => selected.has(k));
            return (
              <button
                key={bundle.label}
                type="button"
                onClick={() => applyBundle(bundle.keys)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]",
                  isActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                    : "border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900"
                )}
              >
                <span className="text-xl">{bundle.emoji}</span>
                <span className="text-center leading-tight text-xs">{bundle.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
        <span className="text-xs text-gray-400 dark:text-gray-600 font-medium">
          or pick individually ({selected.size} of {ALL_METRICS.length} selected)
        </span>
        <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALL_METRICS.map(metric => {
          const isSelected = selected.has(metric.key);
          return (
            <button
              key={metric.key}
              type="button"
              onClick={() => toggle(metric.key)}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-sm"
                  : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700"
              )}
            >
              {/* Checkmark badge */}
              <span
                className={cn(
                  "absolute top-2.5 right-2.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>

              {/* Icon */}
              <span className="text-2xl leading-none">{metric.icon}</span>

              {/* Text */}
              <div className="pr-4">
                <p className={cn(
                  "text-sm font-semibold leading-tight",
                  isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-200"
                )}>
                  {metric.name}
                </p>
                <p className={cn(
                  "text-xs mt-0.5 leading-tight",
                  isSelected ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-600"
                )}>
                  {metric.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Save button */}
      <div className="sticky bottom-4 pt-2">
        <Button
          onClick={save}
          className="w-full h-12 text-base font-semibold shadow-lg"
        >
          Save Preferences ({selected.size} metric{selected.size !== 1 ? "s" : ""} selected)
        </Button>
      </div>
    </div>
  );
}
