'use client'

import { useState, useEffect, useRef, KeyboardEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { today, formatDate, moodEmoji, moodLabel, energyLabel, cn } from "@/lib/utils";
import { Activity, Heart, Droplets, Footprints, Flame, Thermometer, Wind, TrendingUp, Trash2, X, Calendar, SlidersHorizontal, Sparkles, Moon, Zap } from "lucide-react";
import { VoiceInput } from "@/components/shared/voice-input";
import { subDays, format, parseISO, isValid } from "date-fns";
import Link from "next/link";

// ── Metric filtering (from metric picker page) ────────────────────────────────

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

const METRICS_STORAGE_KEY = "nearcare_tracked_metrics";

function useTrackedMetrics(): Set<MetricKey> | null {
  const [metrics, setMetrics] = useState<Set<MetricKey> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(METRICS_STORAGE_KEY);
      if (stored) {
        const parsed: MetricKey[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMetrics(new Set(parsed));
          return;
        }
      }
    } catch {
      // ignore parse errors — fall back to show all
    }
    setMetrics(null); // null = show all
  }, []);

  return metrics;
}

const schema = z.object({
  sleep: z.coerce.number().min(0).max(24).optional(),
  water: z.coerce.number().min(0).max(20).optional(),
  exercise: z.coerce.number().min(0).optional(),
  steps: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  heartRate: z.coerce.number().min(0).optional(),
  systolic: z.coerce.number().min(0).optional(),
  diastolic: z.coerce.number().min(0).optional(),
  bloodSugar: z.coerce.number().min(0).optional(),
  temperature: z.coerce.number().min(0).optional(),
  oxygenSaturation: z.coerce.number().min(0).max(100).optional(),
  calories: z.coerce.number().min(0).optional(),
  painLevel: z.coerce.number().min(0).max(10).optional(),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type HealthLog = FormData & { id: string; date: string; mood?: number; energy?: number; createdAt?: string };

// ── helpers ──────────────────────────────────────────────────────────────────

function computeStreak(logs: HealthLog[]): number {
  if (logs.length === 0) return 0;
  const loggedDates = new Set(logs.map(l => l.date));
  let streak = 0;
  let cursor = today();
  while (loggedDates.has(cursor)) {
    streak++;
    const d = parseISO(cursor);
    cursor = format(subDays(d, 1), "yyyy-MM-dd");
  }
  return streak;
}

function last30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    days.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
  }
  return days;
}

function moodCellClass(mood: number | undefined): string {
  if (!mood) return "bg-gray-200 dark:bg-gray-700/60";
  return [
    "",
    "bg-red-400 dark:bg-red-500",
    "bg-orange-400 dark:bg-orange-500",
    "bg-yellow-400 dark:bg-yellow-400",
    "bg-green-400 dark:bg-green-500",
    "bg-emerald-500 dark:bg-emerald-400",
  ][mood] ?? "bg-gray-200 dark:bg-gray-700/60";
}

function weeklyAverages(logs: HealthLog[]) {
  const recent = logs.slice(0, 7);
  const avg = (field: keyof HealthLog) => {
    const vals = recent.map(l => Number(l[field])).filter(v => v > 0);
    if (vals.length === 0) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };
  return {
    sleep: avg("sleep"),
    water: avg("water"),
    exercise: avg("exercise"),
  };
}

function formatTime(createdAt: string | undefined): string {
  if (!createdAt) return "";
  try {
    const d = new Date(createdAt);
    if (!isValid(d)) return "";
    return format(d, "h:mm a");
  } catch {
    return "";
  }
}

// Group logs by date, preserving order
function groupByDate(logs: HealthLog[]): { date: string; entries: HealthLog[] }[] {
  const map = new Map<string, HealthLog[]>();
  for (const log of logs) {
    const existing = map.get(log.date);
    if (existing) {
      existing.push(log);
    } else {
      map.set(log.date, [log]);
    }
  }
  return Array.from(map.entries()).map(([date, entries]) => ({ date, entries }));
}

// Mood colors for selected state
function moodSelectedBg(mood: number): string {
  return [
    "",
    "bg-red-100 dark:bg-red-950 border-red-400 dark:border-red-600 shadow-red-200 dark:shadow-red-900",
    "bg-orange-100 dark:bg-orange-950 border-orange-400 dark:border-orange-600 shadow-orange-200 dark:shadow-orange-900",
    "bg-yellow-100 dark:bg-yellow-950 border-yellow-400 dark:border-yellow-600 shadow-yellow-200 dark:shadow-yellow-900",
    "bg-green-100 dark:bg-green-950 border-green-400 dark:border-green-600 shadow-green-200 dark:shadow-green-900",
    "bg-emerald-100 dark:bg-emerald-950 border-emerald-500 dark:border-emerald-500 shadow-emerald-200 dark:shadow-emerald-900",
  ][mood] ?? "";
}

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];

  const addTag = (raw: string) => {
    const trimmed = raw.trim().replace(/,+$/, "").trim();
    if (!trimmed) return;
    const next = [...tags, trimmed];
    onChange(next.join(", "));
    setInput("");
  };

  const removeTag = (idx: number) => {
    const next = tags.filter((_, i) => i !== idx);
    onChange(next.join(", "));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      className="min-h-[48px] flex flex-wrap gap-1.5 items-center border-2 border-input rounded-xl px-3 py-2 cursor-text bg-background focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full px-2.5 py-1 text-sm font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); removeTag(i); }}
            className="hover:text-blue-900 dark:hover:text-blue-100 focus:outline-none"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? "Type symptom, press Enter or comma…" : ""}
        className="flex-1 min-w-[140px] bg-transparent outline-none text-base placeholder:text-gray-400 dark:placeholder:text-gray-600"
      />
    </div>
  );
}

// ── Calendar heatmap ──────────────────────────────────────────────────────────

function CalendarHeatmap({ logs }: { logs: HealthLog[] }) {
  const [tooltip, setTooltip] = useState<{ date: string; mood: number | undefined } | null>(null);
  const byDate = new Map<string, number | undefined>();
  // Keep the best mood per date (highest = most recent positive entry)
  for (const l of logs) {
    if (!byDate.has(l.date) || (l.mood && l.mood > (byDate.get(l.date) ?? 0))) {
      byDate.set(l.date, l.mood ?? undefined);
    }
  }
  const days = last30Days();

  // Pad to align first day to correct day-of-week (0=Sun)
  const firstDow = new Date(days[0] + "T00:00:00").getDay();
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...days];
  // Add trailing pads to complete the last row
  const trailing = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < trailing; i++) cells.push(null);

  const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="relative">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1">
        {DOW_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="w-8 h-8" />;
          const mood = byDate.get(day);
          const dayNum = parseInt(day.split("-")[2], 10);
          return (
            <div
              key={day}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold cursor-default relative transition-all duration-150 hover:scale-125 hover:z-10",
                moodCellClass(mood),
                mood ? "text-white shadow-sm" : "text-gray-500 dark:text-gray-400"
              )}
              onMouseEnter={() => setTooltip({ date: day, mood })}
              onMouseLeave={() => setTooltip(null)}
            >
              {dayNum}
            </div>
          );
        })}
      </div>
      {tooltip && (
        <div className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-xl px-3.5 py-2 whitespace-nowrap pointer-events-none shadow-xl border border-gray-700 dark:border-gray-600">
          <span className="font-semibold">{formatDate(tooltip.date)}</span>
          {tooltip.mood
            ? <span className="ml-1.5">{moodEmoji(tooltip.mood)} {moodLabel(tooltip.mood)}</span>
            : <span className="ml-1.5 text-gray-400">No log</span>}
        </div>
      )}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Mood:</span>
        {[
          { label: "None", cls: "bg-gray-200 dark:bg-gray-700/60" },
          { label: "1", cls: "bg-red-400 dark:bg-red-500" },
          { label: "2", cls: "bg-orange-400 dark:bg-orange-500" },
          { label: "3", cls: "bg-yellow-400 dark:bg-yellow-400" },
          { label: "4", cls: "bg-green-400 dark:bg-green-500" },
          { label: "5", cls: "bg-emerald-500 dark:bg-emerald-400" },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={cn("w-3.5 h-3.5 rounded-md inline-block", cls)} />
            <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Weekly averages chips ─────────────────────────────────────────────────────

function WeeklyAveragesBar({ logs }: { logs: HealthLog[] }) {
  const { sleep, water, exercise } = weeklyAverages(logs);
  if (!sleep && !water && !exercise) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        {
          label: "Avg Sleep",
          value: sleep,
          unit: "hrs",
          icon: <Moon className="h-5 w-5 text-indigo-500" />,
          gradient: "from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/40 dark:to-purple-900/40",
          border: "border-indigo-200 dark:border-indigo-800",
          valueColor: "text-indigo-700 dark:text-indigo-300",
        },
        {
          label: "Avg Water",
          value: water,
          unit: "L",
          icon: <Droplets className="h-5 w-5 text-cyan-500" />,
          gradient: "from-cyan-500/10 to-blue-500/10 dark:from-cyan-900/40 dark:to-blue-900/40",
          border: "border-cyan-200 dark:border-cyan-800",
          valueColor: "text-cyan-700 dark:text-cyan-300",
        },
        {
          label: "Avg Exercise",
          value: exercise,
          unit: "min",
          icon: <Activity className="h-5 w-5 text-emerald-500" />,
          gradient: "from-emerald-500/10 to-green-500/10 dark:from-emerald-900/40 dark:to-green-900/40",
          border: "border-emerald-200 dark:border-emerald-800",
          valueColor: "text-emerald-700 dark:text-emerald-300",
        },
      ].map(({ label, value, unit, icon, gradient, border, valueColor }) => (
        <div
          key={label}
          className={cn(
            "bg-gradient-to-br rounded-2xl px-3 py-3.5 flex flex-col items-center gap-1.5 border shadow-sm",
            gradient, border
          )}
        >
          {icon}
          <p className={cn("text-lg font-bold leading-none", valueColor)}>
            {value !== null ? value : <span className="text-gray-400 dark:text-gray-600 font-normal text-base">—</span>}
          </p>
          {value !== null && <p className={cn("text-xs font-semibold", valueColor)}>{unit}</p>}
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center leading-tight">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Section header with accent ────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  iconBg,
}: {
  icon: React.ReactNode;
  title: string;
  iconBg: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", iconBg)}>
        {icon}
      </div>
      <span className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HealthLogPage() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState(0);
  const [selectedEnergy, setSelectedEnergy] = useState(0);
  const [symptomTags, setSymptomTags] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [logDate, setLogDate] = useState(today());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const trackedMetrics = useTrackedMetrics();
  const shows = (key: MetricKey) => trackedMetrics === null || trackedMetrics.has(key);

  const { register, handleSubmit, reset, setValue } = useForm<FormData>({ resolver: zodResolver(schema) });

  // AI Fill state
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInterpreted, setAiInterpreted] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "parsing">("idle");

  const handleAiFill = useCallback(async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiInterpreted(null);
    try {
      const res = await fetch("/api/ai/parse-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "AI parsing failed. Please try again.");
        return;
      }
      const data = await res.json();

      const numericFields = [
        "sleep", "water", "exercise", "steps", "weight",
        "heartRate", "systolic", "diastolic", "bloodSugar",
        "temperature", "oxygenSaturation", "calories", "painLevel",
      ] as const;
      for (const field of numericFields) {
        if (data[field] != null) {
          setValue(field, data[field]);
        }
      }

      if (data.mood != null && data.mood >= 1 && data.mood <= 5) {
        setSelectedMood(data.mood);
      }
      if (data.energy != null && data.energy >= 1 && data.energy <= 5) {
        setSelectedEnergy(data.energy);
      }
      if (data.symptoms) {
        setSymptomTags(data.symptoms);
      }
      if (data.notes) {
        setValue("notes", data.notes);
      }

      setAiInterpreted(data.interpreted ?? "Fields filled from your description.");
    } catch {
      toast.error("AI parsing failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }, [aiText, setValue]);

  const handleVoiceTranscript = useCallback(async (transcript: string) => {
    setAiText(transcript);
    setVoiceStatus("parsing");
    setAiInterpreted(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/parse-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "AI parsing failed. Please try again.");
        return;
      }
      const data = await res.json();

      const numericFields = [
        "sleep", "water", "exercise", "steps", "weight",
        "heartRate", "systolic", "diastolic", "bloodSugar",
        "temperature", "oxygenSaturation", "calories", "painLevel",
      ] as const;
      for (const field of numericFields) {
        if (data[field] != null) {
          setValue(field, data[field]);
        }
      }
      if (data.mood != null && data.mood >= 1 && data.mood <= 5) {
        setSelectedMood(data.mood);
      }
      if (data.energy != null && data.energy >= 1 && data.energy <= 5) {
        setSelectedEnergy(data.energy);
      }
      if (data.symptoms) {
        setSymptomTags(data.symptoms);
      }
      if (data.notes) {
        setValue("notes", data.notes);
      }
      setAiInterpreted(data.interpreted ?? "Fields filled from your voice input.");
    } catch {
      toast.error("AI parsing failed. Please try again.");
    } finally {
      setAiLoading(false);
      setVoiceStatus("idle");
    }
  }, [setValue]);

  useEffect(() => {
    fetch("/api/health-logs?limit=200")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setLogs(data); })
      .catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/health-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          date: logDate,
          symptoms: symptomTags || undefined,
          mood: selectedMood || undefined,
          energy: selectedEnergy || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const newLog = await res.json();
      setLogs(prev => [newLog, ...prev]);
      reset();
      setSelectedMood(0);
      setSelectedEnergy(0);
      setSymptomTags("");
      setLogDate(today());
      setShowDatePicker(false);
      toast.success("Health log saved!");
    } catch {
      toast.error("Failed to save log.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this health log entry?")) return;
    try {
      const res = await fetch(`/api/health-logs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setLogs(prev => prev.filter(l => l.id !== id));
      toast.success("Log deleted.");
    } catch {
      toast.error("Failed to delete log.");
    }
  };

  const streak = computeStreak(logs);
  const visibleLogs = logs.slice(0, visibleCount);
  const grouped = groupByDate(visibleLogs);
  const isLoggingToday = logDate === today();

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Health Log</h1>
          <p className="text-gray-500 dark:text-gray-400 text-base mt-1">Track your vitals and how you feel every day</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/dashboard/profile/metrics"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Customize metrics
          </Link>
          {streak > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border border-orange-200 dark:border-orange-800 rounded-2xl px-4 py-2.5 shadow-sm">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{streak} day streak</p>
                <p className="text-xs text-orange-500 dark:text-orange-400">Keep it up!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form column */}
        <div className="space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* ── AI Fill — prominent gradient card ── */}
            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 p-[2px] shadow-xl shadow-blue-500/20">
              <div className="rounded-[22px] bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50 dark:from-indigo-950/80 dark:via-blue-950/80 dark:to-sky-950/80 p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Log with AI ✨</h2>
                    <p className="text-sm text-indigo-600 dark:text-indigo-300">
                      Describe your day — AI fills the form
                    </p>
                  </div>
                </div>

                {/* Textarea + voice button */}
                <div className="flex items-start gap-3">
                  <textarea
                    value={aiText}
                    onChange={e => setAiText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleAiFill();
                      }
                    }}
                    placeholder={"Describe how you feel in plain English...\ne.g. 'Slept 6 hours, BP was 140/90, had a headache, took my meds'"}
                    rows={4}
                    className="flex-1 min-h-[100px] rounded-2xl border-2 border-white/60 dark:border-white/10 bg-white dark:bg-gray-900/80 px-4 py-3.5 text-base text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
                  />
                  <div className="pt-1 shrink-0">
                    <VoiceInput
                      onTranscript={handleVoiceTranscript}
                      disabled={aiLoading}
                    />
                  </div>
                </div>

                {voiceStatus === "parsing" && (
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-2 font-medium">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    Voice input received — parsing with AI...
                  </p>
                )}

                <Button
                  type="button"
                  onClick={handleAiFill}
                  disabled={aiLoading || !aiText.trim()}
                  className="w-full h-14 text-base font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                  {aiLoading ? (
                    <span className="flex items-center gap-2.5">
                      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Parsing your description...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2.5">
                      <Sparkles className="h-5 w-5" />
                      Fill form with AI
                    </span>
                  )}
                </Button>

                {aiInterpreted && (
                  <div className="flex items-start justify-between gap-3 rounded-2xl bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-4 py-3.5">
                    <p className="text-sm text-green-800 dark:text-green-300 leading-snug">
                      <span className="font-semibold">AI filled: </span>{aiInterpreted}
                    </p>
                    <button
                      type="button"
                      onClick={() => setAiInterpreted(null)}
                      className="shrink-0 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors p-0.5"
                      aria-label="Clear AI banner"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Mood & Energy ── */}
            {shows("moodEnergy") && (
              <Card className="rounded-3xl shadow-lg border-gray-100 dark:border-gray-800">
                <CardHeader className="pb-4 pt-5 px-5 border-b border-gray-100 dark:border-gray-800">
                  <SectionHeader
                    icon={<span className="text-lg">😊</span>}
                    title="Mood & Energy"
                    iconBg="bg-yellow-100 dark:bg-yellow-950"
                  />
                </CardHeader>
                <CardContent className="space-y-5 pt-5 px-5 pb-5">
                  {/* Mood picker */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 block">
                      How are you feeling?
                    </Label>
                    <div className="flex gap-2.5">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSelectedMood(selectedMood === v ? 0 : v)}
                          className={cn(
                            "flex-1 flex flex-col items-center justify-center h-20 rounded-2xl border-2 transition-all duration-200",
                            selectedMood === v
                              ? cn("scale-110 shadow-lg", moodSelectedBg(v))
                              : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:scale-105 active:scale-95"
                          )}
                        >
                          <span className="text-3xl leading-none">{moodEmoji(v)}</span>
                        </button>
                      ))}
                    </div>
                    {selectedMood > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-semibold text-center">
                        {moodLabel(selectedMood)}
                      </p>
                    )}
                  </div>

                  {/* Energy picker */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 block">
                      Energy level
                    </Label>
                    <div className="flex gap-2.5">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSelectedEnergy(selectedEnergy === v ? 0 : v)}
                          className={cn(
                            "flex-1 h-12 rounded-xl border-2 text-base font-bold transition-all duration-200 active:scale-95",
                            selectedEnergy === v
                              ? "border-blue-500 bg-blue-500 text-white scale-105 shadow-md shadow-blue-500/30"
                              : "border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600 hover:border-gray-200 dark:hover:border-gray-700 hover:scale-105"
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {selectedEnergy > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-semibold flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" />
                        {energyLabel(selectedEnergy)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Daily Activity ── */}
            {(shows("sleep") || shows("water") || shows("exercise") || shows("steps") || shows("calories") || shows("weight")) && (
              <Card className="rounded-3xl shadow-lg border-gray-100 dark:border-gray-800">
                <CardHeader className="pb-4 pt-5 px-5 border-b border-gray-100 dark:border-gray-800">
                  <SectionHeader
                    icon={<Activity className="h-5 w-5 text-emerald-600" />}
                    title="Daily Activity"
                    iconBg="bg-emerald-100 dark:bg-emerald-950"
                  />
                </CardHeader>
                <CardContent className="pt-5 px-5 pb-5">
                  <div className="grid grid-cols-2 gap-3.5">
                    {shows("sleep") && <VitalInput icon={<Moon className="h-4 w-4 text-indigo-500" />} label="Sleep" unit="hrs" placeholder="7.5" name="sleep" register={register} step="0.5" />}
                    {shows("water") && <VitalInput icon={<Droplets className="h-4 w-4 text-cyan-500" />} label="Water" unit="L" placeholder="2.0" name="water" register={register} step="0.1" />}
                    {shows("exercise") && <VitalInput icon={<Activity className="h-4 w-4 text-emerald-500" />} label="Exercise" unit="min" placeholder="30" name="exercise" register={register} />}
                    {shows("steps") && <VitalInput icon={<Footprints className="h-4 w-4 text-orange-500" />} label="Steps" unit="steps" placeholder="8000" name="steps" register={register} />}
                    {shows("calories") && <VitalInput icon={<Flame className="h-4 w-4 text-red-500" />} label="Calories" unit="kcal" placeholder="2000" name="calories" register={register} />}
                    {shows("weight") && <VitalInput icon={<TrendingUp className="h-4 w-4 text-purple-500" />} label="Weight" unit="kg" placeholder="70" name="weight" register={register} step="0.1" />}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Vitals ── */}
            {(shows("heartRate") || shows("bloodPressure") || shows("bloodSugar") || shows("temperature") || shows("spo2") || shows("painLevel")) && (
              <Card className="rounded-3xl shadow-lg border-gray-100 dark:border-gray-800">
                <CardHeader className="pb-4 pt-5 px-5 border-b border-gray-100 dark:border-gray-800">
                  <SectionHeader
                    icon={<Heart className="h-5 w-5 text-red-500" />}
                    title="Vitals"
                    iconBg="bg-red-100 dark:bg-red-950"
                  />
                </CardHeader>
                <CardContent className="pt-5 px-5 pb-5">
                  <div className="grid grid-cols-2 gap-3.5">
                    {shows("heartRate") && <VitalInput icon={<Heart className="h-4 w-4 text-red-500" />} label="Heart Rate" unit="bpm" placeholder="72" name="heartRate" register={register} />}
                    {shows("bloodPressure") && (
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5 font-medium">
                          <div className="w-6 h-6 rounded-lg bg-pink-100 dark:bg-pink-950 flex items-center justify-center">
                            <Activity className="h-3.5 w-3.5 text-pink-500" />
                          </div>
                          Blood Pressure
                        </Label>
                        <div className="flex gap-1.5 items-center">
                          <Input placeholder="120" type="number" {...register("systolic")} className="h-12 rounded-xl text-base" />
                          <span className="text-gray-400 dark:text-gray-600 text-base font-bold">/</span>
                          <Input placeholder="80" type="number" {...register("diastolic")} className="h-12 rounded-xl text-base" />
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5">mmHg (sys / dia)</p>
                      </div>
                    )}
                    {shows("bloodSugar") && <VitalInput icon={<Droplets className="h-4 w-4 text-amber-500" />} label="Blood Sugar" unit="mg/dL" placeholder="100" name="bloodSugar" register={register} step="0.1" />}
                    {shows("temperature") && <VitalInput icon={<Thermometer className="h-4 w-4 text-orange-500" />} label="Temperature" unit="°C" placeholder="37.0" name="temperature" register={register} step="0.1" />}
                    {shows("spo2") && <VitalInput icon={<Wind className="h-4 w-4 text-sky-500" />} label="SpO2" unit="%" placeholder="98" name="oxygenSaturation" register={register} />}
                    {shows("painLevel") && (
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5 font-medium">
                          <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                            <Activity className="h-3.5 w-3.5 text-red-400" />
                          </div>
                          Pain Level
                        </Label>
                        <Input placeholder="0" type="number" min={0} max={10} {...register("painLevel")} className="h-12 rounded-xl text-base" />
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5">0 = none · 10 = severe</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Symptoms & Notes ── */}
            <Card className="rounded-3xl shadow-lg border-gray-100 dark:border-gray-800">
              <CardHeader className="pb-4 pt-5 px-5 border-b border-gray-100 dark:border-gray-800">
                <SectionHeader
                  icon={<span className="text-lg">📝</span>}
                  title="Symptoms & Notes"
                  iconBg="bg-purple-100 dark:bg-purple-950"
                />
              </CardHeader>
              <CardContent className="space-y-4 pt-5 px-5 pb-5">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                    Symptoms <span className="font-normal text-gray-400">(Enter or comma to add)</span>
                  </Label>
                  <TagInput value={symptomTags} onChange={setSymptomTags} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Notes</Label>
                  <Textarea
                    placeholder="How was your day? Anything to remember..."
                    {...register("notes")}
                    rows={3}
                    className="rounded-xl text-base resize-none min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Log date selector ── */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(v => !v)}
                  className={cn(
                    "inline-flex items-center gap-2 text-sm font-semibold rounded-full px-4 py-2 border-2 transition-all active:scale-95",
                    isLoggingToday
                      ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                      : "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  {isLoggingToday ? "Log for today" : `Logging for ${format(parseISO(logDate), "MMM d")}`}
                </button>
                {!isLoggingToday && (
                  <button
                    type="button"
                    onClick={() => { setLogDate(today()); setShowDatePicker(false); }}
                    className="text-sm text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 underline underline-offset-2 transition-colors"
                  >
                    Reset to today
                  </button>
                )}
              </div>

              {showDatePicker && (
                <div className="flex items-center gap-2.5">
                  <Input
                    type="date"
                    value={logDate}
                    max={today()}
                    onChange={e => { if (e.target.value) setLogDate(e.target.value); }}
                    className="h-12 rounded-xl text-base w-auto"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="p-2 rounded-xl text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ── Submit ── */}
            <Button
              type="submit"
              className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : (
                "Save Health Log"
              )}
            </Button>
          </form>
        </div>

        {/* ── History column ── */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Recent Entries</h2>

          {logs.length > 0 && (
            <>
              {/* Weekly averages — prominent chips */}
              <Card className="rounded-3xl shadow-lg border-gray-100 dark:border-gray-800">
                <CardHeader className="pb-3 pt-5 px-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">7-Day Averages</h3>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <WeeklyAveragesBar logs={logs} />
                </CardContent>
              </Card>

              {/* Calendar heatmap */}
              <Card className="rounded-3xl shadow-lg border-gray-100 dark:border-gray-800">
                <CardHeader className="pb-3 pt-5 px-5 border-b border-gray-100 dark:border-gray-800">
                  <SectionHeader
                    icon={<Calendar className="h-4.5 w-4.5 text-violet-500" />}
                    title="30-Day Mood"
                    iconBg="bg-violet-100 dark:bg-violet-950"
                  />
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-5">
                  <CalendarHeatmap logs={logs} />
                </CardContent>
              </Card>
            </>
          )}

          {logs.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 border-gray-200 dark:border-gray-700 shadow-none">
              <CardContent className="flex flex-col items-center py-16 px-6">
                <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Activity className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-xl font-bold text-gray-600 dark:text-gray-300">No logs yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-base mt-2 text-center">Start tracking your health today using the form on the left</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {grouped.map(({ date, entries }) => (
                <div key={date} className="space-y-2">
                  {/* Sticky date header with gradient pill */}
                  <div className="sticky top-0 z-10 flex items-center gap-2.5 py-2 backdrop-blur-sm bg-white/80 dark:bg-gray-950/80">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-full px-4 py-1.5 shadow-md shadow-blue-500/20">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(date)}
                    </div>
                    {entries.length > 1 && (
                      <span className="inline-flex items-center bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full px-2.5 py-1 border border-blue-200 dark:border-blue-800">
                        {entries.length} entries
                      </span>
                    )}
                  </div>

                  {/* Sub-cards */}
                  <div className={cn("space-y-2", entries.length > 1 && "pl-3 border-l-2 border-blue-200 dark:border-blue-800")}>
                    {entries.map(log => (
                      <Card
                        key={log.id}
                        className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <CardContent className="pt-4 pb-4 px-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {log.createdAt && (
                                <span className="text-sm text-gray-400 dark:text-gray-500 font-semibold tabular-nums bg-gray-50 dark:bg-gray-800/60 rounded-lg px-2 py-0.5">
                                  {formatTime(log.createdAt)}
                                </span>
                              )}
                              {log.mood && (
                                <Badge variant="secondary" className="text-sm px-2.5 py-1 rounded-xl">
                                  {moodEmoji(log.mood)} {moodLabel(log.mood)}
                                </Badge>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDelete(log.id)}
                              className="ml-2 shrink-0 p-2 rounded-xl text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-all active:scale-90"
                              title="Delete log"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-x-3 gap-y-2.5">
                            {log.steps != null && log.steps > 0 && <Stat label="Steps" value={Number(log.steps).toLocaleString()} />}
                            {log.sleep != null && log.sleep > 0 && <Stat label="Sleep" value={`${log.sleep}h`} />}
                            {log.water != null && log.water > 0 && <Stat label="Water" value={`${log.water}L`} />}
                            {log.heartRate != null && log.heartRate > 0 && <Stat label="Heart Rate" value={`${log.heartRate}bpm`} />}
                            {log.systolic != null && log.diastolic != null && log.systolic > 0 && <Stat label="BP" value={`${log.systolic}/${log.diastolic}`} />}
                            {log.bloodSugar != null && log.bloodSugar > 0 && <Stat label="Blood Sugar" value={`${log.bloodSugar}mg/dL`} />}
                            {log.weight != null && log.weight > 0 && <Stat label="Weight" value={`${log.weight}kg`} />}
                            {log.temperature != null && log.temperature > 0 && <Stat label="Temp" value={`${log.temperature}°C`} />}
                            {log.oxygenSaturation != null && log.oxygenSaturation > 0 && <Stat label="SpO2" value={`${log.oxygenSaturation}%`} />}
                            {log.calories != null && log.calories > 0 && <Stat label="Calories" value={`${log.calories}kcal`} />}
                            {log.exercise != null && log.exercise > 0 && <Stat label="Exercise" value={`${log.exercise}min`} />}
                          </div>
                          {log.symptoms && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {log.symptoms.split(",").map(s => s.trim()).filter(Boolean).map((s, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-full px-2.5 py-1 text-xs font-semibold"
                                >
                                  ⚠ {s}
                                </span>
                              ))}
                            </div>
                          )}
                          {log.notes && (
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2.5 line-clamp-2 leading-relaxed">
                              {log.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {visibleCount < logs.length && (
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-2xl text-base font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  onClick={() => setVisibleCount(c => c + 10)}
                >
                  Load more ({logs.length - visibleCount} remaining)
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── VitalInput ────────────────────────────────────────────────────────────────

function VitalInput({ icon, label, unit, placeholder, name, register, step }: {
  icon: React.ReactNode;
  label: string;
  unit: string;
  placeholder: string;
  name: string;
  register: ReturnType<typeof useForm>["register"];
  step?: string;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          {icon}
        </div>
        {label}
      </Label>
      <Input
        placeholder={placeholder}
        type="number"
        step={step || "1"}
        {...register(name)}
        className="h-12 rounded-xl text-base"
      />
      <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 font-medium">{unit}</p>
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-2.5 py-2">
      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</p>
      <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mt-0.5">{value}</p>
    </div>
  );
}
