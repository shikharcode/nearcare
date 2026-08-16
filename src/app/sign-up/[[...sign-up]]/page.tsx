import { SignUp } from "@clerk/nextjs";
import { Heart, Shield, Bell, Users } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
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
            Join NearCare today<br />and protect what matters.
          </h1>
          <p className="text-blue-200 text-lg mb-10">Set up in minutes. Free for families.</p>
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
      {/* Right - Sign up */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Heart className="h-6 w-6 text-blue-600 fill-blue-600" />
            <span className="text-xl font-bold text-gray-900">NearCare</span>
          </div>
          <SignUp fallbackRedirectUrl="/onboarding" />
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
