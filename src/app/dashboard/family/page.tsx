'use client'

import * as React from "react"
import { toast } from "sonner"
import {
  Users,
  Plus,
  X,
  Bell,
  BellOff,
  Heart,
  ChevronDown,
  ChevronUp,
  Send,
  Link,
  Copy,
  Check,
  Mail,
  Phone,
  AlertTriangle,
  UserPlus,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Contact = {
  id: string
  name: string
  email: string
  phone?: string
  relationship?: string
  alertsEnabled?: boolean
}

type Relationship = "son" | "daughter" | "spouse" | "parent" | "sibling" | "caregiver" | "doctor" | "other"

type AlertLevel = "critical_only" | "all_warnings"

type MetricKey = "blood_pressure" | "heart_rate" | "blood_sugar" | "temperature" | "spo2" | "pain"

type AlertPreferences = {
  level: AlertLevel
  metrics: Record<MetricKey, boolean>
}

const DEFAULT_PREFS: AlertPreferences = {
  level: "all_warnings",
  metrics: {
    blood_pressure: true,
    heart_rate: true,
    blood_sugar: true,
    temperature: true,
    spo2: true,
    pain: true,
  },
}

const METRIC_LABELS: { key: MetricKey; label: string }[] = [
  { key: "blood_pressure", label: "Blood Pressure" },
  { key: "heart_rate", label: "Heart Rate" },
  { key: "blood_sugar", label: "Blood Sugar" },
  { key: "temperature", label: "Temperature" },
  { key: "spo2", label: "SpO2" },
  { key: "pain", label: "Pain Level" },
]

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadPrefs(contactId: string): AlertPreferences {
  try {
    const raw = localStorage.getItem(`alert_prefs_${contactId}`)
    if (!raw) return { ...DEFAULT_PREFS, metrics: { ...DEFAULT_PREFS.metrics } }
    return JSON.parse(raw) as AlertPreferences
  } catch {
    return { ...DEFAULT_PREFS, metrics: { ...DEFAULT_PREFS.metrics } }
  }
}

function savePrefs(contactId: string, prefs: AlertPreferences) {
  try {
    localStorage.setItem(`alert_prefs_${contactId}`, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "spouse", label: "Spouse" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "caregiver", label: "Caregiver" },
  { value: "doctor", label: "Doctor" },
  { value: "other", label: "Other" },
]

type RelationshipTheme = {
  badge: string
  avatar: string
  border: string
  leftBorder: string
}

function getRelationshipTheme(relationship?: string): RelationshipTheme {
  switch (relationship) {
    case "doctor":
      return {
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        avatar: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
        border: "border-blue-100 dark:border-blue-900/40",
        leftBorder: "bg-blue-500",
      }
    case "caregiver":
      return {
        badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800",
        avatar: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
        border: "border-green-100 dark:border-green-900/40",
        leftBorder: "bg-green-500",
      }
    case "spouse":
      return {
        badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800",
        avatar: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
        border: "border-pink-100 dark:border-pink-900/40",
        leftBorder: "bg-pink-500",
      }
    case "son":
    case "daughter":
      return {
        badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        avatar: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
        border: "border-purple-100 dark:border-purple-900/40",
        leftBorder: "bg-purple-500",
      }
    case "parent":
      return {
        badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
        avatar: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
        border: "border-orange-100 dark:border-orange-900/40",
        leftBorder: "bg-orange-500",
      }
    case "sibling":
      return {
        badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
        avatar: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
        border: "border-cyan-100 dark:border-cyan-900/40",
        leftBorder: "bg-cyan-500",
      }
    default:
      return {
        badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
        avatar: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        border: "border-gray-100 dark:border-gray-800",
        leftBorder: "bg-gray-400",
      }
  }
}

function getRelationshipLabel(value?: string): string {
  return RELATIONSHIPS.find((r) => r.value === value)?.label ?? (value ?? "Other")
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const defaultForm = { name: "", email: "", phone: "", relationship: "other" as Relationship }

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FamilyPage() {
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState(defaultForm)
  const [submitting, setSubmitting] = React.useState(false)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const fetchContacts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/family-contacts")
      if (!res.ok) throw new Error("Failed to load contacts")
      const data = await res.json()
      setContacts(data)
    } catch {
      toast.error("Could not load family contacts.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/family-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          relationship: form.relationship,
        }),
      })
      if (!res.ok) throw new Error("Failed to add contact")
      const newContact = await res.json()
      setContacts((prev) => [...prev, newContact])
      setForm(defaultForm)
      setDialogOpen(false)
      toast.success(`${form.name.trim()} added to family contacts.`)
    } catch {
      toast.error("Could not add contact. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(contact: Contact) {
    if (!window.confirm(`Remove ${contact.name} from your family contacts?`)) return
    setDeletingId(contact.id)
    try {
      const res = await fetch(`/api/family-contacts/${contact.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setContacts((prev) => prev.filter((c) => c.id !== contact.id))
      toast.success(`${contact.name} removed from family contacts.`)
    } catch {
      toast.error("Could not remove contact.")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleAlerts(contact: Contact) {
    const next = !contact.alertsEnabled
    setTogglingId(contact.id)
    try {
      const res = await fetch(`/api/family-contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertsEnabled: next }),
      })
      if (!res.ok) throw new Error("Failed to update")
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, alertsEnabled: next } : c))
      )
      toast.success(
        next
          ? `Alerts enabled for ${contact.name}.`
          : `Alerts paused for ${contact.name}.`
      )
    } catch {
      toast.error("Could not update alert preference.")
    } finally {
      setTogglingId(null)
    }
  }

  const allAlertsDisabled =
    contacts.length > 0 && contacts.every((c) => !c.alertsEnabled)

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Page header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg flex-shrink-0">
          <Users className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            Family Contacts
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
            Manage who receives your health alerts
          </p>
        </div>
      </div>

      {/* No-alerts banner */}
      {allAlertsDisabled && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-5 py-4 mb-6">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
            No one will receive alerts — enable alerts for at least one contact.
          </p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : contacts.length === 0 ? (
        <EmptyState onAdd={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-4">
          {/* Add contact card (prominent dashed) */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="w-full flex items-center gap-4 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 px-5 py-4 text-left transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-[0.99] group"
                />
              }
            >
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-blue-700 dark:text-blue-400">
                  Add Family Member
                </p>
                <p className="text-sm text-blue-500 dark:text-blue-500 mt-0.5">
                  Caregiver, doctor, spouse, or family
                </p>
              </div>
            </DialogTrigger>

            <AddContactDialog
              form={form}
              setForm={setForm}
              submitting={submitting}
              onSubmit={handleAddContact}
              onClose={() => {
                setDialogOpen(false)
                setForm(defaultForm)
              }}
            />
          </Dialog>

          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              isToggling={togglingId === contact.id}
              isDeleting={deletingId === contact.id}
              onToggleAlerts={() => handleToggleAlerts(contact)}
              onDelete={() => handleDelete(contact)}
            />
          ))}

          <p className="text-sm text-center text-gray-400 dark:text-gray-600 pt-2">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""} in your care network
          </p>
        </div>
      )}

      {/* FAB — only shown when contacts exist */}
      {!loading && contacts.length > 0 && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <button
                type="button"
                className="fixed bottom-24 right-5 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-95 sm:bottom-8 sm:right-8"
                aria-label="Add contact"
              />
            }
          >
            <Plus className="h-7 w-7" />
          </DialogTrigger>

          <AddContactDialog
            form={form}
            setForm={setForm}
            submitting={submitting}
            onSubmit={handleAddContact}
            onClose={() => {
              setDialogOpen(false)
              setForm(defaultForm)
            }}
          />
        </Dialog>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AddContactDialog
// ---------------------------------------------------------------------------

function AddContactDialog({
  form,
  setForm,
  submitting,
  onSubmit,
  onClose,
}: {
  form: typeof defaultForm
  setForm: React.Dispatch<React.SetStateAction<typeof defaultForm>>
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  return (
    <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:ring-gray-700">
      <DialogHeader>
        <DialogTitle className="text-xl text-gray-900 dark:text-white">
          Add Family Contact
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4 mt-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="fc-name"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fc-name"
            placeholder="Jane Doe"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="h-12 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="fc-email"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fc-email"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            className="h-12 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="fc-phone"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Phone{" "}
            <span className="text-gray-400 dark:text-gray-500 font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="fc-phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="h-12 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="fc-rel"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Relationship
          </Label>
          <select
            id="fc-rel"
            value={form.relationship}
            onChange={(e) =>
              setForm((f) => ({ ...f, relationship: e.target.value as Relationship }))
            }
            className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-base text-gray-900 dark:text-white outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 transition-all"
          >
            {RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="-mx-4 -mb-4 flex justify-end gap-2 rounded-b-xl border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="h-11 rounded-xl dark:border-gray-700 dark:text-gray-300"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-xl"
          >
            {submitting ? "Adding…" : "Add Contact"}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}

// ---------------------------------------------------------------------------
// ContactCard
// ---------------------------------------------------------------------------

function ContactCard({
  contact,
  isToggling,
  isDeleting,
  onToggleAlerts,
  onDelete,
}: {
  contact: Contact
  isToggling: boolean
  isDeleting: boolean
  onToggleAlerts: () => void
  onDelete: () => void
}) {
  const [prefsOpen, setPrefsOpen] = React.useState(false)
  const [prefs, setPrefs] = React.useState<AlertPreferences>(() => loadPrefs(contact.id))
  const [testDialogOpen, setTestDialogOpen] = React.useState(false)
  const [sendingTest, setSendingTest] = React.useState(false)
  const [caregiverLink, setCaregiverLink] = React.useState<string | null>(null)
  const [generatingLink, setGeneratingLink] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    savePrefs(contact.id, prefs)
  }, [contact.id, prefs])

  function setLevel(level: AlertLevel) {
    setPrefs((p) => ({ ...p, level }))
  }

  function toggleMetric(key: MetricKey) {
    setPrefs((p) => ({
      ...p,
      metrics: { ...p.metrics, [key]: !p.metrics[key] },
    }))
  }

  async function handleSendTest() {
    if (!contact.alertsEnabled) {
      toast.error(`Alerts are paused for ${contact.name}. Enable alerts first.`)
      setTestDialogOpen(false)
      return
    }
    setSendingTest(true)
    try {
      const res = await fetch("/api/alerts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !(data as { success?: boolean }).success) {
        const msg =
          (data as { error?: string }).error ||
          "Could not send test alert. Please try again."
        toast.error(msg)
        return
      }
      toast.success(`Test alert sent to ${contact.name}.`)
      setTestDialogOpen(false)
    } catch {
      toast.error("Could not send test alert. Please try again.")
    } finally {
      setSendingTest(false)
    }
  }

  async function handleGenerateCaregiverLink() {
    setGeneratingLink(true)
    try {
      const res = await fetch("/api/caregiver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caregiverEmail: contact.email }),
      })
      if (!res.ok) throw new Error("Failed to generate link")
      const data = await res.json()
      const link = `${window.location.origin}/caregiver/${(data as { token: string }).token}`
      setCaregiverLink(link)
      toast.success("Caregiver link generated.")
    } catch {
      toast.error("Could not generate caregiver link. Please try again.")
    } finally {
      setGeneratingLink(false)
    }
  }

  function handleCopyLink() {
    if (!caregiverLink) return
    navigator.clipboard.writeText(caregiverLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const theme = getRelationshipTheme(contact.relationship)
  const initials = getInitials(contact.name)

  const enabledMetrics = METRIC_LABELS.filter((m) => prefs.metrics[m.key])
  const prefsSummary =
    prefs.level === "critical_only"
      ? "Critical only"
      : enabledMetrics.length === METRIC_LABELS.length
      ? "All metrics"
      : enabledMetrics.length === 0
      ? "No metrics"
      : `${enabledMetrics.length} metrics`

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-white dark:bg-gray-900 shadow-lg overflow-hidden",
        "transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5",
        theme.border,
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      {/* Colored left border accent */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl", theme.leftBorder)} />

      <div className="pl-5 pr-5 pt-5 pb-4">
        {/* Top row: avatar + info + delete */}
        <div className="flex items-start gap-4">
          {/* Large avatar */}
          <div
            className={cn(
              "h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0",
              theme.avatar
            )}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                  {contact.name}
                </h3>
                {contact.relationship && (
                  <span
                    className={cn(
                      "inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                      theme.badge
                    )}
                  >
                    {getRelationshipLabel(contact.relationship)}
                  </span>
                )}
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                title="Remove contact"
                className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contact details */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                </div>
                <span className="text-base text-gray-600 dark:text-gray-300 truncate">
                  {contact.email}
                </span>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-base text-gray-600 dark:text-gray-300">
                    {contact.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alert toggle row */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {contact.alertsEnabled ? (
              <>
                <Bell className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                  Receiving alerts
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-600 hidden sm:inline">·</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">{prefsSummary}</span>
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                <span className="text-sm text-gray-400 dark:text-gray-500">Alerts paused</span>
              </>
            )}
          </div>

          {/* Pill switch */}
          <button
            type="button"
            role="switch"
            aria-checked={contact.alertsEnabled ?? false}
            onClick={onToggleAlerts}
            disabled={isToggling}
            className={cn(
              "relative inline-flex h-7 w-12 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50",
              contact.alertsEnabled
                ? "bg-blue-500"
                : "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200",
                contact.alertsEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Alert preferences expand */}
        <button
          type="button"
          onClick={() => setPrefsOpen((o) => !o)}
          className="mt-3 w-full flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-1"
        >
          <span className="font-medium">Alert preferences</span>
          {prefsOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Expandable preferences section */}
        {prefsOpen && (
          <div className="mt-3 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-5">
            {/* Alert level */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Alert level
              </p>
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`level-${contact.id}`}
                    checked={prefs.level === "critical_only"}
                    onChange={() => setLevel("critical_only")}
                    className="mt-0.5 accent-blue-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-800 dark:text-gray-200">
                      Critical alerts only
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
                      Only blood pressure and blood sugar critical thresholds
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`level-${contact.id}`}
                    checked={prefs.level === "all_warnings"}
                    onChange={() => setLevel("all_warnings")}
                    className="mt-0.5 accent-blue-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-800 dark:text-gray-200">
                      All warnings too
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
                      Includes warnings and critical alerts for selected metrics
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Metric checkboxes */}
            {prefs.level === "all_warnings" && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Specific metrics
                </p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  {METRIC_LABELS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefs.metrics[key]}
                        onChange={() => toggleMetric(key)}
                        className="accent-blue-500 h-4 w-4"
                      />
                      <span className="text-base text-gray-700 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Test alert button */}
            <div className="pt-1">
              <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                <DialogTrigger
                  render={
                    <Button
                      variant="outline"
                      className="gap-2 h-11 rounded-xl dark:border-gray-700 dark:text-gray-300"
                    />
                  }
                >
                  <Send className="h-4 w-4" />
                  Send Test Alert
                </DialogTrigger>

                <DialogContent className="sm:max-w-sm dark:bg-gray-900 dark:ring-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-gray-900 dark:text-white">
                      Send Test Alert
                    </DialogTitle>
                  </DialogHeader>

                  <div className="mt-2 space-y-4">
                    {!contact.alertsEnabled && (
                      <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          Alerts are paused for {contact.name}. Enable alerts before sending a test.
                        </p>
                      </div>
                    )}
                    <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      Send a test email to{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {contact.name}
                      </span>{" "}
                      at{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {contact.email}
                      </span>
                      ?
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      This sends a sample email so {contact.name} can confirm they are set up to
                      receive real health alerts from you.
                    </p>

                    <div className="-mx-4 -mb-4 flex justify-end gap-2 rounded-b-xl border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTestDialogOpen(false)}
                        disabled={sendingTest}
                        className="h-11 rounded-xl dark:border-gray-700 dark:text-gray-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSendTest}
                        disabled={sendingTest || !contact.alertsEnabled}
                        className="h-11 rounded-xl gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {sendingTest ? "Sending…" : "Send Test"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Caregiver link */}
            {contact.relationship === "caregiver" && (
              <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 mt-3">
                  Caregiver Access
                </p>
                {!caregiverLink ? (
                  <Button
                    variant="outline"
                    onClick={handleGenerateCaregiverLink}
                    disabled={generatingLink}
                    className="gap-2 h-11 rounded-xl dark:border-gray-700 dark:text-gray-300"
                  >
                    <Link className="h-4 w-4" />
                    {generatingLink ? "Generating…" : "Generate Caregiver Link"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3">
                      <Link className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <p className="text-sm text-green-700 dark:text-green-300 truncate flex-1 font-mono">
                        {caregiverLink}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        title="Copy link"
                        className="flex-shrink-0 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Share this link with{" "}
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {contact.name}
                      </span>{" "}
                      so they can log health readings on your behalf.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleGenerateCaregiverLink}
                      disabled={generatingLink}
                      className="gap-2 h-11 rounded-xl dark:border-gray-700 dark:text-gray-300"
                    >
                      <Link className="h-4 w-4" />
                      {generatingLink ? "Generating…" : "Generate New Link"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LoadingSkeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg overflow-hidden animate-pulse"
        >
          <div className="pl-5 pr-5 pt-5 pb-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-36 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-48 rounded-lg bg-gray-100 dark:bg-gray-800 mt-3" />
                <div className="h-4 w-32 rounded-lg bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between">
              <div className="h-4 w-28 rounded-lg bg-gray-100 dark:bg-gray-800" />
              <div className="h-7 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950/60 dark:to-rose-950/60 flex items-center justify-center shadow-xl">
          <Heart className="h-14 w-14 text-pink-500 dark:text-pink-400" />
        </div>
        <div className="absolute -top-2 -right-2 h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shadow-md">
          <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Keep your family in the loop
      </h2>
      <p className="text-base text-gray-500 dark:text-gray-400 max-w-xs mb-8 leading-relaxed">
        Add family members, caregivers, or doctors to automatically notify them when your health
        readings fall outside safe ranges.
      </p>

      <Button
        onClick={onAdd}
        className="h-14 px-8 rounded-2xl text-base font-semibold gap-2.5 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg shadow-blue-500/30 active:scale-95 transition-all duration-200"
      >
        <Plus className="h-5 w-5" />
        Add Your First Contact
      </Button>

      {/* Feature hints */}
      <div className="mt-10 grid grid-cols-1 gap-3 w-full max-w-sm">
        {[
          { icon: Bell, text: "Instant alerts on critical readings" },
          { icon: Mail, text: "Email notifications with health context" },
          { icon: Users, text: "Support caregivers, doctors & family" },
        ].map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-3"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
