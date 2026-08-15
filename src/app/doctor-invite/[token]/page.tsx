import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { doctorPatients, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { AcceptInviteButton } from "./accept-invite-button";

export default async function DoctorInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [rel] = await db
    .select()
    .from(doctorPatients)
    .where(eq(doctorPatients.inviteToken, token));

  if (!rel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-12 w-12 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Invalid or Expired Invite Link
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            This invite link is invalid or has expired. Please ask your doctor
            to send a new invite.
          </p>
        </div>
      </div>
    );
  }

  if (rel.status !== "pending") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-amber-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Invite Already Used
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            This invite has already been accepted or is no longer active.
          </p>
        </div>
      </div>
    );
  }

  const [doctor] = await db
    .select()
    .from(users)
    .where(eq(users.id, rel.doctorUserId));

  const doctorName = doctor?.name ?? doctor?.email ?? "Your Doctor";

  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-8 py-6">
          <div className="flex justify-center mb-3">
            <div className="bg-white/20 rounded-full p-3">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-white text-center">
            Dr. {doctorName} has invited you to connect on NearCare
          </h1>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6">
          {/* What the doctor will see */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              What Dr. {doctorName} will be able to see:
            </h2>
            <ul className="space-y-2">
              {[
                "Recent health logs (mood, energy, sleep, vitals)",
                "Current medications and adherence",
                "Active health alerts",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy note */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Your privacy is protected. You can revoke access at any time from
              your dashboard under <strong>Share</strong>.
            </span>
          </div>

          {/* CTA */}
          {userId ? (
            <AcceptInviteButton token={token} doctorName={doctorName} />
          ) : (
            <div className="space-y-3">
              <Link
                href={`/sign-up?redirect_url=/doctor-invite/${token}`}
                className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                Create an account to accept
              </Link>
              <Link
                href={`/sign-in?redirect_url=/doctor-invite/${token}`}
                className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                I already have an account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
