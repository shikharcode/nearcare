'use client'

import { useState } from "react";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  Pill,
  FileText,
  Share2,
  TrendingUp,
  Users,
  UserCircle,
  Stethoscope,
  ClipboardList,
  MessageCircle,
  Search,
  Grid2X2,
  Heart,
  Download,
  CheckCircle2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

// Section-grouped nav structure for desktop sidebar
const navSections = [
  {
    label: "HEALTH",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/health-log", label: "Health Log", icon: Activity },
      { href: "/dashboard/medications", label: "Medications", icon: Pill },
      { href: "/dashboard/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { href: "/dashboard/insights", label: "AI Insights", icon: TrendingUp },
      { href: "/dashboard/chat", label: "AI Chat", icon: MessageCircle },
      { href: "/dashboard/trends", label: "Trends", icon: TrendingUp },
      { href: "/dashboard/history", label: "History", icon: ClipboardList },
      { href: "/dashboard/import", label: "Import Data", icon: Download },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { href: "/dashboard/share", label: "Share", icon: Share2 },
      { href: "/dashboard/family", label: "Family", icon: Users },
      { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
    ],
  },
];

// 4 items always visible in mobile bottom bar
const BOTTOM_NAV_HREFS = [
  "/dashboard",
  "/dashboard/checkin",
  "/dashboard/medications",
  "/dashboard/chat",
];

const allLinks = [
  { href: "/dashboard/checkin", label: "Check In Today", icon: Heart },
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/health-log", label: "Health Log", icon: Activity },
  { href: "/dashboard/medications", label: "Medications", icon: Pill },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/insights", label: "AI Insights", icon: TrendingUp },
  { href: "/dashboard/chat", label: "AI Chat", icon: MessageCircle },
  { href: "/dashboard/trends", label: "Trends", icon: TrendingUp },
  { href: "/dashboard/history", label: "History", icon: ClipboardList },
  { href: "/dashboard/share", label: "Share", icon: Share2 },
  { href: "/dashboard/family", label: "Family", icon: Users },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/import", label: "Import Data", icon: Download },
];

const bottomNavLinks = allLinks.filter((l) => BOTTOM_NAV_HREFS.includes(l.href));

// Everything else goes into the More sheet
const moreLinks = [
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/trends", label: "Trends", icon: TrendingUp },
  { href: "/dashboard/history", label: "History", icon: ClipboardList },
  { href: "/dashboard/family", label: "Family", icon: Users },
  { href: "/dashboard/share", label: "Share", icon: Share2 },
  { href: "/dashboard/search", label: "Search", icon: Search },
  { href: "/dashboard/insights", label: "Insights", icon: TrendingUp },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

// Icon background colors for More sheet grid
const moreIconColors: Record<string, string> = {
  "/dashboard/documents": "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
  "/dashboard/trends": "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
  "/dashboard/history": "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  "/dashboard/family": "bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400",
  "/dashboard/share": "bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400",
  "/dashboard/search": "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
  "/dashboard/insights": "bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400",
  "/dashboard/profile": "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

export function SidebarNav({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  // Mobile bottom nav
  if (mobile) {
    const moreActive = moreLinks.some((l) => pathname === l.href);

    return (
      <>
        <nav
          className="fixed bottom-0 left-0 right-0 z-20 md:hidden"
          style={{ height: 70 }}
        >
          {/* Top shadow/blur bar */}
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]" />
          <div className="relative flex items-center justify-around px-1 h-full">
            {bottomNavLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              const isCheckin = href === "/dashboard/checkin";
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all min-w-0 relative"
                >
                  {/* Active dot indicator above icon */}
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
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all min-w-0 relative"
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
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[75vh] pb-10">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-xl font-bold text-gray-900 dark:text-white">
                All Features
              </SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-3 px-2">
              {moreLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                const colorClass = moreIconColors[href] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
                return (
                  <SheetClose
                    key={href}
                    render={<button />}
                    onClick={() => {
                      setMoreOpen(false);
                      router.push(href);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl px-2 py-4 transition-all active:scale-95",
                      active
                        ? "bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-200 dark:ring-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                        active ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" : colorClass
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
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop sidebar nav
  return (
    <>
      <div className="px-3 pt-4">
        <Link
          href="/dashboard/search"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
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

      {/* Check-in special item */}
      <div className="px-3 pt-3">
        <Link
          href="/dashboard/checkin"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
            pathname === "/dashboard/checkin"
              ? "bg-gradient-to-r from-emerald-500/15 to-teal-500/5 border-l-2 border-emerald-500"
              : "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-950/60 dark:hover:to-teal-950/40 border-l-2 border-emerald-300 dark:border-emerald-700"
          )}
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
            <Heart className="h-5 w-5 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-base font-semibold text-emerald-700 dark:text-emerald-400 block leading-tight">
              Check In Today
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1.5 text-[11px] font-bold tracking-widest text-gray-400 dark:text-gray-600 uppercase">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-all group",
                      active
                        ? "bg-gradient-to-r from-blue-600/10 to-blue-500/5 border-l-2 border-blue-600 text-blue-700 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 border-l-2 border-transparent hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
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
          </div>
        ))}
      </nav>

      <div className="px-3 pb-3">
        <Link
          href="/doctor"
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all border border-blue-200 dark:border-blue-800 hover:-translate-y-0.5 hover:shadow-md"
        >
          <Stethoscope className="h-5 w-5 flex-shrink-0" />
          Switch to Doctor Portal
        </Link>
      </div>
    </>
  );
}
