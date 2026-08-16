"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  MessageCircle,
  ExternalLink,
  Pencil,
  X,
  Check,
  Activity,
  Heart,
  Droplets,
  Thermometer,
  Wind,
  Weight,
  Pill,
  FileText,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, today } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ManagedPatient {
  id: string;
  doctorUserId: string;
  name: string;
  dateOfBirth: string | null;
  phone: string | null;
  bloodType: string | null;
  allergies: string | null;
  emergencyContact: string | null;
  notes: string | null;
  claimToken: string;
  claimedAt: string | null;
  claimedByUserId: string | null;
  createdAt: string;
  isClaimed: boolean;
  claimUrl: string;
}

interface RealMedication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  isActive: boolean;
  startDate: string | null;
  notes: string | null;
  prescribedBy: string | null;
}

interface MedicationEntry {
  type: "medication_entry";
  managedPatientId: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  duration: string | null;
  prescribedBy: string | null;
  date: string;
}

interface VitalsEntry {
  type: "vitals_entry";
  date?: string;
  heartRate?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  bloodSugar?: number | null;
  oxygenSaturation?: number | null;
  temperature?: number | null;
  weight?: number | null;
}

interface DoctorNote {
  id: string;
  note: string;
  isPrivate: boolean;
  createdAt: string;
}

interface PageData {
  patient: ManagedPatient;
  medications: RealMedication[];
  notes: DoctorNote[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "As needed",
  "Weekly",
];

const BLOOD_TYPE_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseNoteAs<T>(note: string): T | null {
  try {
    return JSON.parse(note) as T;
  } catch {
    return null;
  }
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-white">
        {value || <span className="text-gray-400 dark:text-gray-600 italic">Not set</span>}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManagedPatientDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Edit state ---
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBloodType, setEditBloodType] = useState("");
  const [editAllergies, setEditAllergies] = useState("");
  const [editEmergency, setEditEmergency] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // --- Vitals form ---
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [vDate, setVDate] = useState(today());
  const [vBpSys, setVBpSys] = useState("");
  const [vBpDia, setVBpDia] = useState("");
  const [vHr, setVHr] = useState("");
  const [vBs, setVBs] = useState("");
  const [vSpo2, setVSpo2] = useState("");
  const [vTemp, setVTemp] = useState("");
  const [vWeight, setVWeight] = useState("");
  const [savingVitals, setSavingVitals] = useState(false);

  // --- Medications form ---
  const [showMedForm, setShowMedForm] = useState(false);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medFrequency, setMedFrequency] = useState("");
  const [medInstructions, setMedInstructions] = useState("");
  const [savingMed, setSavingMed] = useState(false);

  // --- Notes form ---
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // ---------------------------------------------------------------------------
  // Load data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetch(`/api/doctor/managed-patients/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d as PageData);
      })
      .catch(() => toast.error("Failed to load patient"))
      .finally(() => setLoading(false));
  }, [id]);

  // ---------------------------------------------------------------------------
  // Derived lists from notes
  // ---------------------------------------------------------------------------

  const vitalsFromNotes: Array<VitalsEntry & { id: string; createdAt: string }> = [];
  const medEntriesFromNotes: Array<MedicationEntry & { id: string; createdAt: string }> = [];
  const clinicalNotes: DoctorNote[] = [];

  if (data) {
    for (const n of data.notes) {
      const parsed = parseNoteAs<{ type?: string }>(n.note);
      if (parsed?.type === "vitals_entry") {
        vitalsFromNotes.push({
          ...(parsed as VitalsEntry),
          id: n.id,
          createdAt: n.createdAt,
        });
      } else if (parsed?.type === "medication_entry") {
        medEntriesFromNotes.push({
          ...(parsed as MedicationEntry),
          id: n.id,
          createdAt: n.createdAt,
        });
      } else {
        clinicalNotes.push(n);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  function startEdit() {
    if (!data) return;
    const p = data.patient;
    setEditName(p.name);
    setEditDob(p.dateOfBirth ?? "");
    setEditPhone(p.phone ?? "");
    setEditBloodType(p.bloodType ?? "");
    setEditAllergies(p.allergies ?? "");
    setEditEmergency(p.emergencyContact ?? "");
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/doctor/managed-patients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          dateOfBirth: editDob || null,
          phone: editPhone || null,
          bloodType: editBloodType || null,
          allergies: editAllergies || null,
          emergencyContact: editEmergency || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to save");
      setData((prev) => prev ? { ...prev, patient: d.patient } : prev);
      setEditing(false);
      toast.success("Patient info updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleCopyLink() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.patient.claimUrl);
      toast.success("Claim link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  function handleWhatsApp() {
    if (!data) return;
    const text = encodeURIComponent(
      `Hi ${data.patient.name}, your doctor has created a health profile for you on NearCare. Click here to claim it and access your records: ${data.patient.claimUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  async function handleAddVitals() {
    setSavingVitals(true);
    try {
      const body: Record<string, unknown> = { date: vDate };
      if (vBpSys) body.systolic = Number(vBpSys);
      if (vBpDia) body.diastolic = Number(vBpDia);
      if (vHr) body.heartRate = Number(vHr);
      if (vBs) body.bloodSugar = Number(vBs);
      if (vSpo2) body.oxygenSaturation = Number(vSpo2);
      if (vTemp) body.temperature = Number(vTemp);
      if (vWeight) body.weight = Number(vWeight);

      const res = await fetch(`/api/doctor/managed-patients/${id}/vitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to save vitals");

      // Optimistically add to notes list so the table refreshes
      if (d.stored === "notes" && d.log) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                notes: [
                  {
                    id: d.log.id,
                    note: d.log.note,
                    isPrivate: d.log.isPrivate,
                    createdAt: d.log.createdAt,
                  },
                  ...prev.notes,
                ],
              }
            : prev
        );
      }

      // Reset form
      setVDate(today());
      setVBpSys(""); setVBpDia(""); setVHr(""); setVBs("");
      setVSpo2(""); setVTemp(""); setVWeight("");
      setShowVitalsForm(false);
      toast.success("Vitals saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save vitals");
    } finally {
      setSavingVitals(false);
    }
  }

  async function handleAddMedication() {
    if (!medName.trim()) {
      toast.error("Medication name is required");
      return;
    }
    setSavingMed(true);
    try {
      const res = await fetch(`/api/doctor/managed-patients/${id}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: medName.trim(),
          dosage: medDosage || null,
          frequency: medFrequency || null,
          instructions: medInstructions || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to add medication");

      if (d.stored === "medications" && d.medication) {
        setData((prev) =>
          prev ? { ...prev, medications: [d.medication, ...prev.medications] } : prev
        );
      } else if (d.stored === "notes" && d.medication) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                notes: [
                  {
                    id: d.medication.id,
                    note: d.medication.note,
                    isPrivate: d.medication.isPrivate,
                    createdAt: d.medication.createdAt,
                  },
                  ...prev.notes,
                ],
              }
            : prev
        );
      }

      setMedName(""); setMedDosage(""); setMedFrequency(""); setMedInstructions("");
      setShowMedForm(false);
      toast.success(`${medName} added`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add medication");
    } finally {
      setSavingMed(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/doctor/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientUserId: id, note: noteText.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to save note");
      setData((prev) =>
        prev ? { ...prev, notes: [d.note, ...prev.notes] } : prev
      );
      setNoteText("");
      toast.success("Note saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-36 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Patient not found.</p>
        <Link href="/doctor/patients/managed">
          <Button variant="outline" className="mt-4 dark:border-gray-700">
            Back to Managed Patients
          </Button>
        </Link>
      </div>
    );
  }

  const { patient } = data;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* Back link */}
      <Link
        href="/doctor/patients/managed"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Managed Patients
      </Link>

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-start gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {patient.name}
            </h1>
            {patient.isClaimed ? (
              <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                Active
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="dark:bg-gray-700 dark:text-gray-300"
              >
                Unclaimed
              </Badge>
            )}
          </div>
          {patient.dateOfBirth && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              DOB: {formatDate(patient.dateOfBirth)}
            </p>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Claim link card — unclaimed only                                    */}
      {/* ------------------------------------------------------------------ */}
      {!patient.isClaimed && (
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-blue-800 dark:text-blue-300">
              Share Claim Link
            </CardTitle>
            <p className="text-sm text-blue-700/80 dark:text-blue-400/80">
              Send this link to your patient so they can claim their profile and
              access their health records on NearCare.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 px-3 py-2">
              <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300 font-mono">
                {patient.claimUrl}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleCopyLink}
                className="gap-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button
                onClick={handleWhatsApp}
                className="gap-2 min-h-[44px] bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="h-4 w-4" />
                Share via WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Claimed — active patient link                                       */}
      {/* ------------------------------------------------------------------ */}
      {patient.isClaimed && patient.claimedByUserId && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-950/20 px-4 py-3">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-300 flex-1">
            This patient has claimed their profile and is now an active patient.
          </p>
          <Link
            href={`/doctor/patients/${patient.claimedByUserId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 dark:text-green-400 hover:underline whitespace-nowrap min-h-[44px] px-1 items-center"
          >
            View full profile
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Tabs                                                                */}
      {/* ------------------------------------------------------------------ */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6 dark:bg-gray-800 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- */}
        {/* Overview tab                                                      */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="overview">
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base dark:text-white">
                  Patient Information
                </CardTitle>
                {!editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEdit}
                    className="gap-1.5 min-h-[44px] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="dark:text-gray-300">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Date of birth */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">Date of Birth</Label>
                      <Input
                        type="date"
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">Phone</Label>
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    {/* Blood type */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">Blood Type</Label>
                      <Select
                        value={editBloodType}
                        onValueChange={(v) => {
                          if (v !== null) setEditBloodType(v);
                        }}
                      >
                        <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_TYPE_OPTIONS.map((bt) => (
                            <SelectItem key={bt} value={bt}>
                              {bt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Allergies */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">Allergies</Label>
                      <Input
                        value={editAllergies}
                        onChange={(e) => setEditAllergies(e.target.value)}
                        placeholder="Penicillin, Peanuts..."
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    {/* Emergency contact */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="dark:text-gray-300">
                        Emergency Contact
                      </Label>
                      <Input
                        value={editEmergency}
                        onChange={(e) => setEditEmergency(e.target.value)}
                        placeholder="Name — phone number"
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="gap-2 min-h-[44px]"
                    >
                      <Check className="h-4 w-4" />
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditing(false)}
                      disabled={savingEdit}
                      className="gap-2 min-h-[44px] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InfoRow label="Full Name" value={patient.name} />
                  <InfoRow
                    label="Date of Birth"
                    value={
                      patient.dateOfBirth ? formatDate(patient.dateOfBirth) : null
                    }
                  />
                  <InfoRow label="Phone" value={patient.phone} />
                  <InfoRow label="Blood Type" value={patient.bloodType} />
                  <InfoRow label="Allergies" value={patient.allergies} />
                  <InfoRow
                    label="Emergency Contact"
                    value={patient.emergencyContact}
                  />
                  {patient.notes && (
                    <div className="sm:col-span-2">
                      <InfoRow label="Notes" value={patient.notes} />
                    </div>
                  )}
                  <InfoRow
                    label="Added On"
                    value={formatDate(patient.createdAt)}
                  />
                  <InfoRow
                    label="Status"
                    value={patient.isClaimed ? "Active (claimed)" : "Unclaimed"}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Vitals tab                                                        */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="vitals">
          <div className="space-y-6">
            {/* Add vitals button / form */}
            {!showVitalsForm ? (
              <Button
                onClick={() => setShowVitalsForm(true)}
                className="gap-2 min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                Add Vitals
              </Button>
            ) : (
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base dark:text-white">
                      <Activity className="h-4 w-4 text-blue-500" />
                      Add Vitals Entry
                    </CardTitle>
                    <button
                      type="button"
                      onClick={() => setShowVitalsForm(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="dark:text-gray-300">Date</Label>
                      <Input
                        type="date"
                        value={vDate}
                        onChange={(e) => setVDate(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>

                    {/* BP */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">
                        Systolic BP (mmHg)
                      </Label>
                      <Input
                        type="number"
                        placeholder="120"
                        value={vBpSys}
                        onChange={(e) => setVBpSys(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">
                        Diastolic BP (mmHg)
                      </Label>
                      <Input
                        type="number"
                        placeholder="80"
                        value={vBpDia}
                        onChange={(e) => setVBpDia(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    {/* HR */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">
                        Heart Rate (bpm)
                      </Label>
                      <Input
                        type="number"
                        placeholder="72"
                        value={vHr}
                        onChange={(e) => setVHr(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    {/* Blood Sugar */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">
                        Blood Sugar (mg/dL)
                      </Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={vBs}
                        onChange={(e) => setVBs(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    {/* SpO2 */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">SpO2 (%)</Label>
                      <Input
                        type="number"
                        placeholder="98"
                        value={vSpo2}
                        onChange={(e) => setVSpo2(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    {/* Temp */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">
                        Temperature (°C)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="37.0"
                        value={vTemp}
                        onChange={(e) => setVTemp(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    {/* Weight */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="70.0"
                        value={vWeight}
                        onChange={(e) => setVWeight(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAddVitals}
                    disabled={savingVitals}
                    className="gap-2 min-h-[44px]"
                  >
                    <Activity className="h-4 w-4" />
                    {savingVitals ? "Saving..." : "Save Vitals"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Vitals table */}
            {vitalsFromNotes.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                No vitals recorded yet
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5 text-blue-500" />
                          BP
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5 text-red-500" />
                          HR
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Droplets className="h-3.5 w-3.5 text-orange-500" />
                          Sugar
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Wind className="h-3.5 w-3.5 text-teal-500" />
                          SpO2
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Thermometer className="h-3.5 w-3.5 text-red-400" />
                          Temp
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Weight className="h-3.5 w-3.5 text-purple-500" />
                          Weight
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {vitalsFromNotes.map((v) => (
                      <tr
                        key={v.id}
                        className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {v.date ? formatDate(v.date) : formatDate(v.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {v.systolic && v.diastolic
                            ? `${v.systolic}/${v.diastolic}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {v.heartRate != null ? `${v.heartRate} bpm` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {v.bloodSugar != null ? `${v.bloodSugar} mg/dL` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {v.oxygenSaturation != null
                            ? `${v.oxygenSaturation}%`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {v.temperature != null ? `${v.temperature}°C` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {v.weight != null ? `${v.weight} kg` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Medications tab                                                   */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="medications">
          <div className="space-y-6">
            {/* Add medication button / form */}
            {!showMedForm ? (
              <Button
                onClick={() => setShowMedForm(true)}
                className="gap-2 min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                Add Medication
              </Button>
            ) : (
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base dark:text-white">
                      <Pill className="h-4 w-4 text-blue-500" />
                      Add Medication
                    </CardTitle>
                    <button
                      type="button"
                      onClick={() => setShowMedForm(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Medication name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="dark:text-gray-300">
                        Medication Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. Metformin, Amlodipine"
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    {/* Dosage */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">Dosage</Label>
                      <Input
                        placeholder="e.g. 500mg"
                        value={medDosage}
                        onChange={(e) => setMedDosage(e.target.value)}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    {/* Frequency */}
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300">Frequency</Label>
                      <Select
                        value={medFrequency}
                        onValueChange={(v) => {
                          if (v !== null) setMedFrequency(v);
                        }}
                      >
                        <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="dark:text-gray-300">
                        Instructions for Patient
                      </Label>
                      <Textarea
                        placeholder='e.g. "Take with food", "Avoid alcohol"'
                        value={medInstructions}
                        onChange={(e) => setMedInstructions(e.target.value)}
                        rows={3}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 resize-none"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAddMedication}
                    disabled={savingMed || !medName.trim()}
                    className="gap-2 min-h-[44px]"
                  >
                    <Pill className="h-4 w-4" />
                    {savingMed ? "Saving..." : "Add Medication"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Real medications (claimed patient) */}
            {data.medications.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Active Medications
                </h3>
                <div className="space-y-2">
                  {data.medications
                    .filter((m) => m.isActive)
                    .map((med) => (
                      <MedRow key={med.id} name={med.name} dosage={med.dosage} frequency={med.frequency} notes={med.notes} isActive />
                    ))}
                  {data.medications
                    .filter((m) => !m.isActive)
                    .map((med) => (
                      <MedRow key={med.id} name={med.name} dosage={med.dosage} frequency={med.frequency} notes={med.notes} isActive={false} />
                    ))}
                </div>
              </div>
            )}

            {/* Medication entries from notes (unclaimed) */}
            {medEntriesFromNotes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Prescribed (pending claim)
                </h3>
                <div className="space-y-2">
                  {medEntriesFromNotes.map((entry) => (
                    <MedRow
                      key={entry.id}
                      name={entry.name}
                      dosage={entry.dosage}
                      frequency={entry.frequency}
                      notes={entry.instructions}
                      isActive
                      pending
                    />
                  ))}
                </div>
              </div>
            )}

            {data.medications.length === 0 && medEntriesFromNotes.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                No medications recorded yet
              </p>
            )}
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Notes tab                                                         */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="notes">
          <div className="space-y-5">
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm dark:text-white">
                  Add Clinical Note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Write a clinical note about this patient..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 resize-none"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={savingNote || !noteText.trim()}
                  className="gap-2 min-h-[44px]"
                >
                  <FileText className="h-4 w-4" />
                  {savingNote ? "Saving..." : "Add Note"}
                </Button>
              </CardContent>
            </Card>

            {clinicalNotes.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                No clinical notes yet
              </p>
            ) : (
              <div className="space-y-3">
                {clinicalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {note.note}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                      {note.isPrivate && (
                        <Badge
                          variant="secondary"
                          className="text-xs dark:bg-gray-700 dark:text-gray-400"
                        >
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Medication row sub-component
// ---------------------------------------------------------------------------

function MedRow({
  name,
  dosage,
  frequency,
  notes,
  isActive,
  pending = false,
}: {
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  notes?: string | null;
  isActive: boolean;
  pending?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-4 py-3 rounded-xl border",
        isActive
          ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
          : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
      )}
    >
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium",
            isActive
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 line-through"
          )}
        >
          {name}
        </p>
        {(dosage || frequency) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {[dosage, frequency].filter(Boolean).join(" · ")}
          </p>
        )}
        {notes && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
            {notes}
          </p>
        )}
      </div>
      {pending ? (
        <Badge
          variant="secondary"
          className="dark:bg-gray-700 dark:text-gray-400 shrink-0"
        >
          Pending claim
        </Badge>
      ) : isActive ? (
        <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 shrink-0">
          Active
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="dark:bg-gray-700 dark:text-gray-400 shrink-0"
        >
          Inactive
        </Badge>
      )}
    </div>
  );
}
