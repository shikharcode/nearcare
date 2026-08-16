import { UserButton } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LogOut } from "lucide-react";
import { NearCareLogo } from "@/components/shared/nearcare-logo";
import React from "react";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SosButton } from "@/components/shared/sos-button";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  let displayName = "My Account";

  if (userId) {
    // Single lightweight query — no currentUser() Clerk API call
    const [row] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (row?.name) displayName = row.name;
  }

  const firstName = displayName.split(" ")[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar — desktop only */}
      <aside className="w-64 flex flex-col fixed h-full z-20 hidden md:flex border-r border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Subtle gradient sidebar background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/10 pointer-events-none" />

        <div className="relative flex flex-col h-full">
          {/* Logo area */}
          <div className="flex items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <NearCareLogo size="md" showTagline={false} />
          </div>

          <SidebarNav />

          {/* User area at bottom */}
          <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="flex-shrink-0">
                <UserButton />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">
                  {firstName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5">
                  {displayName !== firstName ? displayName : "Personal account"}
                </p>
              </div>
              <ThemeToggle />
            </div>
            <SignOutButton redirectUrl="/">
              <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800/80 flex items-center px-4 z-20 md:hidden shadow-sm">
        <NearCareLogo size="sm" />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <SidebarNav mobile />

      {/* Main content */}
      <main className="md:ml-64 flex-1 p-4 md:p-8 pt-[72px] md:pt-8 pb-[86px] md:pb-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      <SosButton />
    </div>
  );
}
