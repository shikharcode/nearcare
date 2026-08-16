"use client";

import { useEffect, useState } from "react";
import {
  UserPlus,
  Copy,
  MessageCircle,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import { cn, today } from "@/lib/utils";

interface ManagedPatient {
  id: string;
  name: string;
  dateOfBirth: string | null;
  phone: string | null;
  bloodType: string | null;
  allergies: string | null;
  emergencyContact: string | null;
  claimToken: string;
  claimedAt: string | null;
  claimedByUserId: string | null;
  createdAt: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500",
];

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function computeAge(dob: string | null): string | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return String(age);
}

interface AddPatientForm {
  name: string;
  dateOfBirth: string;
  phone: string;
  bloodType: string;
  allergies: string;
  emergencyContact: string;
  notes: string;
}

interface VitalsForm {
  systolic: string;
  diastolic: string;
  heartRate: string;
  bloodSugar: string;
  oxygenSaturation: string;
  temperature: string;
  weight: string;
  date: string;
}

const emptyAddForm: AddPatientForm = {
  name: "",
  dateOfBirth: "",
  phone: "",
  bloodType: "",
  allergies: "",
  emergencyContact: "",
  notes: "",
};

const emptyVitalsForm = (): VitalsForm => ({
  systolic: "",
  diastolic: "",
  heartRate: "",
  bloodSugar: "",
  oxygenSaturation: "",
  temperature: "",
  weight: "",
  date: today(),
});

export default function ManagedPatientsPage() {
  const [patients, setPatients] = useState<ManagedPatient[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Patient dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddPatientForm>(emptyAddForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [newClaimToken, setNewClaimToken] = useState<string | null>(null);

  // Vitals dialog
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [vitalsPatientId, setVitalsPatientId] = useState<string | null>(null);
  const [vitalsPatientName, setVitalsPatientName] = useState<string>("");
  const [vitalsForm, setVitalsForm] = useState<VitalsForm>(emptyVitalsForm());
  const [vitalsSubmitting, setVitalsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/doctor/managed-patients")
      .then((r) => r.json())
      .then((data) => setPatients(data.patients ?? []))
      .catch(() => toast.error("Failed to load managed patients"))
      .finally(() => setLoading(false));
  }, []);

  function claimLink(token: string): string {
    return `${window.location.origin}/claim/${token}`;
  }

  function copyClaimLink(token: string) {
    navigator.clipboard.writeText(claimLink(token));
    toast.success("Claim link copied to clipboard");
  }

  function openWhatsApp(patient: ManagedPatient) {
    const link = claimLink(patient.claimToken);
    const msg = `Hi${patient.name ? " " + patient.name.split(" ")[0] : ""}, your doctor has created a health profile for you on NearCare. Claim it here: ${link}`;
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  }

  function openVitalsDialog(patient: ManagedPatient) {
    setVitalsPatientId(patient.id);
    setVitalsPatientName(patient.name);
    setVitalsForm(emptyVitalsForm());
    setVitalsOpen(true);
  }

  async function handleAddPatient() {
    if (!addForm.name.trim()) {
      toast.error("Full name is required");
      return;
    }
    setAddSubmitting(true);
    try {
      const res = await fetch("/api/doctor/managed-patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          dateOfBirth: addForm.dateOfBirth || null,
          phone: addForm.phone.trim() || null,
          bloodType: addForm.bloodType || null,
          allergies: addForm.allergies.trim() || null,
          emergencyContact: addForm.emergencyContact.trim() || null,
          notes: addForm.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create patient");
      setPatients((prev) => [data.patient, ...prev]);
      setNewClaimToken(data.patient.claimToken);
      toast.success("Patient profile created");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create patient");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleVitalsSubmit() {
    if (!vitalsPatientId) return;
    setVitalsSubmitting(true);
    try {
      const payload: Record<string, string | number | null> = {
        date: vitalsForm.date,
      };
      if (vitalsForm.systolic) payload.systolic = parseInt(vitalsForm.systolic);
      if (vitalsForm.diastolic) payload.diastolic = parseInt(vitalsForm.diastolic);
      if (vitalsForm.heartRate) payload.heartRate = parseInt(vitalsForm.heartRate);
      if (vitalsForm.bloodSugar) payload.bloodSugar = parseFloat(vitalsForm.bloodSugar);
      if (vitalsForm.oxygenSaturation) payload.oxygenSaturation = parseFloat(vitalsForm.oxygenSaturation);
      if (vitalsForm.temperature) payload.temperature = parseFloat(vitalsForm.temperature);
      if (vitalsForm.weight) payload.weight = parseFloat(vitalsForm.weight);

      const res = await fetch(`/api/doctor/managed-patients/${vitalsPatientId}/vitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save vitals");
      toast.success("Vitals recorded");
      setVitalsOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save vitals");
    } finally {
      setVitalsSubmitting(false);
    }
  }

  function resetAddDialog() {
    setAddForm(emptyAddForm);
    setNewClaimToken(null);
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-500" />
            Patients
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Manage profiles you created directly
          </p>
        </div>

        {/* Add Patient dialog trigger */}
        <Dialog
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open);
            if (!open) resetAddDialog();
          }}
        >
          <DialogTrigger render={<Button variant="gradient" className="gap-2 min-h-[44px]" />}>
            <UserPlus className="h-4 w-4" />
            Add Patient
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg dark:bg-gray-900 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="dark:text-white">
                {newClaimToken ? "Patient Created" : "Add Patient Manually"}
              </DialogTitle>
            </DialogHeader>

            {newClaimToken ? (
              /* Success state — show claim link */
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-medium">Profile created successfully</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Share this link with your patient so they can claim the profile and connect their NearCare account.
                </p>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all leading-relaxed">
                    {claimLink(newClaimToken)}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full gap-2 dark:border-gray-700 dark:text-gray-300"
                    onClick={() => copyClaimLink(newClaimToken)}
                  >
                    <Copy className="h-4 w-4" />
                    Copy Claim Link
                  </Button>
                  <Button
                    className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white border-0"
                    onClick={() => {
                      const link = claimLink(newClaimToken);
                      const msg = `Your doctor has created a health profile for you on NearCare. Claim it here: ${link}`;
                      window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Send via WhatsApp
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-gray-500 dark:text-gray-400"
                    onClick={resetAddDialog}
                  >
                    Add another patient
                  </Button>
                </div>
              </div>
            ) : (
              /* Form */
              <div className="space-y-4 mt-2">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="mp-name" className="dark:text-gray-300">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mp-name"
                    placeholder="e.g. Ramesh Kumar"
                    value={addForm.name}
                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <Label htmlFor="mp-dob" className="dark:text-gray-300">
                    Date of Birth
                  </Label>
                  <Input
                    id="mp-dob"
                    type="date"
                    value={addForm.dateOfBirth}
                    onChange={(e) => setAddForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="mp-phone" className="dark:text-gray-300">
                    Phone Number
                  </Label>
                  <Input
                    id="mp-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                {/* Blood Type */}
                <div className="space-y-1.5">
                  <Label className="dark:text-gray-300">Blood Type</Label>
                  <Select
                    value={addForm.bloodType}
                    onValueChange={(v) => setAddForm((f) => ({ ...f, bloodType: v ?? "" }))}
                  >
                    <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white h-12">
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

                {/* Allergies */}
                <div className="space-y-1.5">
                  <Label htmlFor="mp-allergies" className="dark:text-gray-300">
                    Allergies
                  </Label>
                  <Input
                    id="mp-allergies"
                    placeholder="e.g. Penicillin, Sulfa drugs"
                    value={addForm.allergies}
                    onChange={(e) => setAddForm((f) => ({ ...f, allergies: e.target.value }))}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1.5">
                  <Label htmlFor="mp-ec" className="dark:text-gray-300">
                    Emergency Contact
                  </Label>
                  <Input
                    id="mp-ec"
                    placeholder="Name — Phone number"
                    value={addForm.emergencyContact}
                    onChange={(e) => setAddForm((f) => ({ ...f, emergencyContact: e.target.value }))}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                {/* Clinical Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="mp-notes" className="dark:text-gray-300">
                    Clinical Notes
                  </Label>
                  <Textarea
                    id="mp-notes"
                    placeholder="Private notes about this patient…"
                    rows={3}
                    value={addForm.notes}
                    onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                <Button
                  className="w-full min-h-[44px]"
                  onClick={handleAddPatient}
                  disabled={addSubmitting || !addForm.name.trim()}
                >
                  {addSubmitting ? "Creating…" : "Create Patient Profile"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
        <Link
          href="/doctor/patients"
          className="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors min-h-[44px] flex items-center gap-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Users className="h-4 w-4" />
          My Patients
        </Link>
        <Link
          href="/doctor/patients/managed"
          className="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors min-h-[44px] flex items-center gap-2 border-blue-500 text-blue-600 dark:text-blue-400"
        >
          <UserPlus className="h-4 w-4" />
          Managed Profiles
        </Link>
      </div>

      {/* Vitals Dialog */}
      <Dialog
        open={vitalsOpen}
        onOpenChange={(open) => {
          setVitalsOpen(open);
          if (!open) {
            setVitalsPatientId(null);
            setVitalsPatientName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              Add Vitals — {vitalsPatientName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="v-date" className="dark:text-gray-300">Date</Label>
              <Input
                id="v-date"
                type="date"
                value={vitalsForm.date}
                onChange={(e) => setVitalsForm((f) => ({ ...f, date: e.target.value }))}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* BP row */}
            <div className="space-y-1.5">
              <Label className="dark:text-gray-300">Blood Pressure (mmHg)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Systolic"
                  type="number"
                  value={vitalsForm.systolic}
                  onChange={(e) => setVitalsForm((f) => ({ ...f, systolic: e.target.value }))}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                />
                <span className="text-gray-400 font-bold text-lg flex-shrink-0">/</span>
                <Input
                  placeholder="Diastolic"
                  type="number"
                  value={vitalsForm.diastolic}
                  onChange={(e) => setVitalsForm((f) => ({ ...f, diastolic: e.target.value }))}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Heart Rate */}
            <div className="space-y-1.5">
              <Label htmlFor="v-hr" className="dark:text-gray-300">Heart Rate (bpm)</Label>
              <Input
                id="v-hr"
                type="number"
                placeholder="72"
                value={vitalsForm.heartRate}
                onChange={(e) => setVitalsForm((f) => ({ ...f, heartRate: e.target.value }))}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
              />
            </div>

            {/* Blood Sugar */}
            <div className="space-y-1.5">
              <Label htmlFor="v-bs" className="dark:text-gray-300">Blood Sugar (mg/dL)</Label>
              <Input
                id="v-bs"
                type="number"
                placeholder="100"
                value={vitalsForm.bloodSugar}
                onChange={(e) => setVitalsForm((f) => ({ ...f, bloodSugar: e.target.value }))}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
              />
            </div>

            {/* SpO2 */}
            <div className="space-y-1.5">
              <Label htmlFor="v-spo2" className="dark:text-gray-300">SpO2 (%)</Label>
              <Input
                id="v-spo2"
                type="number"
                placeholder="98"
                value={vitalsForm.oxygenSaturation}
                onChange={(e) => setVitalsForm((f) => ({ ...f, oxygenSaturation: e.target.value }))}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-1.5">
              <Label htmlFor="v-temp" className="dark:text-gray-300">Temperature (°F)</Label>
              <Input
                id="v-temp"
                type="number"
                step="0.1"
                placeholder="98.6"
                value={vitalsForm.temperature}
                onChange={(e) => setVitalsForm((f) => ({ ...f, temperature: e.target.value }))}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
              />
            </div>

            {/* Weight */}
            <div className="space-y-1.5">
              <Label htmlFor="v-weight" className="dark:text-gray-300">Weight (kg)</Label>
              <Input
                id="v-weight"
                type="number"
                step="0.1"
                placeholder="70"
                value={vitalsForm.weight}
                onChange={(e) => setVitalsForm((f) => ({ ...f, weight: e.target.value }))}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
              />
            </div>

            <Button
              className="w-full min-h-[44px]"
              onClick={handleVitalsSubmit}
              disabled={vitalsSubmitting}
            >
              {vitalsSubmitting ? "Saving…" : "Save Vitals"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : patients.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16 px-4 max-w-md mx-auto">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900 flex items-center justify-center mx-auto mb-6">
            <UserPlus className="h-12 w-12 text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No managed profiles yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Create patient profiles directly — no waiting for invites. Share a claim link when the patient is ready.
          </p>
          <Button
            variant="gradient"
            className="gap-2 min-h-[44px] px-6"
            onClick={() => setAddOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Create First Patient
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {patients.map((patient, idx) => {
            const initials = getInitials(patient.name);
            const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const age = computeAge(patient.dateOfBirth);
            const isClaimed = !!patient.claimedAt;

            return (
              <Card
                key={patient.id}
                className="dark:bg-gray-900 dark:border-gray-800 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top row: avatar + name + status */}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0",
                        color
                      )}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                        {patient.name}
                      </p>
                      {age && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Age {age}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={cn(
                        "text-xs flex-shrink-0",
                        isClaimed
                          ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                      )}
                    >
                      {isClaimed ? "Active Patient" : "Unclaimed"}
                    </Badge>
                  </div>

                  {/* Meta row: blood type + allergies */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {patient.bloodType && patient.bloodType !== "Unknown" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800">
                        {patient.bloodType}
                      </span>
                    )}
                    {patient.allergies && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-800">
                        <AlertTriangle className="h-3 w-3" />
                        Allergies
                      </span>
                    )}
                  </div>

                  {/* Claim link (unclaimed only) */}
                  {!isClaimed && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate flex-1">
                          {`/claim/${patient.claimToken.slice(0, 10)}…`}
                        </p>
                        <button
                          onClick={() => copyClaimLink(patient.claimToken)}
                          className="flex-shrink-0 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                          aria-label="Copy claim link"
                        >
                          <Copy className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {!isClaimed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 dark:border-gray-700 dark:text-gray-300 min-h-[44px] flex-1"
                        onClick={() => openWhatsApp(patient)}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Remind
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 dark:border-gray-700 dark:text-gray-300 min-h-[44px] flex-1"
                      onClick={() => openVitalsDialog(patient)}
                    >
                      <Activity className="h-3.5 w-3.5" />
                      Add Vitals
                    </Button>
                    <Link href={`/doctor/patients/managed/${patient.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 dark:border-gray-700 dark:text-gray-300 min-h-[44px] w-full"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
