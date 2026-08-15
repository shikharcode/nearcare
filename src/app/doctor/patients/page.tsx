"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Mail,
  Pill,
  AlertTriangle,
  Eye,
  Link2,
  Clock,
  Copy,
  Trash2,
  RefreshCw,
  Stethoscope,
  ArrowUpDown,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PatientData {
  id: string;
  patientUserId: string;
  name: string | null;
  email: string;
  lastLogDate: string | null;
  lastVitalLabel: string | null;
  lastVitalValue: string | null;
  hasCriticalAlert: boolean;
  hasWarningAlert: boolean;
  medications: { id: string; name: string; isActive: boolean }[];
  alerts: { id: string; severity: string }[];
  createdAt: string;
}

interface PendingInvite {
  id: string;
  token: string;
  createdAt: string;
}

type SortOption = "recent" | "alerts" | "alpha";

const avatarColors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500",
];

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function isVitalConcerning(label: string | null, value: string | null): boolean {
  if (!label || !value) return false;
  if (label === "BP") {
    const match = value.match(/^(\d+)\/(\d+)/);
    if (match) {
      const sys = parseInt(match[1]);
      const dia = parseInt(match[2]);
      return sys >= 140 || dia >= 90;
    }
  }
  if (label === "Blood Sugar") {
    const val = parseFloat(value);
    return val >= 180 || val < 70;
  }
  if (label === "Heart Rate") {
    const val = parseFloat(value);
    return val > 100 || val < 50;
  }
  if (label === "SpO2") {
    const val = parseFloat(value);
    return val < 95;
  }
  return false;
}

function getMedAdherenceColor(count: number): string {
  if (count === 0) return "bg-gray-300 dark:bg-gray-600";
  if (count <= 2) return "bg-green-500";
  if (count <= 5) return "bg-amber-500";
  return "bg-red-500";
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "pending">("active");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  // Invite dialog state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Resend email per-invite state
  const [resendEmails, setResendEmails] = useState<Record<string, string>>({});
  const [resendLoading, setResendLoading] = useState<Record<string, boolean>>({});
  const [cancelLoading, setCancelLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/doctor/patients")
      .then((r) => r.json())
      .then((data) => {
        setPatients(data.patients ?? []);
        setPendingInvites(data.pendingInvites ?? []);
      })
      .catch(() => toast.error("Failed to load patients"))
      .finally(() => setLoading(false));
  }, []);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/doctor/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to invite");
      const link =
        data.inviteLink ?? `${window.location.origin}/invite/${data.token}`;
      setInviteLink(link);
      if (data.id && data.inviteToken) {
        setPendingInvites((prev) => [
          {
            id: data.id,
            token: data.inviteToken,
            createdAt: data.createdAt ?? new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      toast.success("Invite created!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to invite");
    } finally {
      setInviteLoading(false);
    }
  }

  function copyLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Link copied to clipboard");
    }
  }

  function shareViaWhatsApp() {
    if (!inviteLink) return;
    const msg =
      "I'd like to monitor your health on NearCare. Click to accept: " +
      inviteLink;
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  }

  function copyAndEmail() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    const subject = encodeURIComponent("Your NearCare health monitoring invite");
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to monitor your health on NearCare. Please click the link below to accept my invite:\n\n${inviteLink}\n\nSee you there!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    toast.success("Link copied — email client opened");
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/doctor-invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  }

  function resetDialog() {
    setInviteEmail("");
    setInviteLink(null);
  }

  async function handleCancel(inviteId: string) {
    setCancelLoading((prev) => ({ ...prev, [inviteId]: true }));
    try {
      const res = await fetch(`/api/doctor/patients/${inviteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to cancel invite");
      }
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success("Invite cancelled");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancelLoading((prev) => ({ ...prev, [inviteId]: false }));
    }
  }

  async function handleResend(inviteId: string) {
    const email = resendEmails[inviteId]?.trim();
    if (!email) {
      toast.error("Enter the patient's email to resend");
      return;
    }
    setResendLoading((prev) => ({ ...prev, [inviteId]: true }));
    try {
      const res = await fetch(`/api/doctor/patients/${inviteId}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to resend");
      }
      toast.success("Invite email resent");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setResendLoading((prev) => ({ ...prev, [inviteId]: false }));
    }
  }

  // Filter
  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.name ?? "").toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "alerts") {
      const aScore = a.hasCriticalAlert ? 2 : a.hasWarningAlert ? 1 : 0;
      const bScore = b.hasCriticalAlert ? 2 : b.hasWarningAlert ? 1 : 0;
      if (bScore !== aScore) return bScore - aScore;
    }
    if (sortBy === "alpha") {
      const aName = (a.name || a.email).toLowerCase();
      const bName = (b.name || b.email).toLowerCase();
      return aName.localeCompare(bName);
    }
    // "recent" — most recently active first; null = least recent
    const aDate = a.lastLogDate ?? "0000-00-00";
    const bDate = b.lastLogDate ?? "0000-00-00";
    return bDate.localeCompare(aDate);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            My Patients
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {patients.length} patient{patients.length !== 1 ? "s" : ""} total
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetDialog();
          }}
        >
          <DialogTrigger render={<Button className="gap-2" />}>
            <Mail className="h-4 w-4" />
            Invite Patient
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-900 dark:border-gray-800 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Invite a Patient</DialogTitle>
            </DialogHeader>

            {!inviteLink ? (
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email" className="dark:text-gray-300">
                    Patient Email
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="patient@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
                <Button
                  onClick={handleInvite}
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="w-full"
                >
                  {inviteLoading ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {/* Success indicator */}
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-medium">Invite link generated</p>
                </div>

                {/* Link box */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all font-mono leading-relaxed">
                    {inviteLink}
                  </p>
                </div>

                {/* Share buttons */}
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={copyLink}
                    variant="outline"
                    className="w-full gap-2 dark:border-gray-700 dark:text-gray-300"
                  >
                    <Link2 className="h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={shareViaWhatsApp}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white border-0"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Share via WhatsApp
                  </Button>
                  <Button
                    onClick={copyAndEmail}
                    variant="outline"
                    className="w-full gap-2 dark:border-gray-700 dark:text-gray-300"
                  >
                    <Mail className="h-4 w-4" />
                    Copy &amp; Send via Email
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-gray-500 dark:text-gray-400"
                  onClick={resetDialog}
                >
                  Invite another patient
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("active")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors min-h-[44px]",
            activeTab === "active"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Active Patients
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 min-h-[44px]",
            activeTab === "pending"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Pending Invites
          {pendingInvites.length > 0 && (
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full text-xs font-semibold min-w-[1.25rem] h-5 px-1.5",
                activeTab === "pending"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              )}
            >
              {pendingInvites.length}
            </span>
          )}
        </button>
      </div>

      {/* Active Patients Tab */}
      {activeTab === "active" && (
        <>
          {/* Search + Sort */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
              />
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 ml-1.5 flex-shrink-0" />
              {(
                [
                  { value: "recent", label: "Recent" },
                  { value: "alerts", label: "Alerts" },
                  { value: "alpha", label: "A–Z" },
                ] as { value: SortOption; label: string }[]
              ).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-colors min-h-[32px]",
                    sortBy === value
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : sorted.length === 0 && search ? (
            <div className="text-center py-16">
              <Search className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No patients match your search
              </p>
            </div>
          ) : sorted.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16 px-4 max-w-md mx-auto">
              {/* Illustration */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900 flex items-center justify-center mx-auto mb-6">
                <Stethoscope className="h-12 w-12 text-blue-500" />
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start monitoring your first patient
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                Once a patient accepts your invite, their health data becomes
                visible here in real time.
              </p>

              {/* Steps */}
              <div className="text-left space-y-3 mb-8">
                {[
                  { step: "1", text: "Send an invite with the patient's email" },
                  { step: "2", text: "Patient accepts the link on NearCare" },
                  { step: "3", text: "View vitals, medications & alerts" },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {step}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
                  </div>
                ))}
              </div>

              <Button
                className="gap-2 w-full sm:w-auto min-h-[44px] px-6"
                onClick={() => setDialogOpen(true)}
              >
                <Mail className="h-4 w-4" />
                Invite First Patient
              </Button>
            </div>
          ) : (
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sorted.map((patient, idx) => {
                    const initials = getInitials(patient.name, patient.email);
                    const color = avatarColors[idx % avatarColors.length];
                    const days = daysSince(patient.lastLogDate);
                    const activeMedCount = patient.medications.filter(
                      (m) => m.isActive
                    ).length;
                    const vitalConcerning = isVitalConcerning(
                      patient.lastVitalLabel,
                      patient.lastVitalValue
                    );

                    return (
                      <li
                        key={patient.id}
                        className="flex items-start gap-3 px-4 py-4 sm:px-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        {/* Avatar */}
                        <div
                          className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}
                        >
                          {initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {/* Row 1: name + alert badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                              {patient.name || patient.email}
                            </p>
                            {patient.hasCriticalAlert && (
                              <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs gap-1 py-0 px-1.5 h-5">
                                <AlertTriangle className="h-3 w-3" />
                                Critical
                              </Badge>
                            )}
                            {!patient.hasCriticalAlert && patient.hasWarningAlert && (
                              <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs gap-1 py-0 px-1.5 h-5">
                                <AlertTriangle className="h-3 w-3" />
                                Warning
                              </Badge>
                            )}
                          </div>

                          {/* Row 2: last vital */}
                          {patient.lastVitalLabel && patient.lastVitalValue ? (
                            <p
                              className={cn(
                                "text-xs mt-0.5 font-medium",
                                vitalConcerning
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-gray-600 dark:text-gray-400"
                              )}
                            >
                              {patient.lastVitalLabel}: {patient.lastVitalValue}
                              {vitalConcerning && " ⚠️"}
                            </p>
                          ) : null}

                          {/* Row 3: last active + meds */}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {days === null
                                ? "No logs yet"
                                : days === 0
                                ? "Active today"
                                : days === 1
                                ? "Last active yesterday"
                                : `Last active ${days} days ago`}
                            </span>

                            {activeMedCount > 0 && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                {/* Adherence dot */}
                                <span
                                  className={cn(
                                    "w-2 h-2 rounded-full flex-shrink-0",
                                    getMedAdherenceColor(activeMedCount)
                                  )}
                                />
                                <Pill className="h-3 w-3" />
                                {activeMedCount} med{activeMedCount !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* View button */}
                        <div className="flex-shrink-0 mt-0.5">
                          <Link href={`/doctor/patients/${patient.patientUserId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 dark:border-gray-700 dark:text-gray-300 min-h-[36px]"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Pending Invites Tab */}
      {activeTab === "pending" && (
        <>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : pendingInvites.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-1">
                No pending invites
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Invites you send will appear here until a patient accepts.
              </p>
            </div>
          ) : (
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pendingInvites.map((invite) => {
                    const sentAgo = formatRelativeTime(invite.createdAt);
                    const daysSent = daysSince(invite.createdAt) ?? 0;
                    const isStale = daysSent >= 5;

                    return (
                      <li key={invite.id} className="px-5 py-4 space-y-3">
                        {/* Top row: token + elapsed time */}
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                              Invite token
                            </p>
                            <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate max-w-[220px]">
                              {invite.token
                                ? invite.token.slice(0, 8) +
                                  "…" +
                                  invite.token.slice(-4)
                                : "—"}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p
                              className={cn(
                                "text-xs font-medium flex items-center gap-1 justify-end",
                                isStale
                                  ? "text-amber-500 dark:text-amber-400"
                                  : "text-gray-500 dark:text-gray-400"
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              Sent {sentAgo}
                            </p>
                            {isStale && (
                              <p className="text-xs text-amber-500 dark:text-amber-400 mt-0.5">
                                Patient hasn't responded yet
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 dark:border-gray-700 dark:text-gray-300 min-h-[36px]"
                            onClick={() => copyInviteLink(invite.token)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy Link
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 min-h-[36px]"
                            onClick={() => handleCancel(invite.id)}
                            disabled={cancelLoading[invite.id]}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {cancelLoading[invite.id] ? "Cancelling…" : "Cancel"}
                          </Button>
                        </div>

                        {/* Resend row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Input
                            type="email"
                            placeholder="patient@example.com"
                            value={resendEmails[invite.id] ?? ""}
                            onChange={(e) =>
                              setResendEmails((prev) => ({
                                ...prev,
                                [invite.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleResend(invite.id)
                            }
                            className="h-9 text-xs flex-1 min-w-[180px] dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 dark:border-gray-700 dark:text-gray-300 flex-shrink-0 min-h-[36px]"
                            onClick={() => handleResend(invite.id)}
                            disabled={
                              resendLoading[invite.id] ||
                              !resendEmails[invite.id]?.trim()
                            }
                          >
                            <RefreshCw
                              className={cn(
                                "h-3.5 w-3.5",
                                resendLoading[invite.id] && "animate-spin"
                              )}
                            />
                            Resend Email
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
