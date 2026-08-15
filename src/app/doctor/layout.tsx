import { UserButton } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { LogOut, Stethoscope } from "lucide-react";
import React from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { DoctorSidebarNav, DoctorMobileNav } from "./doctor-nav";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar — desktop only */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed h-full z-20 hidden md:flex">
        {/* Logo */}
        <div className="flex flex-col px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <span className="font-bold text-gray-900 dark:text-white text-lg">NearCare</span>
          </div>
          <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mt-0.5 ml-7">Doctor Portal</p>
        </div>

        {/* Nav links — client component with active state */}
        <DoctorSidebarNav />

        {/* Bottom user area */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <UserButton />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">Account</p>
            </div>
            <ThemeToggle />
          </div>
          <SignOutButton redirectUrl="/">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-colors">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 z-20 md:hidden">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-blue-500" />
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">NearCare</span>
            <span className="text-xs text-blue-500 ml-1">Doctor Portal</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>

      {/* Mobile bottom nav — client component with active state */}
      <DoctorMobileNav />

      {/* Main content */}
      <main className="md:ml-64 flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
