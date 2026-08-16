import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  HeartPulse,
  XCircle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Bell,
  Sparkles,
  User,
  Droplets,
  AlertTriangle,
} from "lucide-react";
import { ClaimButton } from "./claim-button";

interface ClaimData {
  patient: {
    name: string;
    bloodType: string | null;
    allergies: string | null;
    doctorName: string | null;
  };
  alreadyClaimed: false;
}

interface AlreadyClaimedData {
  alreadyClaimed: true;
  message: string;
}

type ApiResponse = ClaimData | AlreadyClaimedData | { error: string };

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let data: ApiResponse;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/claim/${token}`,
      { cache: "no-store" }
    );
    data = await res.json();
    if (!res.ok && !("error" in data)) {
      data = { error: "Invalid claim link" };
    }
  } catch {
    data = { error: "Unable to load claim link" };
  }

  // STATE 1 — Invalid token
  if ("error" in data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-7 w-7 text-red-500" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            This link is invalid or has expired
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            The claim link may have already been used or the doctor may have
            removed it. Please contact your doctor for a new link.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Create your own account
          </Link>
        </div>
      </div>
    );
  }

  // STATE 2 — Already claimed
  if ("alreadyClaimed" in data && data.alreadyClaimed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertCircle className="h-7 w-7 text-amber-500" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            This health profile has already been claimed
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This profile has already been linked to an account. Sign in to
            access your health dashboard.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    );
  }

  // STATE 3 — Valid, unclaimed
  const { patient } = data as ClaimData;
  const doctorName = patient.doctorName ?? "Your Doctor";
  const { userId } = await auth();

  const benefits = [
    {
      icon: HeartPulse,
      title: "Your health history",
      description: "Vitals, medications, and notes your doctor has already entered",
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      icon: Bell,
      title: "Family alerts",
      description: "Your loved ones stay informed of important health changes",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      icon: Sparkles,
      title: "AI insights",
      description: "Weekly health summaries powered by AI to track your progress",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden mb-4">
          {/* Hero banner */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-7">
            <div className="flex items-center justify-center gap-2 mb-4">
              <HeartPulse className="h-6 w-6 text-white" />
              <span className="text-white font-bold text-lg tracking-tight">NearCare</span>
            </div>
            <h1 className="text-xl font-semibold text-white text-center leading-snug">
              Your doctor has created a health profile for you
            </h1>
          </div>

          {/* Doctor info + patient profile */}
          <div className="px-8 py-6 space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              <span className="font-medium text-gray-900 dark:text-white">
                Dr. {doctorName}
              </span>{" "}
              has set up your health profile on NearCare.
            </p>

            {/* Patient profile card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex-shrink-0">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Patient name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {patient.name}
                  </p>
                </div>
              </div>

              {patient.bloodType && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex-shrink-0">
                    <Droplets className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Blood type</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {patient.bloodType}
                    </p>
                  </div>
                </div>
              )}

              {patient.allergies && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Allergies</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {patient.allergies}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* What you get */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 px-8 py-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            What you get with NearCare
          </h2>
          <div className="space-y-3">
            {benefits.map(({ icon: Icon, title, description, color, bg }) => (
              <div key={title} className="flex items-start gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ${bg}`}
                >
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 px-8 py-6 space-y-4">
          {userId ? (
            <ClaimButton token={token} />
          ) : (
            <div className="space-y-3">
              <Link
                href={`/sign-up?redirect_url=/claim/${token}`}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Create Account &amp; Claim Profile
              </Link>
              <Link
                href={`/sign-in?redirect_url=/claim/${token}`}
                className="flex items-center justify-center w-full min-h-[44px] px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                I already have an account
              </Link>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 pt-1">
            <ShieldCheck className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              By claiming this profile, you confirm you are{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {patient.name}
              </span>{" "}
              or their authorized representative.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
