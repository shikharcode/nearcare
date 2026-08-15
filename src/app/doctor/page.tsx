"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Stethoscope, AlertTriangle, Pill, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

interface PatientData {
  id: string;
  patientUserId: string;
  name: string | null;
  email: string;
  lastLogDate: string | null;
  medications: { id: string; name: string; isActive: boolean }[];
  alerts: { id: string; severity: string; type: string; message: string }[];
}

export default function DoctorDashboardPage() {
  const { user } = useUser();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/doctor/patients")
      .then((r) => r.json())
      .then((data) => {
        setPatients(data.patients ?? []);
      })
      .catch(() => toast.error("Failed to load patients"))
      .finally(() => setLoading(false));
  }, []);

  const criticalAlerts = patients.reduce(
    (acc, p) => acc + p.alerts.filter((a) => a.severity === "critical").length,
    0
  );
  const activeMeds = patients.reduce(
    (acc, p) => acc + p.medications.filter((m) => m.isActive).length,
    0
  );

  function getInitials(name: string | null, email: string) {
    if (name) {
      const parts = name.trim().split(" ");
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  }

  const avatarColors = [
    "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
    "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
  ];

  function avatarColor(index: number) {
    return avatarColors[index % avatarColors.length];
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
          <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, Dr. {user?.lastName || user?.firstName || "Doctor"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Your patient overview</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-5">
            <div className="inline-flex p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mb-3">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{patients.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Patients</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-5">
            <div className="inline-flex p-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 mb-3">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{criticalAlerts}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Critical Alerts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5">
            <div className="inline-flex p-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 mb-3">
              <Pill className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeMeds}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Active Medications</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Stethoscope className="h-10 w-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No patients yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Start by inviting your first patient</p>
          <Link href="/doctor/patients">
            <Button className="gap-2">
              <Users className="h-4 w-4" />
              Invite your first patient
            </Button>
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Your Patients
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient, idx) => {
              const hasCritical = patient.alerts.some((a) => a.severity === "critical");
              const initials = getInitials(patient.name, patient.email);
              return (
                <Card key={patient.id} className="hover:shadow-md transition-shadow dark:bg-gray-900">
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className={`w-12 h-12 rounded-full ${avatarColor(idx)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                            {patient.name || patient.email}
                          </h3>
                          {hasCritical && (
                            <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs">
                              Critical
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {patient.lastLogDate
                            ? `Last log: ${new Date(patient.lastLogDate).toLocaleDateString()}`
                            : "No logs yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
                      <Pill className="h-3.5 w-3.5" />
                      <span>{patient.medications.filter((m) => m.isActive).length} active meds</span>
                      {patient.alerts.length > 0 && (
                        <>
                          <span>·</span>
                          <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                          <span>{patient.alerts.length} alert{patient.alerts.length !== 1 ? "s" : ""}</span>
                        </>
                      )}
                    </div>

                    <Link href={`/doctor/patients/${patient.patientUserId}`} className="block">
                      <Button variant="outline" size="sm" className="w-full dark:border-gray-700 dark:text-gray-300">
                        View Patient
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
