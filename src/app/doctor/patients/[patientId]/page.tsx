"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Activity, AlertTriangle, Pill, FileText, Heart, Thermometer,
  Droplets, Footprints, Weight, Wind, ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { toast } from "sonner";

interface HealthLog {
  id: string;
  date: string;
  mood: number | null;
  sleep: number | null;
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  bloodSugar: number | null;
  temperature: number | null;
  oxygenSaturation: number | null;
  weight: number | null;
  steps: number | null;
}

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  isActive: boolean;
  startDate: string | null;
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
  createdAt: string;
}

interface PatientDetail {
  patientUserId: string;
  name: string | null;
  email: string;
  bloodType: string | null;
  allergies: string | null;
  healthLogs: HealthLog[];
  medications: Medication[];
  alerts: Alert[];
}

function VitalCard({ label, value, icon: Icon, unit, color }: {
  label: string; value: string | number | null | undefined; icon: any; unit?: string; color: string;
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
        <div className={`inline-flex p-2 rounded-lg mb-2 ${colorMap[color]}`}>
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

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/doctor/patients/${patientId}`).then((r) => r.json()),
      fetch(`/api/doctor/notes?patientId=${patientId}`).then((r) => r.json()),
    ])
      .then(([patientData, notesData]) => {
        setPatient(patientData.patient ?? patientData ?? null);
        setNotes(notesData.notes ?? []);
      })
      .catch(() => toast.error("Failed to load patient data"))
      .finally(() => setLoading(false));
  }, [patientId]);

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

  function getInitials(name: string | null, email: string) {
    if (name) {
      const parts = name.trim().split(" ");
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Patient not found.</p>
        <Link href="/doctor/patients">
          <Button variant="outline" className="mt-4 dark:border-gray-700">Back to Patients</Button>
        </Link>
      </div>
    );
  }

  const latestLog = patient.healthLogs.sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const sortedLogs = [...patient.healthLogs].sort((a, b) => b.date.localeCompare(a.date));
  const activeMeds = patient.medications.filter((m) => m.isActive);
  const inactiveMeds = patient.medications.filter((m) => !m.isActive);
  const initials = getInitials(patient.name, patient.email);

  return (
    <div>
      {/* Back */}
      <Link href="/doctor/patients" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Patients
      </Link>

      {/* Patient header */}
      <div className="flex items-start gap-4 mb-8 p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {patient.name || patient.email}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{patient.email}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {patient.bloodType && (
              <Badge variant="secondary" className="dark:bg-gray-800 dark:text-gray-300 gap-1">
                <Droplets className="h-3 w-3" />
                {patient.bloodType}
              </Badge>
            )}
            {patient.allergies && (
              <Badge className="bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                Allergies: {patient.allergies}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 text-right flex-shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400">{patient.healthLogs.length} logs</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{activeMeds.length} active meds</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{patient.alerts.length} alerts</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6 dark:bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Health Logs</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview — vitals grid */}
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
              <p className="text-xs text-gray-400 dark:text-gray-500">No logs recorded yet</p>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <VitalCard
              label="Blood Pressure"
              value={latestLog?.systolic && latestLog?.diastolic ? `${latestLog.systolic}/${latestLog.diastolic}` : null}
              icon={Activity}
              unit="mmHg"
              color="blue"
            />
            <VitalCard label="Heart Rate" value={latestLog?.heartRate} icon={Heart} unit="bpm" color="red" />
            <VitalCard label="Blood Sugar" value={latestLog?.bloodSugar} icon={Droplets} unit="mg/dL" color="orange" />
            <VitalCard label="Temperature" value={latestLog?.temperature} icon={Thermometer} unit="°C" color="red" />
            <VitalCard label="SpO2" value={latestLog?.oxygenSaturation} icon={Wind} unit="%" color="teal" />
            <VitalCard label="Weight" value={latestLog?.weight} icon={Weight} unit="kg" color="purple" />
            <VitalCard label="Steps" value={latestLog?.steps} icon={Footprints} color="green" />
            <VitalCard label="Sleep" value={latestLog?.sleep} icon={Activity} unit="hrs" color="blue" />
          </div>
        </TabsContent>

        {/* Health Logs */}
        <TabsContent value="logs">
          {sortedLogs.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">No health logs yet</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Mood</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Sleep</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">BP</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">HR</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Blood Sugar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sortedLogs.map((log) => (
                    <tr key={log.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                        {log.systolic && log.diastolic ? `${log.systolic}/${log.diastolic}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {log.heartRate != null ? `${log.heartRate} bpm` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {log.bloodSugar != null ? `${log.bloodSugar} mg/dL` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Medications */}
        <TabsContent value="medications">
          <div className="space-y-6">
            {activeMeds.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Active</h3>
                <div className="space-y-2">
                  {activeMeds.map((med) => (
                    <div key={med.id} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{med.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                          {med.prescribedBy && ` · Dr. ${med.prescribedBy}`}
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
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Inactive / Past</h3>
                <div className="space-y-2">
                  {inactiveMeds.map((med) => (
                    <div key={med.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="font-medium text-gray-600 dark:text-gray-400">{med.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-400">Inactive</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {patient.medications.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">No medications on record</p>
            )}
          </div>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts">
          {patient.alerts.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">No alerts for this patient</p>
          ) : (
            <div className="space-y-3">
              {[...patient.alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-4 px-4 py-3 rounded-xl border ${
                    alert.severity === "critical"
                      ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                      : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
                  }`}
                >
                  <AlertTriangle
                    className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      alert.severity === "critical" ? "text-red-500" : "text-yellow-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge
                        className={
                          alert.severity === "critical"
                            ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 capitalize"
                            : "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 capitalize"
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
                        {alert.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{alert.message}</p>
                    {alert.value && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Value: {alert.value}</p>
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

        {/* Notes */}
        <TabsContent value="notes">
          <div className="space-y-5">
            {/* Add note */}
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm dark:text-white">Add Note</CardTitle>
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

            {/* Existing notes */}
            {notes.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-6">No notes yet</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.note}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
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
