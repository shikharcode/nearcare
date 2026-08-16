'use client'

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Heart,
  Pill,
  Bot,
  Grid2X2,
  Activity,
  FileText,
  TrendingUp,
  ClipboardList,
  MessageCircle,
  CalendarCheck,
  AlertCircle,
  UserCircle,
  Users,
  Share2,
  FileHeart,
  Download,
  ShieldCheck,
  Stethoscope,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

// ─── Desktop nav structure ────────────────────────────────────────────────────

const desktopSections = [
  {
    id: "home",
    label: "Home",
    Icon: LayoutDashboard,
    badgeColor: "bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/checkin", label: "Check In Today", icon: Heart, isCheckin: true },
    ],
  },
  {
    id: "myhealth",
    label: "My Health",
    Icon: Heart,
    badgeColor: "bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400",
    items: [
      { href: "/dashboard/health-log", label: "Health Log", icon: Activity },
      { href: "/dashboard/medications", label: "Medications", icon: Pill },
      { href: "/dashboard/documents", label: "Documents", icon: FileText },
      { href: "/dashboard/trends", label: "Trends", icon: TrendingUp },
      { href: "/dashboard/history", label: "History", icon: ClipboardList },
    ],
  },
  {
    id: "ai",
    label: "AI Assistant",
    Icon: Bot,
    badgeColor: "bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-400",
    items: [
      { href: "/dashboard/chat", label: "AI Chat", icon: MessageCircle },
      { href: "/dashboard/insights", label: "Weekly Insights", icon: TrendingUp },
      { href: "/dashboard/appointment", label: "Appointment Prep", icon: CalendarCheck },
      { href: "/dashboard/anomalies", label: "Health Anomalies", icon: AlertCircle },
    ],
  },
  {
    id: "healthid",
    label: "My Health ID",
    Icon: ShieldCheck,
    badgeColor: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400",
    items: [
      { href: "/dashboard/profile", label: "My Profile", icon: UserCircle },
      { href: "/dashboard/family", label: "Family & Alerts", icon: Users },
      { href: "/dashboard/share", label: "Share with Doctor", icon: Share2 },
      { href: "/dashboard/passport", label: "Health Passport", icon: FileHeart },
      { href: "/dashboard/profile/abha", label: "ABHA Health ID", icon: ShieldCheck },
      { href: "/dashboard/import", label: "Import Data", icon: Download },
    ],
  },
];

// ─── Mobile bottom nav ────────────────────────────────────────────────────────

const bottomNavItems = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard, isCheckin: false },
  { href: "/dashboard/checkin", label: "Check In", Icon: Heart, isCheckin: true },
  { href: "/dashboard/medications", label: "Meds", Icon: Pill, isCheckin: false },
  { href: "/dashboard/chat", label: "AI", Icon: Bot, isCheckin: false },
];

// ─── More sheet sections ──────────────────────────────────────────────────────

const moreSheetSections = [
  {
    label: "MY HEALTH",
    items: [
      { href: "/dashboard/health-log", label: "Health Log", icon: Activity, color: "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400" },
      { href: "/dashboard/documents", label: "Documents", icon: FileText, color: "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400" },
      { href: "/dashboard/trends", label: "Trends", icon: TrendingUp, color: "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400" },
      { href: "/dashboard/history", label: "History", icon: ClipboardList, color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
    ],
  },
  {
    label: "AI TOOLS",
    items: [
      { href: "/dashboard/insights", label: "Insights", icon: TrendingUp, color: "bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400" },
      { href: "/dashboard/appointment", label: "Appointment Prep", icon: CalendarCheck, color: "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400" },
      { href: "/dashboard/anomalies", label: "Anomalies", icon: AlertCircle, color: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" },
    ],
  },
  {
    label: "MY HEALTH ID",
    items: [
      { href: "/dashboard/profile", label: "Profile", icon: UserCircle, color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" },
      { href: "/dashboard/family", label: "Family", icon: Users, color: "bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400" },
      { href: "/dashboard/share", label: "Share", icon: Share2, color: "bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400" },
      { href: "/dashboard/passport", label: "Passport", icon: FileHeart, color: "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" },
      { href: "/dashboard/profile/abha", label: "ABHA", icon: ShieldCheck, color: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400" },
      { href: "/dashboard/import", label: "Import Data", icon: Download, color: "bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400" },
    ],
  },
  {
    label: "PLATFORM",
    items: [
      { href: "/dashboard/features", label: "Features", icon: Sparkles, color: "bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400" },
    ],
  },
];

// ─── All hrefs in More sheet (for active detection) ──────────────────────────

const moreSheetHrefs = moreSheetSections.flatMap((s) => s.items.map((i) => i.href));

// ─── Component ────────────────────────────────────────────────────────────────

export function SidebarNav({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Mobile ─────────────────────────────────────────────────────────────────

  if (mobile) {
    const moreActive = moreSheetHrefs.some((h) => pathname === h);

    return (
      <>
        <nav
          className="fixed bottom-0 left-0 right-0 z-20 md:hidden"
          style={{ height: 70 }}
        >
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]" />
          <div className="relative flex items-center justify-around px-1 h-full">
            {bottomNavItems.map(({ href, label, Icon, isCheckin }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all min-w-0 relative min-h-[44px] justify-center"
                >
                  {active && (
                    <span
                      className={cn(
                        "absolute top-1 w-1.5 h-1.5 rounded-full",
                        isCheckin ? "bg-emerald-500" : "bg-blue-600"
                      )}
                    />
                  )}
                  <Icon
                    className={cn(
                      "h-6 w-6 flex-shrink-0 transition-all",
                      isCheckin
                        ? active
                          ? "text-emerald-600 scale-110"
                          : "text-emerald-500"
                        : active
                        ? "text-blue-600 scale-110"
                        : "text-gray-400 dark:text-gray-500"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[11px] font-medium truncate leading-none",
                      isCheckin
                        ? active
                          ? "text-emerald-600"
                          : "text-emerald-500"
                        : active
                        ? "text-blue-600"
                        : "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* More button */}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all min-w-0 relative min-h-[44px] justify-center"
            >
              {moreActive && (
                <span className="absolute top-1 w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
              <Grid2X2
                className={cn(
                  "h-6 w-6 flex-shrink-0 transition-all",
                  moreActive ? "text-blue-600 scale-110" : "text-gray-400 dark:text-gray-500"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-medium truncate leading-none",
                  moreActive ? "text-blue-600" : "text-gray-400 dark:text-gray-500"
                )}
              >
                More
              </span>
            </button>
          </div>
        </nav>

        {/* More bottom sheet */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] pb-10 overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-xl font-bold text-gray-900 dark:text-white">
                More
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-6 px-2">
              {moreSheetSections.map((section) => (
                <div key={section.label}>
                  <p className="text-[11px] font-bold tracking-widest text-gray-400 dark:text-gray-600 uppercase mb-3">
                    {section.label}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {section.items.map(({ href, label, icon: Icon, color }) => {
                      const active = pathname === href;
                      return (
                        <SheetClose
                          key={href}
                          render={<button />}
                          onClick={() => {
                            setMoreOpen(false);
                            router.push(href);
                          }}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-2xl px-2 py-4 transition-all active:scale-95 min-h-[44px]",
                            active
                              ? "bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-200 dark:ring-blue-800"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          <div
                            className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                              active
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                                : color
                            )}
                          >
                            <Icon className="h-6 w-6" />
                          </div>
                          <span className="text-[11px] font-semibold text-center leading-tight text-gray-700 dark:text-gray-300">
                            {label}
                          </span>
                        </SheetClose>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // ── Desktop sidebar ────────────────────────────────────────────────────────

  return (
    <>
      {/* Search */}
      <div className="px-3 pt-4">
        <Link
          href="/dashboard/search"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all min-h-[44px]",
            pathname === "/dashboard/search"
              ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <Search className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium">Search</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-lg text-[10px] font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400">
            /
          </kbd>
        </Link>
      </div>

      {/* Sections */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
        {desktopSections.map((section) => {
          const isOpen = !collapsed[section.id];
          const SectionIcon = section.Icon;

          return (
            <div key={section.id} className="space-y-0.5">
              {/* Section header toggle */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all hover:bg-gray-100/80 dark:hover:bg-gray-800/60 group min-h-[44px]"
              >
                <span
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                    section.badgeColor
                  )}
                >
                  <SectionIcon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {section.label}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                )}
              </button>

              {/* Section items */}
              {isOpen && (
                <div className="space-y-0.5 pl-1">
                  {section.items.map(({ href, label, icon: Icon, isCheckin }) => {
                    const active = pathname === href;

                    if (isCheckin) {
                      // Check In — always green, always visible, pulse dot
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group min-h-[44px]",
                            "border-l-[5px]",
                            active
                              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                              : "border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-500"
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />
                          <span className="flex-1 text-base font-semibold">{label}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-all group min-h-[44px]",
                          "border-l-[5px]",
                          active
                            ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-400"
                            : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0 transition-colors",
                            active
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                          )}
                        />
                        <span className="flex-1">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Features */}
      <div className="px-3 pb-1">
        <Link
          href="/dashboard/features"
          className={cn(
            "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px]",
            pathname === "/dashboard/features"
              ? "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white border border-transparent"
          )}
        >
          <Sparkles className="h-5 w-5 flex-shrink-0" />
          All Features
        </Link>
      </div>

      {/* Doctor Portal */}
      <div className="px-3 pb-3">
        <Link
          href="/doctor"
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all border border-blue-200 dark:border-blue-800 hover:-translate-y-0.5 hover:shadow-md min-h-[44px]"
        >
          <Stethoscope className="h-5 w-5 flex-shrink-0" />
          Switch to Doctor Portal
        </Link>
      </div>
    </>
  );
}
