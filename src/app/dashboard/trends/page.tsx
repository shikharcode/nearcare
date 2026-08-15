"use client";

import { useEffect, useState, useMemo } from "react";
import { format, parseISO, subDays } from "date-fns";
import {
  LineChart,
  AreaChart,
  BarChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ---- Types ----------------------------------------------------------------

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
}

type Range = "7D" | "30D" | "90D";

// ---- Helpers ---------------------------------------------------------------

function fmtDate(dateStr: string) {
  return format(parseISO(dateStr), "MMM d");
}

function avg(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function NoData() {
  return (
    <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-600 text-sm">
      No data for this period
    </div>
  );
}

// Custom tooltip wrapper
function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ---- Range button ----------------------------------------------------------

function RangeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors",
        active
          ? "bg-blue-600 text-white shadow"
          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
      )}
    >
      {label}
    </button>
  );
}

// ---- Summary stat ----------------------------------------------------------

function SummaryStat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string | number | null;
  unit: string;
  color: string;
}) {
  return (
    <Card className={cn("border-l-4", color)}>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value ?? "—"}
          {value != null && (
            <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

// ---- Main page -------------------------------------------------------------

export default function TrendsPage() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("30D");

  useEffect(() => {
    fetch("/api/health-logs?limit=200")
      .then((r) => r.json())
      .then((data: HealthLog[]) => {
        // Sort ascending by date for charts
        setLogs([...data].sort((a, b) => a.date.localeCompare(b.date)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cutoff = useMemo(() => {
    const days = range === "7D" ? 7 : range === "30D" ? 30 : 90;
    return subDays(new Date(), days).toISOString().slice(0, 10);
  }, [range]);

  const filtered = useMemo(
    () => logs.filter((l) => l.date >= cutoff),
    [logs, cutoff]
  );

  // Summary stats
  const avgSleep = avg(filtered.map((l) => l.sleep));
  const avgHR = avg(filtered.map((l) => l.heartRate));
  const avgMood = avg(filtered.map((l) => l.mood));
  const totalSteps = filtered.reduce((s, l) => s + (l.steps ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading vitals...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vitals Trends</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Track your health metrics over time
          </p>
        </div>
        <div className="flex gap-2">
          {(["7D", "30D", "90D"] as Range[]).map((r) => (
            <RangeButton key={r} label={r} active={range === r} onClick={() => setRange(r)} />
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryStat label="Avg Sleep" value={avgSleep} unit="h" color="border-l-blue-500" />
        <SummaryStat label="Avg Heart Rate" value={avgHR} unit="bpm" color="border-l-red-500" />
        <SummaryStat
          label="Avg Mood"
          value={avgMood != null ? avgMood.toFixed(1) : null}
          unit="/ 5"
          color="border-l-yellow-500"
        />
        <SummaryStat
          label="Total Steps"
          value={totalSteps > 0 ? totalSteps.toLocaleString() : null}
          unit="steps"
          color="border-l-green-500"
        />
      </div>

      {/* ---- Blood Pressure ---- */}
      <BPChart data={filtered} />

      {/* ---- Heart Rate ---- */}
      <HeartRateChart data={filtered} />

      {/* ---- Blood Sugar ---- */}
      <BloodSugarChart data={filtered} />

      {/* ---- Weight ---- */}
      <WeightChart data={filtered} />

      {/* ---- Sleep ---- */}
      <SleepChart data={filtered} />

      {/* ---- Mood ---- */}
      <MoodChart data={filtered} />
    </div>
  );
}

// ---- Blood Pressure Chart --------------------------------------------------

function BPChart({ data }: { data: HealthLog[] }) {
  const chartData = data
    .filter((l) => l.systolic != null && l.diastolic != null)
    .map((l) => ({
      date: fmtDate(l.date),
      Systolic: l.systolic!,
      Diastolic: l.diastolic!,
    }));

  const latest = chartData[chartData.length - 1];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          Blood Pressure
          {latest ? (
            <Badge variant="secondary" className="text-xs font-semibold">
              {latest.Systolic}/{latest.Diastolic} mmHg
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <NoData />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 180]} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {/* Normal systolic range shading */}
              <ReferenceArea y1={90} y2={140} fill="rgba(99,102,241,0.07)" />
              <Line
                type="monotone"
                dataKey="Systolic"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3b82f6" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Diastolic"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: "#6366f1" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Heart Rate Chart ------------------------------------------------------

function HeartRateChart({ data }: { data: HealthLog[] }) {
  const chartData = data
    .filter((l) => l.heartRate != null)
    .map((l) => ({ date: fmtDate(l.date), "Heart Rate": l.heartRate! }));

  const latest = chartData[chartData.length - 1];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          Heart Rate
          {latest ? (
            <Badge variant="secondary" className="text-xs font-semibold">
              {latest["Heart Rate"]} bpm
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <NoData />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[40, 160]} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltipContent />} />
              <ReferenceArea y1={60} y2={100} fill="rgba(239,68,68,0.07)" />
              <Area
                type="monotone"
                dataKey="Heart Rate"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#hrGrad)"
                dot={{ r: 3, fill: "#ef4444" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Blood Sugar Chart -----------------------------------------------------

function BloodSugarChart({ data }: { data: HealthLog[] }) {
  const chartData = data
    .filter((l) => l.bloodSugar != null)
    .map((l) => ({ date: fmtDate(l.date), "Blood Sugar": l.bloodSugar! }));

  const latest = chartData[chartData.length - 1];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          Blood Sugar
          {latest ? (
            <Badge variant="secondary" className="text-xs font-semibold">
              {latest["Blood Sugar"]} mg/dL
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <NoData />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="bsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[40, 280]} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltipContent />} />
              {/* Normal range */}
              <ReferenceArea y1={70} y2={180} fill="rgba(245,158,11,0.07)" />
              {/* Threshold lines */}
              <ReferenceLine
                y={70}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: "Low", position: "insideTopRight", fontSize: 10, fill: "#ef4444" }}
              />
              <ReferenceLine
                y={180}
                stroke="#f97316"
                strokeDasharray="4 4"
                label={{ value: "High", position: "insideTopRight", fontSize: 10, fill: "#f97316" }}
              />
              <Area
                type="monotone"
                dataKey="Blood Sugar"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#bsGrad)"
                dot={{ r: 3, fill: "#f59e0b" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Weight Chart ----------------------------------------------------------

function WeightChart({ data }: { data: HealthLog[] }) {
  const chartData = data
    .filter((l) => l.weight != null)
    .map((l) => ({ date: fmtDate(l.date), Weight: l.weight! }));

  const latest = chartData[chartData.length - 1];
  const first = chartData[0];

  let trendEl = null;
  if (first && latest && chartData.length >= 2) {
    const delta = Math.round((latest.Weight - first.Weight) * 10) / 10;
    const isUp = delta > 0;
    const isFlat = delta === 0;
    trendEl = (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold",
          isFlat
            ? "text-gray-500"
            : isUp
            ? "text-red-500"
            : "text-green-500"
        )}
      >
        {isFlat ? (
          <Minus className="h-3 w-3" />
        ) : isUp ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {isFlat ? "No change" : `${isUp ? "+" : ""}${delta} kg`}
      </span>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-3">
            Weight
            {trendEl}
          </span>
          {latest ? (
            <Badge variant="secondary" className="text-xs font-semibold">
              {latest.Weight} kg
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <NoData />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="Weight"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 3, fill: "#a855f7" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Sleep Chart -----------------------------------------------------------

function SleepChart({ data }: { data: HealthLog[] }) {
  const chartData = data
    .filter((l) => l.sleep != null)
    .map((l) => ({ date: fmtDate(l.date), Sleep: l.sleep!, color: sleepColor(l.sleep!) }));

  const latest = chartData[chartData.length - 1];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          Sleep
          {latest ? (
            <Badge variant="secondary" className="text-xs font-semibold">
              {latest.Sleep}h
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <NoData />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltipContent />} />
              <ReferenceLine
                y={7}
                stroke="#3b82f6"
                strokeDasharray="4 4"
                label={{ value: "7h goal", position: "insideTopRight", fontSize: 10, fill: "#3b82f6" }}
              />
              <Bar dataKey="Sleep" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function sleepColor(hours: number): string {
  if (hours >= 7) return "#22c55e"; // green
  if (hours >= 6) return "#eab308"; // yellow
  return "#ef4444"; // red
}

// ---- Mood Chart ------------------------------------------------------------

function MoodChart({ data }: { data: HealthLog[] }) {
  const chartData = data
    .filter((l) => l.mood != null)
    .map((l) => ({ date: fmtDate(l.date), Mood: l.mood!, color: moodBarColor(l.mood!) }));

  const latest = chartData[chartData.length - 1];
  const moodLabels: Record<number, string> = {
    1: "Terrible",
    2: "Bad",
    3: "Okay",
    4: "Good",
    5: "Great",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          Mood
          {latest ? (
            <Badge variant="secondary" className="text-xs font-semibold">
              {latest.Mood} — {moodLabels[latest.Mood] ?? ""}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <NoData />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="Mood" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function moodBarColor(mood: number): string {
  switch (mood) {
    case 1:
      return "#ef4444"; // red
    case 2:
      return "#f97316"; // orange
    case 3:
      return "#eab308"; // yellow
    case 4:
      return "#84cc16"; // lime
    case 5:
      return "#22c55e"; // green
    default:
      return "#9ca3af";
  }
}
