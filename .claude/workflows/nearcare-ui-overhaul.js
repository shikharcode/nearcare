export const meta = {
  name: "nearcare-ui-overhaul",
  description: "NearCare full UI overhaul: creative landing page, fix logout, page transitions, and polish all pages",
  phases: [
    { title: "Landing & Auth", detail: "Creative landing page, beautiful sign-in/sign-up pages" },
    { title: "Dashboard & Nav", detail: "Fix logout, page transitions, sidebar polish" },
    { title: "Page Polish", detail: "Health log, medications, documents, insights, family pages" },
    { title: "Verify", detail: "TypeScript check and fix" },
  ],
};

phase("Landing & Auth");

const [landingResult, authResult] = await parallel([
  () => agent(`
You are working on the NearCare health app at /Users/singhs1/myprod/carebridge.
Stack: Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui components.

TASK: Completely rewrite /Users/singhs1/myprod/carebridge/src/app/page.tsx with a stunning, creative landing page.

Design requirements:
- Hero section: large bold headline with gradient text, animated pulse dot, compelling subheadline
- Feature showcase: 3-column cards with colored icon backgrounds, hover effects
- Stats bar: "53M caregivers · 0 setup required · Free forever" 
- How it works: 3 simple steps with numbered circles
- CTA section: gradient background, large call to action
- Footer: minimal with links

Use ONLY inline Tailwind classes. No external libraries. Server component (no 'use client').
Import from: next/link, @/components/ui/button, lucide-react

The page must feel premium — like Linear or Vercel's landing page but for health.
Color scheme: Deep blue (#1e40af) to blue (#3b82f6) gradients, white cards, clean typography.

Key message: "Keep your family close. Keep your health closer."
Subheadline: "NearCare monitors your vitals, alerts your family instantly, and stores your medical history — all in one beautiful app."

Write the complete file. No placeholder content.
`, { label: "Creative Landing Page" }),

  () => agent(`
You are working on the NearCare health app at /Users/singhs1/myprod/carebridge.
Stack: Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui.

TASK 1: Rewrite /Users/singhs1/myprod/carebridge/src/app/sign-in/[[...sign-in]]/page.tsx
Make it beautiful with a split layout:
- Left side: deep blue gradient background with NearCare branding, tagline, 3 feature bullets with icons
- Right side: white background with centered SignIn component

\`\`\`tsx
import { SignIn } from "@clerk/nextjs";
import { Heart, Shield, Bell, Users } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left - Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Heart className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-xl font-bold text-white">NearCare</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Your family&apos;s health,<br />always within reach.
          </h1>
          <p className="text-blue-200 text-lg mb-10">Track vitals, get alerts, stay connected.</p>
          <div className="space-y-4">
            {[
              { icon: Shield, text: "Medical-grade health tracking" },
              { icon: Bell, text: "Instant family alerts for critical readings" },
              { icon: Users, text: "Share health summary with your doctor" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-blue-200" />
                </div>
                <p className="text-blue-100 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-sm">© 2026 NearCare. All rights reserved.</p>
      </div>
      {/* Right - Sign in */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Heart className="h-6 w-6 text-blue-600 fill-blue-600" />
            <span className="text-xl font-bold text-gray-900">NearCare</span>
          </div>
          <SignIn forceRedirectUrl="/dashboard" />
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-blue-600 font-medium hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
\`\`\`

TASK 2: Rewrite /Users/singhs1/myprod/carebridge/src/app/sign-up/[[...sign-up]]/page.tsx
Same split layout but right panel says "Join NearCare" and links to sign-in. Use SignUp with forceRedirectUrl="/dashboard".

Write both complete files.
`, { label: "Beautiful Auth Pages" }),
]);

phase("Dashboard & Nav");

const [navResult] = await parallel([
  () => agent(`
You are working on the NearCare health app at /Users/singhs1/myprod/carebridge.
Stack: Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui.

TASK 1: Fix logout in /Users/singhs1/myprod/carebridge/src/app/dashboard/layout.tsx

Read the current file first. The UserButton alone doesn't reliably handle signout in this Clerk version.
Replace the bottom sidebar section with a proper SignOutButton:

\`\`\`tsx
import { UserButton } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
\`\`\`

In the sidebar bottom section, keep UserButton for the avatar/profile but add a separate SignOutButton:
\`\`\`tsx
<div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-800">
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
\`\`\`

TASK 2: Add page transition styles to /Users/singhs1/myprod/carebridge/src/app/globals.css
Read the file first. Append at the end:
\`\`\`css
/* Page transitions */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

main > div {
  animation: fadeIn 0.2s ease-out;
}
\`\`\`

TASK 3: Create /Users/singhs1/myprod/carebridge/src/app/dashboard/loading.tsx for skeleton loading:
\`\`\`tsx
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    </div>
  );
}
\`\`\`

Read each file before editing. Write all changes carefully.
`, { label: "Fix Logout + Transitions" }),
]);

phase("Page Polish");

const [polishResult] = await parallel([
  () => agent(`
You are working on the NearCare health app at /Users/singhs1/myprod/carebridge.
Stack: Next.js 16, TypeScript, Tailwind v4, shadcn/ui. Dark mode required on all.

TASK: Polish these dashboard pages by reading each file and making targeted improvements:

1. /Users/singhs1/myprod/carebridge/src/app/dashboard/page.tsx
   - Add a gradient welcome banner at the top instead of plain text
   - Make stat cards more visually distinct with colored left borders
   - Add "Quick Actions" row: Log Health, Add Med, Upload Doc buttons

2. /Users/singhs1/myprod/carebridge/src/app/dashboard/insights/page.tsx  
   - Make the empty state more compelling with animated gradient card
   - Add a "last generated" timestamp when summary exists

3. /Users/singhs1/myprod/carebridge/src/app/dashboard/share/page.tsx
   - Make the share link card more prominent with a copy animation

Read each file carefully before editing. Make targeted edits only — do not rewrite entire files unless necessary.
Apply dark mode classes to any new elements.
After all edits run: cd /Users/singhs1/myprod/carebridge && npx tsc --noEmit 2>&1
Report results.
`, { label: "Polish Dashboard Pages" }),
]);

phase("Verify");

const verifyResult = await agent(`
You are verifying the NearCare health app at /Users/singhs1/myprod/carebridge.

Run: cd /Users/singhs1/myprod/carebridge && npx tsc --noEmit 2>&1

If there are TypeScript errors, read the relevant files and fix them.
Run tsc again after fixing.

Also check:
- Does /Users/singhs1/myprod/carebridge/src/app/dashboard/loading.tsx exist?
- Does /Users/singhs1/myprod/carebridge/src/app/dashboard/layout.tsx contain SignOutButton?
- Does /Users/singhs1/myprod/carebridge/src/app/page.tsx contain "NearCare"?

Report final status of each.
`, { label: "Verify + Fix All" });

return {
  status: "complete",
  changes: [
    "Creative landing page with hero, features, how-it-works, stats",
    "Beautiful split-panel sign-in and sign-up pages",
    "Fixed logout with SignOutButton",
    "Page fade-in transitions",
    "Skeleton loading states",
    "Polished dashboard with quick actions",
  ],
  verify: verifyResult?.slice?.(0, 300),
};
