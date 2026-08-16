"use client"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
  className?: string
}

const sizes = {
  sm: { icon: 32, text: 22, tagline: 10, gap: 10 },
  md: { icon: 44, text: 30, tagline: 11, gap: 12 },
  lg: { icon: 64, text: 44, tagline: 13, gap: 16 },
}

export function NearCareLogo({ size = "md", showTagline = false, className }: LogoProps) {
  const s = sizes[size]

  return (
    <div className={cn("flex items-center", className)} style={{ gap: s.gap }}>
      {/* Icon */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 288 288" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="nc-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb"/>
            <stop offset="100%" stopColor="#7c3aed"/>
          </linearGradient>
          <linearGradient id="nc-ecg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3"/>
            <stop offset="50%" stopColor="white" stopOpacity="1"/>
            <stop offset="100%" stopColor="white" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
        <rect width="288" height="288" rx="60" fill="url(#nc-icon-grad)"/>
        <path
          d="M144 244C144 244 50 180 50 120C50 87 74 66 100 66C118 66 134 76 144 92C154 76 170 66 188 66C214 66 238 87 238 120C238 180 144 244 144 244Z"
          fill="white" fillOpacity="0.93"
        />
        <polyline
          points="58,124 85,124 99,100 114,152 126,114 139,124 234,124"
          fill="none" stroke="url(#nc-ecg-grad)" strokeWidth="9"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>

      {/* Wordmark */}
      <div className="flex flex-col" style={{ lineHeight: 1 }}>
        <div className="flex items-baseline" style={{ gap: 0 }}>
          <span
            className="font-extrabold bg-gradient-to-br from-blue-600 to-violet-600 bg-clip-text text-transparent"
            style={{ fontSize: s.text, letterSpacing: "-0.03em" }}
          >
            Near
          </span>
          <span
            className="font-light text-gray-900 dark:text-gray-100"
            style={{ fontSize: s.text, letterSpacing: "-0.03em" }}
          >
            Care
          </span>
        </div>
        {showTagline && (
          <span
            className="font-medium tracking-widest text-gray-400 dark:text-gray-500"
            style={{ fontSize: s.tagline, letterSpacing: "0.18em", marginTop: 3 }}
          >
            YOUR PERSONAL HEALTH OS
          </span>
        )}
      </div>
    </div>
  )
}
