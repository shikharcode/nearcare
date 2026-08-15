"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Activity, AlertTriangle, Pill, FileText, Heart, Thermometer,
  Droplets, Footprints, Weight, Wind, ArrowLeft, FlaskConical,
  ClipboardList, CheckCircle2, XCircle, Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HealthLog {
  id: string;
  date: string;
  mood: number | null;
  energy: number | null;
  sleep: number | null;
  water: number | null;
  steps: number | null;
  weight: number | null;
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  bloodSugar: number | null;
  temperature: number | null;
  oxygenSaturation: number | null;
}

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  isActive: boolean;
  startDate: string | null;
  notes: string | null;
  prescribedBy: string | null;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  value: string | null;
  createdAt: string;
}

interface DoctorNote {
  id: string;
  note: string;
  isPrivate: boolean;
  createdAt: string;
}

interface PatientDetail {
  patientUserId: string;
  name: string | null;
  email: string;
  bloodType: string | null;
  allergies: string | null;
  createdAt: string | null;
  healthLogs: HealthLog[];
  medications: Medication[];
  alerts: Alert[];
}

interface LabOrder {
  noteId: string;
  testName: string;
  priority: string;
  instructions: string;
  orderedAt: string;
}

// ---------------------------------------------------------------------------
// Small shared components
// ---------------------------------------------------------------------------

function VitalCard({
  label,
  value,
  icon: Icon,
  unit,
  color,
}: {
  label: string;
  value: string | number | null | undefined;
  icon: React.ElementType;
  unit?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
    red: "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400",
    green: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400",
    orange: "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
    purple: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
    teal: "bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400",
  };
  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardContent className="pt-4">
        <div className={cn("inline-flex p-2 rounded-lg mb-2", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xl font-bold text-gray-900 dark:text-white">
          {value != null ? `${value}${unit ? " " + unit : ""}` : "—"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center px-4 py-2">
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-xs text-white/70 mt-0.5">{label}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const FREQUENCY_OPTIONS = [
  { value: "Once daily", label: "Once daily" },
  { value: "Twice daily", label: "Twice daily" },
  { value: "Three times daily", label: "Three times daily" },
  { value: "As needed", label: "As needed" },
];

const LAB_TEST_OPTIONS = [
  "CBC (Complete Blood Count)",
  "Blood Sugar (Fasting)",
  "HbA1c",
  "Lipid Profile",
  "Thyroid Panel",
  "Kidney Function",
  "Liver Function",
  "Urine Analysis",
  "ECG",
  "X-Ray",
  "Other",
];

const PRIORITY_OPTIONS = [
  { value: "Routine", label: "Routine" },
  { value: "Urgent", label: "Urgent" },
];

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Notes tab
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Prescribe tab
  const [rxName, setRxName] = useState("");
  const [rxDosage, setRxDosage] = useState("");
  const [rxFrequency, setRxFrequency] = useState("");
  const [rxDuration, setRxDuration] = useState("");
  const [rxInstructions, setRxInstructions] = useState("");
  const [prescribing, setPrescribing] = useState(false);

  // Lab tests tab
  const [labTest, setLabTest] = useState("");
  const [labCustomTest, setLabCustomTest] = useState("");
  const [labPriority, setLabPriority] = useState("Routine");
  const [labInstructions, setLabInstructions] = useState("");
  const [orderingLab, setOrderingLab] = useState(false);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/doctor/patients/${patientId}`).then((r) => r.json()),
      fetch(`/api/doctor/notes?patientId=${patientId}`).then((r) => r.json()),
    ])
      .then(([patientData, notesData]) => {
        const p: PatientDetail = patientData.patient ?? patientData ?? null;
        setPatient(p);

        const allNotes: DoctorNote[] = notesData.notes ?? [];
        // Separate lab orders (stored as JSON in note field) from clinical notes
        const regularNotes: DoctorNote[] = [];
        const orders: LabOrder[] = [];
        for (const n of allNotes) {
          try {
            const parsed = JSON.parse(n.note);
            if (parsed.__type === "lab_order") {
              orders.push({
                noteId: n.id,
                testName: parsed.testName,
                priority: parsed.priority,
                instructions: parsed.instructions,
                orderedAt: n.createdAt,
              });
              continue;
            }
          } catch {
            // not JSON — it's a plain clinical note
          }
          regularNotes.push(n);
        }
        setNotes(regularNotes);
        setLabOrders(orders);
      })
      .catch(() => toast.error("Failed to load patient data"))
      .finally(() => setLoading(false));
  }, [patientId]);

  // -- Notes --
  async function handleAddNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/doctor/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientUserId: patientId, note: noteText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save note");
      setNotes((prev) => [data.note, ...prev]);
      setNoteText("");
      toast.success("Note saved");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingNote(false);
    }
  }

  // -- Prescribe --
  async function handlePrescribe() {
    if (!rxName.trim() || !rxFrequency) {
      toast.error("Medication name and frequency are required");
      return;
    }
    setPrescribing(true);
    try {
      const res = await fetch("/api/doctor/prescribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientUserId: patientId,
          name: rxName.trim(),
          dosage: rxDosage.trim() || null,
          frequency: rxFrequency,
          duration: rxDuration.trim() || null,
          instructions: rxInstructions.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to prescribe");
      // Optimistically add to patient medications list
      if (data.medication && patient) {
        setPatient((prev) =>
          prev
            ? { ...prev, medications: [data.medication, ...prev.medications] }
            : prev
        );
      }
      setRxName("");
      setRxDosage("");
      setRxFrequency("");
      setRxDuration("");
      setRxInstructions("");
      toast.success(`${rxName} prescribed successfully`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPrescribing(false);
    }
  }

  // -- Lab Orders --
  async function handleOrderLab() {
    const testName = labTest === "Other" ? labCustomTest.trim() : labTest;
    if (!testName) {
      toast.error("Please select or enter a test name");
      return;
    }
    setOrderingLab(true);
    try {
      const payload = JSON.stringify({
        __type: "lab_order",
        testName,
        priority: labPriority,
        instructions: labInstructions.trim(),
      });
      const res = await fetch("/api/doctor/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientUserId: patientId, note: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to order test");
      setLabOrders((prev) => [
        {
          noteId: data.note.id,
          testName,
          priority: labPriority,
          instructions: labInstructions.trim(),
          orderedAt: data.note.createdAt,
        },
        ...prev,
      ]);
      setLabTest("");
      setLabCustomTest("");
      setLabPriority("Routine");
      setLabInstructions("");
      toast.success(`${testName} ordered`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setOrderingLab(false);
    }
  }

  // -- Discontinue medication --
  async function handleDiscontinue(medId: string, medName: string) {
    try {
      const res = await fetch(`/api/doctor/prescribe`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicationId: medId, isActive: false }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update");
      }
      setPatient((prev) =>
        prev
          ? {
              ...prev,
              medications: prev.medications.map((m) =>
                m.id === medId ? { ...m, isActive: false } : m
              ),
            }
          : prev
      );
      toast.success(`${medName} marked as discontinued`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function getInitials(name: string | null, email: string) {
    if (name) {
      const parts = name.trim().split(" ");
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  }

  // ---------------------------------------------------------------------------
  // Render: loading / not found
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-32 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-52 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Patient not found.</p>
        <Link href="/doctor/patients">
          <Button variant="outline" className="mt-4 dark:border-gray-700">
            Back to Patients
          </Button>
        </Link>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const latestLog =
    [...patient.healthLogs].sort((a, b) => b.date.localeCompare(a.date))[0] ??
    null;
  const sortedLogs = [...patient.healthLogs].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const activeMeds = patient.medications.filter((m) => m.isActive);
  const inactiveMeds = patient.medications.filter((m) => !m.isActive);
  const initials = getInitials(patient.name, patient.email);

  // Medications prescribed BY this doctor (prescribedBy set on them)
  // We surface them in the Prescribe tab
  const myPrescriptions = patient.medications.filter(
    (m) => m.prescribedBy !== null && m.prescribedBy !== undefined && m.prescribedBy !== ""
  );

  const displayName = patient.name || patient.email;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* Back link */}
      <Link
        href="/doctor/patients"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Patients
      </Link>

      {/* ------------------------------------------------------------------ */}
      {/* Patient header banner                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl overflow-hidden mb-8 border border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Gradient banner */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 px-6 pt-6 pb-8">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border-2 border-white/30 shadow-lg">
              {initials}
            </div>
            {/* Name + email + badges */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white leading-tight truncate">
                {displayName}
              </h1>
              {patient.name && (
                <p className="text-sm text-white/80 mt-0.5">{patient.email}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {patient.bloodType && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-medium border border-white/30">
                    <Droplets className="h-3 w-3" />
                    {patient.bloodType}
                  </span>
                )}
                {patient.allergies && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400/30 text-yellow-100 text-xs font-medium border border-yellow-300/40">
                    <AlertTriangle className="h-3 w-3" />
                    Allergies: {patient.allergies}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="bg-blue-700 dark:bg-blue-900/80 flex divide-x divide-white/20">
          <StatPill label="Health Logs" value={patient.healthLogs.length} />
          <StatPill label="Medications" value={activeMeds.length} />
          <StatPill label="Alerts" value={patient.alerts.length} />
          <StatPill label="Lab Orders" value={labOrders.length} />
          <div className="flex flex-col items-center px-4 py-2 ml-auto">
            {patient.createdAt ? (
              <>
                <span className="text-xs text-white/70">Member since</span>
                <span className="text-xs font-semibold text-white mt-0.5">
                  {formatDate(patient.createdAt)}
                </span>
              </>
            ) : (
              <span className="text-xs text-white/50">—</span>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tabs                                                                */}
      {/* ------------------------------------------------------------------ */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6 dark:bg-gray-800 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Health Logs</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="prescribe" className="gap-1.5">
            <Pill className="h-3.5 w-3.5" />
            Prescribe
          </TabsTrigger>
          <TabsTrigger value="lab-tests" className="gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Lab Tests
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- */}
        {/* Overview — latest vitals                                         */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="overview">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Latest Vitals
            </h2>
            {latestLog ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                From log on {new Date(latestLog.date).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                No logs recorded yet
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <VitalCard
              label="Blood Pressure"
              value={
                latestLog?.systolic && latestLog?.diastolic
                  ? `${latestLog.systolic}/${latestLog.diastolic}`
                  : null
              }
              icon={Activity}
              unit="mmHg"
              color="blue"
            />
            <VitalCard
              label="Heart Rate"
              value={latestLog?.heartRate}
              icon={Heart}
              unit="bpm"
              color="red"
            />
            <VitalCard
              label="Blood Sugar"
              value={latestLog?.bloodSugar}
              icon={Droplets}
              unit="mg/dL"
              color="orange"
            />
            <VitalCard
              label="Temperature"
              value={latestLog?.temperature}
              icon={Thermometer}
              unit="°C"
              color="red"
            />
            <VitalCard
              label="SpO2"
              value={latestLog?.oxygenSaturation}
              icon={Wind}
              unit="%"
              color="teal"
            />
            <VitalCard
              label="Weight"
              value={latestLog?.weight}
              icon={Weight}
              unit="kg"
              color="purple"
            />
            <VitalCard
              label="Steps"
              value={latestLog?.steps}
              icon={Footprints}
              color="green"
            />
            <VitalCard
              label="Sleep"
              value={latestLog?.sleep}
              icon={Activity}
              unit="hrs"
              color="blue"
            />
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Health Logs                                                       */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="logs">
          {sortedLogs.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">
              No health logs yet
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Mood
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Sleep
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      BP
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      HR
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Blood Sugar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sortedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {log.mood != null ? `${log.mood}/5` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {log.sleep != null ? `${log.sleep}h` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {log.systolic && log.diastolic
                          ? `${log.systolic}/${log.diastolic}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {log.heartRate != null ? `${log.heartRate} bpm` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {log.bloodSugar != null
                          ? `${log.bloodSugar} mg/dL`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Medications (patient's full list)                                */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="medications">
          <div className="space-y-6">
            {activeMeds.length > 0 && (
              <div>
                <SectionLabel>Active</SectionLabel>
                <div className="space-y-2">
                  {activeMeds.map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {med.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {[med.dosage, med.frequency]
                            .filter(Boolean)
                            .join(" · ")}
                          {med.prescribedBy && ` · Prescribed by ${med.prescribedBy}`}
                        </p>
                      </div>
                      <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inactiveMeds.length > 0 && (
              <div>
                <SectionLabel>Inactive / Past</SectionLabel>
                <div className="space-y-2">
                  {inactiveMeds.map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800"
                    >
                      <div>
                        <p className="font-medium text-gray-600 dark:text-gray-400">
                          {med.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {[med.dosage, med.frequency]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="dark:bg-gray-700 dark:text-gray-400"
                      >
                        Inactive
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {patient.medications.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                No medications on record
              </p>
            )}
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Alerts                                                            */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="alerts">
          {patient.alerts.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">
              No alerts for this patient
            </p>
          ) : (
            <div className="space-y-3">
              {[...patient.alerts]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-4 px-4 py-3 rounded-xl border",
                      alert.severity === "critical"
                        ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                        : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
                    )}
                  >
                    <AlertTriangle
                      className={cn(
                        "h-4 w-4 mt-0.5 flex-shrink-0",
                        alert.severity === "critical"
                          ? "text-red-500"
                          : "text-yellow-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge
                          className={cn(
                            "capitalize",
                            alert.severity === "critical"
                              ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                              : "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                          )}
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
                          {alert.type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {alert.message}
                      </p>
                      {alert.value && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Value: {alert.value}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Notes                                                             */}
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
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {savingNote ? "Saving..." : "Add Note"}
                </Button>
              </CardContent>
            </Card>

            {notes.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                No clinical notes yet
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {note.note}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Prescribe                                                         */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="prescribe">
          <div className="space-y-8">
            {/* Form */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base dark:text-white">
                  <Pill className="h-4 w-4 text-blue-500" />
                  Prescribe Medication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Medication name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="dark:text-gray-300">
                      Medication Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Amoxicillin, Metformin, Atorvastatin"
                      value={rxName}
                      onChange={(e) => setRxName(e.target.value)}
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                    />
                  </div>

                  {/* Dosage */}
                  <div className="space-y-1.5">
                    <Label className="dark:text-gray-300">Dosage</Label>
                    <Input
                      placeholder="e.g. 500mg, 10mg"
                      value={rxDosage}
                      onChange={(e) => setRxDosage(e.target.value)}
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                    />
                  </div>

                  {/* Frequency */}
                  <div className="space-y-1.5">
                    <Label className="dark:text-gray-300">
                      Frequency <span className="text-red-500">*</span>
                    </Label>
                    <Select value={rxFrequency} onValueChange={(v) => { if (v !== null) setRxFrequency(v); }}>
                      <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-1.5">
                    <Label className="dark:text-gray-300">Duration</Label>
                    <Input
                      placeholder="e.g. 7 days, 1 month, ongoing"
                      value={rxDuration}
                      onChange={(e) => setRxDuration(e.target.value)}
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="dark:text-gray-300">Instructions for Patient</Label>
                    <Textarea
                      placeholder='e.g. "Take with food", "Avoid alcohol", "Take at bedtime"'
                      value={rxInstructions}
                      onChange={(e) => setRxInstructions(e.target.value)}
                      rows={3}
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 resize-none"
                    />
                  </div>
                </div>

                <Button
                  onClick={handlePrescribe}
                  disabled={prescribing || !rxName.trim() || !rxFrequency}
                  className="gap-2 min-h-[44px]"
                >
                  <Pill className="h-4 w-4" />
                  {prescribing ? "Prescribing..." : "Prescribe to Patient"}
                </Button>
              </CardContent>
            </Card>

            {/* Previously prescribed by this doctor */}
            <div>
              <SectionLabel>Previously Prescribed</SectionLabel>
              {myPrescriptions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  No medications prescribed yet
                </p>
              ) : (
                <div className="space-y-2">
                  {myPrescriptions.map((med) => (
                    <div
                      key={med.id}
                      className={cn(
                        "flex items-center justify-between gap-4 px-4 py-3 rounded-xl border",
                        med.isActive
                          ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                          : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={cn(
                              "font-medium",
                              med.isActive
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-500 dark:text-gray-400 line-through"
                            )}
                          >
                            {med.name}
                          </p>
                          {med.isActive ? (
                            <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="dark:bg-gray-700 dark:text-gray-400 text-xs"
                            >
                              Discontinued
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                          {med.startDate && (
                            <span className="ml-1.5 inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(med.startDate).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                        {med.notes && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
                            {med.notes}
                          </p>
                        )}
                      </div>
                      {med.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDiscontinue(med.id, med.name)}
                          className="shrink-0 gap-1.5 text-xs dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 min-h-[44px]"
                        >
                          <XCircle className="h-3.5 w-3.5 text-red-400" />
                          Mark Discontinued
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Lab Tests                                                         */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="lab-tests">
          <div className="space-y-8">
            {/* Order form */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base dark:text-white">
                  <FlaskConical className="h-4 w-4 text-purple-500" />
                  Order Lab Test
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Test name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="dark:text-gray-300">
                      Test Name <span className="text-red-500">*</span>
                    </Label>
                    <Select value={labTest} onValueChange={(v) => { if (v !== null) setLabTest(v); }}>
                      <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                        <SelectValue placeholder="Select test" />
                      </SelectTrigger>
                      <SelectContent>
                        {LAB_TEST_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {labTest === "Other" && (
                      <Input
                        placeholder="Specify test name"
                        value={labCustomTest}
                        onChange={(e) => setLabCustomTest(e.target.value)}
                        className="mt-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    )}
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <Label className="dark:text-gray-300">Priority</Label>
                    <Select value={labPriority} onValueChange={(v) => { if (v !== null) setLabPriority(v); }}>
                      <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
                      placeholder='e.g. "Fast for 8 hours before test", "Bring previous results"'
                      value={labInstructions}
                      onChange={(e) => setLabInstructions(e.target.value)}
                      rows={3}
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 resize-none"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleOrderLab}
                  disabled={
                    orderingLab ||
                    !labTest ||
                    (labTest === "Other" && !labCustomTest.trim())
                  }
                  className="gap-2 min-h-[44px] bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <ClipboardList className="h-4 w-4" />
                  {orderingLab ? "Ordering..." : "Order Test"}
                </Button>
              </CardContent>
            </Card>

            {/* Previously ordered tests */}
            <div>
              <SectionLabel>Previously Ordered Tests</SectionLabel>
              {labOrders.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  No lab tests ordered yet
                </p>
              ) : (
                <div className="space-y-2">
                  {labOrders.map((order) => (
                    <div
                      key={order.noteId}
                      className="flex items-start gap-4 px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                    >
                      <div className="mt-0.5 p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex-shrink-0">
                        <FlaskConical className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order.testName}
                          </p>
                          <Badge
                            className={cn(
                              "text-xs",
                              order.priority === "Urgent"
                                ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                            )}
                          >
                            {order.priority}
                          </Badge>
                        </div>
                        {order.instructions && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {order.instructions}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          Ordered {new Date(order.orderedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
