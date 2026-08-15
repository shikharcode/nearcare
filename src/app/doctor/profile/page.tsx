"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Save, ExternalLink, UserCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

const SPECIALTIES = [
  "Cardiologist",
  "General Physician",
  "Endocrinologist",
  "Orthopedic",
  "Neurologist",
  "Gynecologist",
  "Dermatologist",
  "Psychiatrist",
  "Pediatrician",
  "Other",
];

interface DoctorProfile {
  specialty: string;
  licenseNumber: string;
  hospital: string;
  phone: string;
  bio: string;
  yearsOfExperience: string;
  languages: string;
}

const emptyProfile: DoctorProfile = {
  specialty: "",
  licenseNumber: "",
  hospital: "",
  phone: "",
  bio: "",
  yearsOfExperience: "",
  languages: "",
};

export default function DoctorProfilePage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<DoctorProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetch("/api/doctor/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && !data.error) {
          // {} means no profile yet (new doctor)
          const hasProfile = Object.keys(data).length > 0;
          if (hasProfile) {
            setProfile({
              specialty: data.specialty ?? "",
              licenseNumber: data.licenseNumber ?? "",
              hospital: data.hospital ?? "",
              phone: data.phone ?? "",
              bio: data.bio ?? "",
              yearsOfExperience: data.yearsOfExperience != null ? String(data.yearsOfExperience) : "",
              languages: data.languages ?? "",
            });
            setIsNew(false);
          } else {
            setIsNew(true);
          }
        }
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/doctor/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success("Profile saved successfully");
      setIsNew(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof DoctorProfile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  // Derive initials for avatar
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "DR";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
          <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your doctor profile and credentials</p>
        </div>
      </div>

      {/* Blue portal banner */}
      <div className="mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-blue-600 dark:bg-blue-700 rounded-xl text-white">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">You are in Doctor Portal</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-blue-100 hover:text-white transition-colors whitespace-nowrap"
        >
          Switch to Patient View
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* New profile setup banner */}
      {!loading && isNew && (
        <div className="mb-6 flex items-start gap-3 px-4 py-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
          <UserCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Set up your doctor profile to start seeing patients</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Complete your professional details below so patients can find and trust you.
            </p>
          </div>
        </div>
      )}

      {/* Profile form */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-base dark:text-white">Professional Information</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Doctor avatar */}
              <div className="flex justify-center mb-2">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold shadow-lg select-none">
                  {initials}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Specialty */}
                <div className="space-y-1.5">
                  <Label htmlFor="specialty" className="dark:text-gray-300">Specialty</Label>
                  <select
                    id="specialty"
                    value={profile.specialty}
                    onChange={(e) => handleChange("specialty", e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="">Select specialty...</option>
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* License number */}
                <div className="space-y-1.5">
                  <Label htmlFor="license" className="dark:text-gray-300">License Number</Label>
                  <Input
                    id="license"
                    placeholder="e.g. MD-123456"
                    value={profile.licenseNumber}
                    onChange={(e) => handleChange("licenseNumber", e.target.value)}
                    className="h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                {/* Hospital/Clinic */}
                <div className="space-y-1.5">
                  <Label htmlFor="hospital" className="dark:text-gray-300">Hospital / Clinic Name</Label>
                  <Input
                    id="hospital"
                    placeholder="e.g. City General Hospital"
                    value={profile.hospital}
                    onChange={(e) => handleChange("hospital", e.target.value)}
                    className="h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="dark:text-gray-300">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +1 555 000 0000"
                    value={profile.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                {/* Years of experience */}
                <div className="space-y-1.5">
                  <Label htmlFor="yearsOfExperience" className="dark:text-gray-300">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    min="0"
                    max="60"
                    placeholder="e.g. 10"
                    value={profile.yearsOfExperience}
                    onChange={(e) => handleChange("yearsOfExperience", e.target.value)}
                    className="h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                {/* Languages */}
                <div className="space-y-1.5">
                  <Label htmlFor="languages" className="dark:text-gray-300">Languages Spoken</Label>
                  <Input
                    id="languages"
                    placeholder="e.g. English, Hindi, Spanish"
                    value={profile.languages}
                    onChange={(e) => handleChange("languages", e.target.value)}
                    className="h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500">Comma separated</p>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <Label htmlFor="bio" className="dark:text-gray-300">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Brief professional bio visible to your patients..."
                  value={profile.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  rows={5}
                  className="resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-12 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all md:w-auto md:min-w-48"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : isNew ? "Create Profile" : "Save Profile"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
