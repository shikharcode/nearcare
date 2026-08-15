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
  medications: { id: string; name: string; isActive: boolean }[];
  alerts: { id: string; severity: string }[];
  createdAt: string;
}

interface PendingInvite {
  id: string;
  token: string;
  createdAt: string;
}

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

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "pending">("active");

  // Invite dialog state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Resend email per-invite state: inviteId -> email input value
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
      // Add the new pending invite to state
      if (data.id && data.inviteToken) {
        setPendingInvites((prev) => [
          { id: data.id, token: data.inviteToken, createdAt: data.createdAt ?? new Date().toISOString() },
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

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.name ?? "").toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
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
                  <Label
                    htmlFor="invite-email"
                    className="dark:text-gray-300"
                  >
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
              <div className="space-y-4 mt-2">
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">
                    Invite link generated
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 break-all font-mono">
                    {inviteLink}
                  </p>
                </div>
                <Button
                  onClick={copyLink}
                  variant="outline"
                  className="w-full gap-2 dark:border-gray-700 dark:text-gray-300"
                >
                  <Link2 className="h-4 w-4" />
                  Copy Link
                </Button>
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
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
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
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
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
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {search ? "No patients match your search" : "No patients yet"}
              </p>
            </div>
          ) : (
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((patient, idx) => {
                    const initials = getInitials(patient.name, patient.email);
                    const color = avatarColors[idx % avatarColors.length];
                    const hasCritical = patient.alerts.some(
                      (a) => a.severity === "critical"
                    );
                    const activeMedCount = patient.medications.filter(
                      (m) => m.isActive
                    ).length;

                    return (
                      <li
                        key={patient.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        {/* Avatar */}
                        <div
                          className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                        >
                          {initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {patient.name || patient.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {patient.lastLogDate
                              ? `Active ${new Date(patient.lastLogDate).toLocaleDateString()}`
                              : "No activity yet"}
                          </p>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {activeMedCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="gap-1 text-xs dark:bg-gray-800 dark:text-gray-300"
                            >
                              <Pill className="h-3 w-3" />
                              {activeMedCount}
                            </Badge>
                          )}
                          {hasCritical && (
                            <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Critical
                            </Badge>
                          )}
                          <Link
                            href={`/doctor/patients/${patient.patientUserId}`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 dark:border-gray-700 dark:text-gray-300"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
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
                  className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : pendingInvites.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No pending invites
              </p>
            </div>
          ) : (
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pendingInvites.map((invite) => (
                    <li
                      key={invite.id}
                      className="px-5 py-4 space-y-3"
                    >
                      {/* Top row: token + date */}
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            Invite token
                          </p>
                          <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate max-w-[260px]">
                            {invite.token
                              ? invite.token.slice(0, 8) + "…" + invite.token.slice(-4)
                              : "—"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            Created
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 dark:border-gray-700 dark:text-gray-300"
                          onClick={() => copyInviteLink(invite.token)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Link
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
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
                          className="h-8 text-xs flex-1 min-w-[180px] dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 dark:border-gray-700 dark:text-gray-300 flex-shrink-0"
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
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
