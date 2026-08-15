"use client";

import React, { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface HealthLog {
  id: string;
  date: string;
  mood: number | null;
  energy: number | null;
  sleep: number | null;
  water: number | null;
  exercise: number | null;
  steps: number | null;
  weight: number | null;
  heartRate: number | null;
  systolic: number | null;
  diastolic: number | null;
  bloodSugar: number | null;
  temperature: number | null;
  oxygenSaturation: number | null;
  calories: number | null;
  symptoms: string | null;
  notes: string | null;
  painLevel: number | null;
  createdAt: string;
}

type SortKey = keyof HealthLog;
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

// ── Threshold helpers ──────────────────────────────────────────────────────

function bpClass(systolic: number | null, diastolic: number | null): string {
  if (systolic == null || diastolic == null) return "";
  if (systolic > 180 || diastolic > 120) return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  if (systolic > 140 || diastolic > 90) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
  return "";
}

function hrClass(hr: number | null): string {
  if (hr == null) return "";
  if (hr < 50 || hr > 120) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
  return "";
}

function bsClass(bs: number | null): string {
  if (bs == null) return "";
  if (bs < 70 || bs > 250) return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  if (bs > 180) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
  return "";
}

function spo2Class(spo2: number | null): string {
  if (spo2 == null) return "";
  if (spo2 < 90) return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  if (spo2 < 95) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
  return "";
}

function hasCritical(log: HealthLog): boolean {
  if (log.systolic != null && log.diastolic != null) {
    if (log.systolic > 180 || log.diastolic > 120) return true;
    if (log.systolic > 140 || log.diastolic > 90) return true;
  }
  if (log.heartRate != null && (log.heartRate < 50 || log.heartRate > 120)) return true;
  if (log.bloodSugar != null && (log.bloodSugar < 70 || log.bloodSugar > 180)) return true;
  if (log.oxygenSaturation != null && (log.oxygenSaturation < 95)) return true;
  return false;
}

// ── CSV export ─────────────────────────────────────────────────────────────

function toCSV(logs: HealthLog[]): string {
  const headers = [
    "Date", "Mood", "Energy", "Sleep (hrs)", "Water (L)", "Exercise (min)",
    "Steps", "Weight (kg)", "Heart Rate (bpm)", "Systolic", "Diastolic",
    "Blood Sugar (mg/dL)", "Temperature (°C)", "SpO2 (%)", "Calories",
    "Pain Level", "Symptoms", "Notes",
  ];
  const rows = logs.map((l) => [
    l.date,
    l.mood ?? "",
    l.energy ?? "",
    l.sleep ?? "",
    l.water ?? "",
    l.exercise ?? "",
    l.steps ?? "",
    l.weight ?? "",
    l.heartRate ?? "",
    l.systolic ?? "",
    l.diastolic ?? "",
    l.bloodSugar ?? "",
    l.temperature ?? "",
    l.oxygenSaturation ?? "",
    l.calories ?? "",
    l.painLevel ?? "",
    l.symptoms ? `"${l.symptoms.replace(/"/g, '""')}"` : "",
    l.notes ? `"${l.notes.replace(/"/g, '""')}"` : "",
  ].join(","));
  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV(content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "health-history.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Mood label ─────────────────────────────────────────────────────────────

const MOOD_LABELS: Record<number, string> = { 1: "😞 Very Bad", 2: "😕 Bad", 3: "😐 Okay", 4: "🙂 Good", 5: "😄 Great" };

// ── Component ──────────────────────────────────────────────────────────────

export default function HealthHistoryPage() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [criticalOnly, setCriticalOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/health-logs")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load logs");
        return r.json();
      })
      .then((data: HealthLog[]) => setLogs(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...logs];
    if (criticalOnly) result = result.filter(hasCritical);
    result.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [logs, criticalOnly, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-1 opacity-30">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        onClick={() => handleSort(col)}
        className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        {label}
        <SortIcon col={col} />
      </th>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        Loading health history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Health History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            {criticalOnly ? " (filtered)" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={criticalOnly}
              onChange={(e) => { setCriticalOnly(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            Has critical values
          </label>
          <button
            onClick={() => downloadCSV(toCSV(filtered))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-sm">
          No health records found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <Th col="date" label="Date" />
                  <Th col="mood" label="Mood" />
                  <Th col="sleep" label="Sleep" />
                  <Th col="heartRate" label="HR" />
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">BP</th>
                  <Th col="bloodSugar" label="Blood Sugar" />
                  <Th col="oxygenSaturation" label="SpO2" />
                  <Th col="weight" label="Weight" />
                  <Th col="steps" label="Steps" />
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Symptoms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginated.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const rowBp = bpClass(log.systolic, log.diastolic);
                  const rowHr = hrClass(log.heartRate);
                  const rowBs = bsClass(log.bloodSugar);
                  const rowSpo2 = spo2Class(log.oxygenSaturation);
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        key={log.id}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isExpanded
                            ? "bg-blue-50 dark:bg-blue-950/30"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        )}
                      >
                        {/* Date */}
                        <td className="px-3 py-2.5 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">
                          {(() => {
                            try { return format(new Date(log.date + "T00:00:00"), "MMM d, yyyy"); }
                            catch { return log.date; }
                          })()}
                        </td>
                        {/* Mood */}
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-400">
                          {log.mood != null ? (MOOD_LABELS[log.mood] ?? log.mood) : "—"}
                        </td>
                        {/* Sleep */}
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-400">
                          {log.sleep != null ? `${log.sleep} hrs` : "—"}
                        </td>
                        {/* HR */}
                        <td className={cn("px-3 py-2.5 whitespace-nowrap", rowHr)}>
                          {log.heartRate != null ? `${log.heartRate} bpm` : "—"}
                        </td>
                        {/* BP */}
                        <td className={cn("px-3 py-2.5 whitespace-nowrap", rowBp)}>
                          {log.systolic != null && log.diastolic != null
                            ? `${log.systolic}/${log.diastolic}`
                            : "—"}
                        </td>
                        {/* Blood Sugar */}
                        <td className={cn("px-3 py-2.5 whitespace-nowrap", rowBs)}>
                          {log.bloodSugar != null ? `${log.bloodSugar} mg/dL` : "—"}
                        </td>
                        {/* SpO2 */}
                        <td className={cn("px-3 py-2.5 whitespace-nowrap", rowSpo2)}>
                          {log.oxygenSaturation != null ? `${log.oxygenSaturation}%` : "—"}
                        </td>
                        {/* Weight */}
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-400">
                          {log.weight != null ? `${log.weight} kg` : "—"}
                        </td>
                        {/* Steps */}
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-400">
                          {log.steps != null ? log.steps.toLocaleString() : "—"}
                        </td>
                        {/* Symptoms */}
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 max-w-[180px] truncate">
                          {log.symptoms || "—"}
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {isExpanded && (
                        <tr key={`${log.id}-expanded`} className="bg-blue-50/60 dark:bg-blue-950/20">
                          <td colSpan={10} className="px-4 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                              <DetailItem label="Energy" value={log.energy != null ? `${log.energy}/5` : null} />
                              <DetailItem label="Water" value={log.water != null ? `${log.water} L` : null} />
                              <DetailItem label="Exercise" value={log.exercise != null ? `${log.exercise} min` : null} />
                              <DetailItem label="Calories" value={log.calories != null ? `${log.calories} kcal` : null} />
                              <DetailItem label="Temperature" value={log.temperature != null ? `${log.temperature} °C` : null} />
                              <DetailItem label="Pain Level" value={log.painLevel != null ? `${log.painLevel}/10` : null} />
                              {log.symptoms && (
                                <div className="col-span-2">
                                  <span className="font-medium text-gray-500 dark:text-gray-400">Symptoms: </span>
                                  <span className="text-gray-700 dark:text-gray-200">{log.symptoms}</span>
                                </div>
                              )}
                              {log.notes && (
                                <div className="col-span-2 md:col-span-4">
                                  <span className="font-medium text-gray-500 dark:text-gray-400">Notes: </span>
                                  <span className="text-gray-700 dark:text-gray-200">{log.notes}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Page {page} of {totalPages} &middot; {filtered.length} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null) return null;
  return (
    <div>
      <span className="font-medium text-gray-500 dark:text-gray-400">{label}: </span>
      <span className="text-gray-700 dark:text-gray-200">{value}</span>
    </div>
  );
}