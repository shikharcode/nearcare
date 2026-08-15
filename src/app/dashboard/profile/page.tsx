'use client'

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { User, Droplets, Phone, AlertTriangle, Bell, ShieldAlert, Clock, Trash2 } from "lucide-react";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

interface ProfileData {
  name?: string;
  bloodType?: string;
  dateOfBirth?: string;
  allergies?: string;
  emergencyContact?: string;
}

interface AlertItem {
  id: string;
  type: string;
  severity: string;
  message: string;
  value?: string;
  createdAt: string;
}

function formatAlertType(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [name, setName] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const deleteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        if (data.name) setName(data.name);
        if (data.bloodType) setBloodType(data.bloodType);
        if (data.dateOfBirth) setDateOfBirth(data.dateOfBirth);
        if (data.allergies) setAllergies(data.allergies);
        if (data.emergencyContact) {
          try {
            const parsed = JSON.parse(data.emergencyContact);
            setEmergencyContactName(parsed.name || "");
            setEmergencyContactPhone(parsed.phone || "");
          } catch {
            setEmergencyContactName(data.emergencyContact);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));

    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data: AlertItem[]) => setAlerts(Array.isArray(data) ? data.slice(0, 10) : []))
      .catch(() => {})
      .finally(() => setLoadingAlerts(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const emergencyContact = JSON.stringify({
        name: emergencyContactName,
        phone: emergencyContactPhone,
      });
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bloodType, dateOfBirth, allergies, emergencyContact }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile saved successfully.");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Account deleted. Redirecting...");
      router.push("/");
    } catch {
      toast.error("Failed to delete account. Please try again.");
      setDeleting(false);
    }
  };

  if (!isLoaded || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Manage your personal details and health information
        </p>
      </div>

      {/* Clerk identity card */}
      <Card className="border-gray-100 dark:border-gray-800">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar size="lg" className="size-16">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                <AvatarFallback className="text-lg font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <UserButton />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {user?.fullName || "No name set"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user?.primaryEmailAddress?.emailAddress || "No email"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Clerk Account
                </Badge>
                {user?.publicMetadata?.role != null && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {String(user.publicMetadata.role)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health profile form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medical info */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Droplets className="h-4 w-4 text-red-500" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gray-400" />
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
                className="text-sm h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 dark:text-gray-300">Blood Type</Label>
              <Select value={bloodType} onValueChange={(v) => setBloodType(v ?? "")}>
                <SelectTrigger className="w-full h-10 text-sm dark:bg-input/30">
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((bt) => (
                    <SelectItem key={bt} value={bt}>
                      {bt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-sm text-gray-700 dark:text-gray-300">
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="text-sm h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="allergies" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Allergies
              </Label>
              <Input
                id="allergies"
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. penicillin, peanuts, latex"
                className="text-sm h-10"
              />
              <p className="text-xs text-gray-400 dark:text-gray-600">Separate multiple allergies with commas</p>
            </div>
          </CardContent>
        </Card>

        {/* Emergency contact */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-500" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="ecName" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gray-400" />
                Contact Name
              </Label>
              <Input
                id="ecName"
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="text-sm h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ecPhone" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                Contact Phone
              </Label>
              <Input
                id="ecPhone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="e.g. +1 555 000 1234"
                className="text-sm h-10"
              />
            </div>

            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-4 py-3">
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                This contact will be notified if a critical health alert is triggered. Make sure their details are accurate.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-8 text-base font-semibold min-w-36"
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>

      {/* Alerts history */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Alert History</h2>
          <Badge variant="secondary" className="text-xs ml-1">Last 10</Badge>
        </div>

        {loadingAlerts ? (
          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="flex items-center justify-center py-10">
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-600">
                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span className="text-sm">Loading alerts...</span>
              </div>
            </CardContent>
          </Card>
        ) : alerts.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 shadow-none">
            <CardContent className="flex flex-col items-center py-12">
              <ShieldAlert className="h-10 w-10 text-gray-200 dark:text-gray-700 mb-3" />
              <p className="font-medium text-gray-500 dark:text-gray-400">No alerts yet</p>
              <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">
                Health alerts will appear here when triggered
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`border-l-4 transition-colors ${
                  alert.severity === "critical"
                    ? "border-l-red-500 dark:border-l-red-500 border-red-100 dark:border-red-950/40 bg-red-50/30 dark:bg-red-950/10"
                    : "border-l-amber-400 dark:border-l-amber-400 border-amber-100 dark:border-amber-950/40 bg-amber-50/20 dark:bg-amber-950/10"
                }`}
              >
                <CardContent className="py-3.5 px-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge
                          className={`text-xs font-semibold px-2 py-0.5 ${
                            alert.severity === "critical"
                              ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          }`}
                          variant="outline"
                        >
                          {alert.severity === "critical" ? "Critical" : "Warning"}
                        </Badge>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {formatAlertType(alert.type)}
                        </span>
                        {alert.value && (
                          <span className="text-xs text-gray-400 dark:text-gray-600">
                            · {alert.value}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{alert.message}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-xs text-gray-400 dark:text-gray-600 pt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(alert.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Danger Zone */}
      <div className="rounded-xl border-2 border-red-200 dark:border-red-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-500" />
          <h2 className="text-base font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Delete Account</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              This permanently deletes all your health data, medications, documents, and account. This cannot be undone.
            </p>
          </div>
          <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setDeleteConfirmText("");
          }}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="shrink-0 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300"
                />
              }
            >
              Delete My Account
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </DialogTitle>
                <DialogDescription>
                  This action is permanent and cannot be undone. All your health data, medications, documents, and files will be deleted immediately.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Type <span className="font-mono font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm:
                </p>
                <Input
                  ref={deleteInputRef}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="font-mono"
                  autoComplete="off"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
