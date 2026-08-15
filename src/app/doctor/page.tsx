"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import React from "react";
import {
  Stethoscope,
  AlertTriangle,
  Users,
  FileText,
  Clock,
  UserCircle2,
  ChevronRight,
  Mail,
  Copy,
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

interface DoctorProfile {
  specialty?: string;
  hospital?: string;
}

interface RecentActivity {
  patientUserId: string;
  name: string | null;
  email: string;
  logDate: string | null;
  activitySummary: string | null;
  hasCritical: boolean;
}

interface CriticalAlert {
  alertId: string;
  patientUserId: string;
  patientName: string | null;
  patientEmail: string;
  message: string;
  type: string;
  createdAt: string;
}

interface DashboardData {
  profile: DoctorProfile | null;
  totalPatients: number;
  pendingInvites: number;
  criticalPatientsCount: number;
  notesThisWeek: number;
  recentActivity: RecentActivity[];
  criticalAlertsList: CriticalAlert[];
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

function patientColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function relativeLogDate(date: string | null): string {
  if (!date) return "";
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (date === today) return "today";
  if (date === yesterday) return "yesterday";
  return date;
}

function formatAlertTime(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function DoctorDashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite dialog state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetch("/api/doctor/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => toast.error("Failed to load dashboard"))
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
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to invite");
      const link =
        result.inviteLink ??
        `${window.location.origin}/doctor-invite/${result.token}`;
      setInviteLink(link);
      toast.success("Invite created!");
      // Bump pending count
      if (data) {
        setData((prev) =>
          prev ? { ...prev, pendingInvites: prev.pendingInvites + 1 } : prev
        );
      }
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

  function resetDialog() {
    setInviteEmail("");
    setInviteLink(null);
  }

  const hasProfile =
    data?.profile &&
    (data.profile.specialty || data.profile.hospital);

  const doctorLastName = user?.lastName || user?.firstName || "Doctor";

  // Stat cards config
  const stats = [
    {
      label: "Active Patients",
      value: data?.totalPatients ?? 0,
      icon: Users,
      color: "blue",
      border: "border-l-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950",
      text: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Pending Invites",
      value: data?.pendingInvites ?? 0,
      icon: Clock,
      color: "amber",
      border: "border-l-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950",
      text: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Critical Alerts",
      value: data?.criticalPatientsCount ?? 0,
      icon: AlertTriangle,
      color: "red",
      border: "border-l-red-500",
      bg: "bg-red-50 dark:bg-red-950",
      text: "text-red-600 dark:text-red-400",
    },
    {
      label: "Notes This Week",
      value: data?.notesThisWeek ?? 0,
      icon: FileText,
      color: "green",
      border: "border-l-green-500",
      bg: "bg-green-50 dark:bg-green-950",
      text: "text-green-600 dark:text-green-400",
    },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-2xl flex-shrink-0">
          <Stethoscope className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            Welcome back, Dr. {doctorLastName}
          </h1>
          {!loading && hasProfile ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {[data?.profile?.specialty, data?.profile?.hospital]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : !loading && !hasProfile ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Your patient overview
            </p>
          ) : (
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          )}
        </div>
      </div>

      {/* Onboarding banner — only when no profile */}
      {!loading && !hasProfile && (
        <Link href="/doctor/profile" className="block group">
          <div className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 rounded-2xl hover:border-amber-400 dark:hover:border-amber-600 transition-colors">
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-xl flex-shrink-0">
              <UserCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Complete your profile to start seeing patients
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Add your specialty, hospital, and credentials so patients can trust you.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, border, bg, text }) => (
          <Card key={label} className={cn("border-l-4", border, "dark:bg-gray-900 dark:border-gray-800", `dark:${border}`)}>
            <CardContent className="pt-4 pb-4">
              <div className={cn("inline-flex p-2 rounded-lg mb-3", bg)}>
                <Icon className={cn("h-4 w-4", text)} />
              </div>
              {loading ? (
                <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                  {value}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical Alerts section */}
      {(loading || (data?.criticalAlertsList && data.criticalAlertsList.length > 0)) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Critical Alerts
            </h2>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-red-50 dark:bg-red-950/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <Card className="border-red-200 dark:border-red-900 dark:bg-gray-900">
              <CardContent className="p-0">
                <ul className="divide-y divide-red-100 dark:divide-red-900/50">
                  {data!.criticalAlertsList.map((alert) => {
                    const initials = getInitials(alert.patientName, alert.patientEmail);
                    const color = patientColor(alert.patientUserId);
                    return (
                      <li
                        key={alert.alertId}
                        className="flex items-center gap-4 px-5 py-4"
                      >
                        <div className="flex-shrink-0">
                          <div className="p-1.5 bg-red-100 dark:bg-red-950 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0",
                                color
                              )}
                            >
                              {initials.slice(0, 1)}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {alert.patientName || alert.patientEmail}
                            </p>
                            <span className="text-xs text-gray-400 dark:text-gray-600 flex-shrink-0">
                              · {formatAlertTime(alert.createdAt)}
                            </span>
                          </div>
                        </div>
                        <Link href={`/doctor/patients/${alert.patientUserId}`} className="flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 whitespace-nowrap"
                          >
                            View Patient
                          </Button>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Recent Activity section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Recent Activity
          </h2>
          <Link
            href="/doctor/patients"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            All Patients
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : !data || data.recentActivity.length === 0 ? (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="py-12 text-center">
              <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No patient activity today or yesterday
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                Patients who log health data will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-0">
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.recentActivity.map((activity) => {
                  const initials = getInitials(activity.name, activity.email);
                  const color = patientColor(activity.patientUserId);
                  return (
                    <li key={activity.patientUserId}>
                      <Link
                        href={`/doctor/patients/${activity.patientUserId}`}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0",
                            color
                          )}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {activity.name || activity.email}
                            </p>
                            {activity.hasCritical && (
                              <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs py-0">
                                Critical
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {activity.activitySummary
                              ? `Logged ${relativeLogDate(activity.logDate)}: ${activity.activitySummary}`
                              : `Logged health data ${relativeLogDate(activity.logDate)}`}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Invite Patient dialog */}
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetDialog();
            }}
          >
            <DialogTrigger
              render={
                <button className="flex items-center gap-3 px-4 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors text-left min-h-[44px] w-full" />
              }
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Invite New Patient
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Send an email invite
                </p>
              </div>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-900 dark:border-gray-800 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Invite a Patient</DialogTitle>
              </DialogHeader>
              {!inviteLink ? (
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="dash-invite-email" className="dark:text-gray-300">
                      Patient Email
                    </Label>
                    <Input
                      id="dash-invite-email"
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
                    <Copy className="h-4 w-4" />
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

          <Link href="/doctor/patients" className="block">
            <div className="flex items-center gap-3 px-4 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors min-h-[44px]">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  View All Patients
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage your patient list
                </p>
              </div>
            </div>
          </Link>

          <Link href="/doctor/profile" className="block">
            <div className="flex items-center gap-3 px-4 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors min-h-[44px]">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex-shrink-0">
                <Stethoscope className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  My Profile
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Edit credentials &amp; bio
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
