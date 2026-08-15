"use client";

import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

interface MoodDataPoint {
  date: string;
  mood: number;
}

interface MoodSparklineProps {
  data: MoodDataPoint[];
}

const MOOD_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#22c55e",
  5: "#3b82f6",
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const mood: number = payload[0]?.value;
  const date: string = payload[0]?.payload?.date;
  const emojis = ["", "😞", "😕", "😐", "🙂", "😄"];
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs shadow-sm">
      <span className="text-gray-500 dark:text-gray-400">{date} </span>
      <span>{emojis[mood] ?? mood}</span>
    </div>
  );
}

export function MoodSparkline({ data }: MoodSparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[60px] flex items-center justify-center text-xs text-gray-400 dark:text-gray-600">
        No mood data
      </div>
    );
  }

  // Determine dominant color from average mood
  const avg = data.reduce((s, d) => s + d.mood, 0) / data.length;
  const roundedAvg = Math.round(avg) as keyof typeof MOOD_COLORS;
  const strokeColor = MOOD_COLORS[roundedAvg] ?? "#6366f1";
  const fillColor = strokeColor + "33"; // 20% opacity hex

  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="mood"
          stroke={strokeColor}
          strokeWidth={2}
          fill="url(#moodGradient)"
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0, fill: strokeColor }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
