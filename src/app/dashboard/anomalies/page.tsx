"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface RawAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  value: string | null;
  createdAt: string;
}

interface AnomalyCard {
  id: string;
  anomalyType: string;
  severity: string;
  message: string;
  recommendation: string;
  createdAt: string;
}

function parseAlert(alert: RawAlert): AnomalyCard {
  let message = alert.message;
  let recommendation = "";
  try {
    const parsed = JSON.parse(alert.message);
    if (parsed && typeof parsed === "object") {
      message = parsed.message ?? alert.message;
      recommendation = parsed.recommendation ?? "";
    }
  } catch {
    // message is plain text — no recommendation embedded
  }
  return {
    id: alert.id,
    anomalyType: alert.value ?? "trend",
    severity: alert.severity,
    message,
    recommendation,
    createdAt: alert.createdAt,
  };
}

function anomalyIcon(type: string) {
  if (type.includes("blood_pressure") || type.includes("bp")) return <TrendingUp className="h-5 w-5" />;
  if (type.includes("sleep")) return <span className="text-base">🌙</span>;
  if (type.includes("mood")) return <span className="text-base">😟</span>;
  if (type.includes("weight")) return <TrendingUp className="h-5 w-5" />;
  if (type.includes("heart")) return <span className="text-base">❤️</span>;
  if (type.includes("sugar") || type.includes("blood_sugar")) return <span className="text-base">🩸</span>;
  if (type.includes("pain")) return <AlertTriangle className="h-5 w-5" />;
  if (type.includes("energy")) return <span className="text-base">⚡</span>;
  if (type.includes("exercise") || type.includes("activity")) return <span className="text-base">🏃</span>;
  return <Brain className="h-5 w-5" />;
}

function labelFromType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<AnomalyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/alerts?type=anomaly_detected")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load alerts");
        return r.json() as Promise<RawAlert[]>;
      })
      .then((alerts) => {
        setAnomalies(alerts.map(parseAlert));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const warnings = anomalies.filter((a) => a.severity === "warning" || a.severity === "critical");
  const patterns = anomalies.filter((a) => a.severity === "pattern" || (a.severity !== "warning" && a.severity !== "critical"));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
            <Brain className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Health Insights</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-0 mt-1">
          Proactive trend detection from your health logs — powered by Gemini AI
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Sparkles className="h-5 w-5 animate-pulse text-violet-500" />
            <span className="text-sm">Analyzing your health data…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && anomalies.length === 0 && (
        <div className="flex flex-col items-center text-center py-20 gap-4">
          <div className="p-5 rounded-2xl bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">
              No anomalies detected — your health looks stable!
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-sm">
              AI analysis runs automatically after each health log. Keep logging daily to build enough data for trend detection.
            </p>
          </div>
          <Link href="/dashboard/health-log">
            <Button variant="outline" className="gap-2 mt-2">
              Log Today's Health
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {!loading && !error && anomalies.length > 0 && (
        <div className="space-y-8">
          {/* Warnings section */}
          {warnings.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Warnings
                </h2>
                <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                  {warnings.length}
                </span>
              </div>
              <div className="space-y-3">
                {warnings.map((a) => (
                  <AnomalyInsightCard key={a.id} anomaly={a} accent="amber" />
                ))}
              </div>
            </section>
          )}

          {/* Patterns section */}
          {patterns.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Patterns
                </h2>
                <span className="text-xs bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-semibold px-2 py-0.5 rounded-full">
                  {patterns.length}
                </span>
              </div>
              <div className="space-y-3">
                {patterns.map((a) => (
                  <AnomalyInsightCard key={a.id} anomaly={a} accent="violet" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function AnomalyInsightCard({
  anomaly,
  accent,
}: {
  anomaly: AnomalyCard;
  accent: "amber" | "violet";
}) {
  const accentStyles = {
    amber: {
      border: "border-amber-200 dark:border-amber-800",
      iconBg: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
      badge: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-0",
      rec: "bg-amber-50 dark:bg-amber-950 border-amber-100 dark:border-amber-900 text-amber-800 dark:text-amber-200",
    },
    violet: {
      border: "border-violet-200 dark:border-violet-800",
      iconBg: "bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400",
      badge: "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 border-0",
      rec: "bg-violet-50 dark:bg-violet-950 border-violet-100 dark:border-violet-900 text-violet-800 dark:text-violet-200",
    },
  };

  const s = accentStyles[accent];

  return (
    <Card className={cn("border", s.border)}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("p-2 rounded-lg flex-shrink-0 mt-0.5", s.iconBg)}>
            {anomalyIcon(anomaly.anomalyType)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {labelFromType(anomaly.anomalyType)}
              </p>
              <Badge className={cn("text-xs", s.badge)}>
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Detected by AI
              </Badge>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
              {anomaly.message}
            </p>

            {anomaly.recommendation && (
              <div className={cn("rounded-lg border px-3 py-2 text-xs leading-relaxed", s.rec)}>
                <span className="font-semibold">Recommendation: </span>
                {anomaly.recommendation}
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Detected {formatDate(anomaly.createdAt)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
