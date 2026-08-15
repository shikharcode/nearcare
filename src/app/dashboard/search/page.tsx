'use client'

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, Pill, FileText, Activity, Clock, Loader2, X } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  notes: string | null;
  isActive: boolean | null;
}

interface Document {
  id: string;
  name: string;
  type: string;
  date: string | null;
  doctorName: string | null;
}

interface HealthLog {
  id: string;
  date: string;
  symptoms: string | null;
  notes: string | null;
  mood: number | null;
  energy: number | null;
}

interface SearchResults {
  medications: Medication[];
  documents: Document[];
  logs: HealthLog[];
}

const RECENT_KEY = "carebridge_recent_searches";
const MAX_RECENT = 5;

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  const prev = getRecent().filter((s) => s !== q);
  const next = [q, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function removeRecent(q: string) {
  const next = getRecent().filter((s) => s !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(getRecent());
    inputRef.current?.focus();
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setSearched("");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data: SearchResults = await res.json();
      setResults(data);
      setSearched(q);
      saveRecent(q);
      setRecent(getRecent());
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(val), 300);
  };

  const handleRecentClick = (q: string) => {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    runSearch(q);
  };

  const handleRemoveRecent = (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecent(q);
    setRecent(getRecent());
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setSearched("");
    inputRef.current?.focus();
  };

  const totalResults = results
    ? results.medications.length + results.documents.length + results.logs.length
    : 0;

  const showEmpty = searched.length >= 2 && !loading && totalResults === 0;
  const showRecent = query.length < 2 && recent.length > 0 && !loading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search medications, documents, health logs…"
            className={cn(
              "w-full pl-12 pr-12 py-4 rounded-2xl text-base",
              "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
              "text-gray-900 dark:text-gray-100 placeholder:text-gray-400",
              "shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all"
            )}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
            {query && !loading && (
              <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Recent searches */}
        {showRecent && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 px-1">
              Recent searches
            </p>
            <div className="space-y-1">
              {recent.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRecentClick(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 hover:shadow-sm transition-all text-left group"
                >
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 truncate">{r}</span>
                  <span
                    role="button"
                    onClick={(e) => handleRemoveRecent(r, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <div className="mt-12 text-center">
            <Search className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              No results for &ldquo;{searched}&rdquo;
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">
              Try searching for a medication name, symptom, or document.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["ibuprofen", "headache", "blood test"].map((s) => (
                <button
                  key={s}
                  onClick={() => handleRecentClick(s)}
                  className="px-3 py-1.5 rounded-full text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results && totalResults > 0 && (
          <div className="mt-6 space-y-6">
            {/* Medications */}
            {results.medications.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Pill className="h-4 w-4 text-blue-500" />
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Medications
                  </h2>
                  <span className="ml-auto text-xs text-gray-400">{results.medications.length}</span>
                </div>
                <div className="space-y-2">
                  {results.medications.map((med) => (
                    <button
                      key={med.id}
                      onClick={() => router.push("/dashboard/medications")}
                      className="w-full flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all text-left group"
                    >
                      <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 flex-shrink-0">
                        <Pill className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {med.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {[med.dosage, med.frequency].filter(Boolean).join(" · ") || "No details"}
                        </p>
                        {med.notes && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                            {med.notes}
                          </p>
                        )}
                      </div>
                      {med.isActive && (
                        <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Documents */}
            {results.documents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Documents
                  </h2>
                  <span className="ml-auto text-xs text-gray-400">{results.documents.length}</span>
                </div>
                <div className="space-y-2">
                  {results.documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => router.push("/dashboard/documents")}
                      className="w-full flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all text-left"
                    >
                      <div className="mt-0.5 p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 flex-shrink-0">
                        <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {[doc.type.replace("_", " "), doc.doctorName, doc.date]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Health Logs */}
            {results.logs.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Health Logs
                  </h2>
                  <span className="ml-auto text-xs text-gray-400">{results.logs.length}</span>
                </div>
                <div className="space-y-2">
                  {results.logs.map((log) => (
                    <button
                      key={log.id}
                      onClick={() => router.push("/dashboard/health-log")}
                      className="w-full flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all text-left"
                    >
                      <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex-shrink-0">
                        <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {log.date}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {log.symptoms || log.notes || "No details"}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {log.mood != null && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            Mood {log.mood}/5
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
