"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Save, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { toast } from "sonner";

interface DoctorProfile {
  specialty: string;
  licenseNumber: string;
  hospital: string;
  phone: string;
  bio: string;
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile>({
    specialty: "",
    licenseNumber: "",
    hospital: "",
    phone: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/doctor/profile")
      .then((r) => r.json())
      .then((data) => {
        const p = data.profile ?? data;
        if (p) {
          setProfile({
            specialty: p.specialty ?? "",
            licenseNumber: p.licenseNumber ?? "",
            hospital: p.hospital ?? "",
            phone: p.phone ?? "",
            bio: p.bio ?? "",
          });
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
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof DoctorProfile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Specialty */}
                <div className="space-y-1.5">
                  <Label htmlFor="specialty" className="dark:text-gray-300">Specialty</Label>
                  <Input
                    id="specialty"
                    placeholder="e.g. Cardiology, General Practice"
                    value={profile.specialty}
                    onChange={(e) => handleChange("specialty", e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                {/* License number */}
                <div className="space-y-1.5">
                  <Label htmlFor="license" className="dark:text-gray-300">License Number</Label>
                  <Input
                    id="license"
                    placeholder="e.g. MD-123456"
                    value={profile.licenseNumber}
                    onChange={(e) => handleChange("licenseNumber", e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
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
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
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
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
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

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
