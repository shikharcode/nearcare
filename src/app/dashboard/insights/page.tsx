'use client'

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Loader2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Brain,
  RefreshCw,
} from "lucide-react";

// ─── Score colour helpers ──────────────────────────────────────────────────────

function scoreColor(score: number): {
  ring: string;
  text: string;
  gradient: string;
  badge: string;
} {
  if (score <= 4)
    return {
      ring: "#ef4444",
      text: "text-red-400",
      gradient: "from-red-700 via-rose-700 to-red-800",
      badge: "bg-red-500/20 text-red-200",
    };
  if (score <= 6)
    return {
      ring: "#f59e0b",
      text: "text-amber-400",
      gradient: "from-amber-700 via-orange-700 to-amber-800",
      badge: "bg-amber-500/20 text-amber-200",
    };
  if (score <= 8)
    return {
      ring: "#22c55e",
      text: "text-green-400",
      gradient: "from-emerald-700 via-green-700 to-teal-700",
      badge: "bg-green-500/20 text-green-200",
    };
  return {
    ring: "#3b82f6",
    text: "text-blue-300",
    gradient: "from-blue-700 via-indigo-700 to-blue-800",
    badge: "bg-blue-500/20 text-blue-200",
  };
}

function scoreLabel(score: number) {
  if (score <= 4) return "Needs Attention";
  if (score <= 6) return "Fair";
  if (score <= 8) return "Good";
  return "Excellent";
}

// ─── Animated SVG ring ────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 10) * circumference);
    }, 120);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 128 128"
      >
        {/* track */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="10"
        />
        {/* fill */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="relative text-center">
        <span className="text-7xl font-black text-white leading-none">
          {score}
        </span>
        <span className="block text-white/60 text-sm font-medium -mt-1">/10</span>
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  iconBg: string;
  items: string[];
  renderItem: (item: string, index: number) => React.ReactNode;
  delay: string;
}

function SectionCard({ icon, title, iconBg, items, renderItem, delay }: SectionProps) {
  if (!items?.length) return null;
  return (
    <div
      className={cn(
        "animate-fade-in-up rounded-3xl shadow-xl overflow-hidden",
        "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800",
        delay
      )}
    >
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0", iconBg)}>
          {icon}
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="px-5 pb-5 space-y-3">
        {items.map((item: string, i: number) => renderItem(item, i))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/summary");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSummary(data);
      setGeneratedAt(new Date());
    } catch {
      toast.error("Failed to generate summary. Check your Gemini API key.");
    } finally {
      setLoading(false);
    }
  };

  const colors = summary ? scoreColor(summary.overallScore) : null;

  return (
    <div className="space-y-5 pb-8">
      {/* Page header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Health Insights</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Powered by Google Gemini — analyzes your last 7 days
        </p>
      </div>

      {!summary ? (
        /* ── PRE-GENERATION SCREEN ─────────────────────────────────────────── */
        <div className="animate-fade-in-up relative rounded-3xl min-h-[360px] flex flex-col items-center justify-center text-center px-8 py-14 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-2xl">
          {/* decorative blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/10 -translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-pink-400/20 translate-x-1/4 translate-y-1/4 blur-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.1),_transparent_60%)] pointer-events-none rounded-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* animated brain / sparkle icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl animate-pulse-ring">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 shadow-lg">
                <Sparkles className="h-4 w-4 text-yellow-900" />
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white leading-tight">
                Your Weekly Health Intelligence
              </h2>
              <p className="text-white/80 text-base max-w-xs mx-auto leading-relaxed">
                AI analyzes your mood, sleep, energy, symptoms, and medication
                adherence to surface patterns and personalised recommendations.
              </p>
            </div>

            {generatedAt && (
              <p className="text-white/60 text-sm">
                Last generated {generatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} on{" "}
                {generatedAt.toLocaleDateString()}
              </p>
            )}

            <button
              type="button"
              onClick={fetchSummary}
              disabled={loading}
              className="h-14 w-full max-w-xs rounded-2xl bg-white font-bold text-base shadow-xl text-purple-700 hover:bg-white/90 active:scale-95 transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  <span>Analyzing your health…</span>
                </>
              ) : (
                <span>Generate Insights ✨</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ── RESULTS ──────────────────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Health Score Card */}
          <div
            className={cn(
              "animate-fade-in-up relative rounded-3xl overflow-hidden shadow-2xl p-6",
              "bg-gradient-to-br",
              colors!.gradient
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12),_transparent_60%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-bold text-lg">Overall Health Score</h2>
                  <span
                    className={cn(
                      "inline-block mt-1 px-3 py-0.5 rounded-full text-sm font-semibold",
                      colors!.badge
                    )}
                  >
                    {scoreLabel(summary.overallScore)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>

              <ScoreRing score={summary.overallScore} color={colors!.ring} />

              {summary.summary && (
                <p className="mt-5 text-white/85 text-base text-center leading-relaxed">
                  {summary.summary}
                </p>
              )}
            </div>
          </div>

          {/* Highlights */}
          <SectionCard
            icon={<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
            title="What's Going Well"
            iconBg="bg-green-100 dark:bg-green-900/50"
            items={summary.highlights}
            delay="delay-75"
            renderItem={(item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl bg-green-50 dark:bg-green-950/40 px-4 py-3"
              >
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </span>
                <span className="text-base text-gray-800 dark:text-gray-100 leading-snug">{item}</span>
              </div>
            )}
          />

          {/* Concerns */}
          <SectionCard
            icon={<AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            title="Things to Watch"
            iconBg="bg-amber-100 dark:bg-amber-900/50"
            items={summary.concerns}
            delay="delay-150"
            renderItem={(item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 px-4 py-3"
              >
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </span>
                <span className="text-base text-gray-800 dark:text-gray-100 leading-snug">{item}</span>
              </div>
            )}
          />

          {/* Patterns */}
          <SectionCard
            icon={<TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            title="Patterns Detected"
            iconBg="bg-blue-100 dark:bg-blue-900/50"
            items={summary.patterns}
            delay="delay-225"
            renderItem={(item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 px-4 py-3"
              >
                <span className="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <span className="text-base text-gray-800 dark:text-gray-100 leading-snug">{item}</span>
              </div>
            )}
          />

          {/* Recommendations */}
          <SectionCard
            icon={<Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            title="Recommendations"
            iconBg="bg-purple-100 dark:bg-purple-900/50"
            items={summary.recommendations}
            delay="delay-300"
            renderItem={(item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 px-4 py-3"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-base text-gray-800 dark:text-gray-100 leading-snug">{item}</span>
              </div>
            )}
          />

          {/* Refresh row */}
          <div className="animate-fade-in-up delay-375 flex items-center justify-between pt-1">
            {generatedAt && (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Generated {generatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
                {generatedAt.toLocaleDateString()}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSummary}
              disabled={loading}
              className={cn(
                "ml-auto h-10 rounded-xl gap-2 text-sm font-medium",
                "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300",
                "hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all duration-200"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
