import { db } from "@/db"
import { caregiverAccess, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { CaregiverForm } from "./caregiver-form"

export default async function CaregiverTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const [access] = await db
    .select()
    .from(caregiverAccess)
    .where(eq(caregiverAccess.token, token))
    .limit(1)

  if (!access || !access.canLogHealth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-3xl mx-auto mb-4">
            ✕
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid caregiver link
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This link is invalid or has been revoked. Please contact the patient to request a new link.
          </p>
        </div>
      </div>
    )
  }

  const [patient] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, access.patientUserId))
    .limit(1)

  const patientName = patient?.name || "your patient"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            N
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">NearCare — Caregiver Mode</p>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              Logging health for{" "}
              <span className="text-blue-600 dark:text-blue-400">{patientName}</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-xl mx-auto px-4 py-8">
        <CaregiverForm patientName={patientName} token={token} />
      </main>
    </div>
  )
}
