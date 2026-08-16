"use client";

import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { Stethoscope, Save, ExternalLink, UserCircle2, X, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

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

const INDIAN_LANGUAGES = [
  "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil",
  "Urdu", "Gujarati", "Kannada", "Malayalam", "Odia", "Punjabi",
  "Assamese", "Maithili", "Sanskrit", "Other",
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

// ── Language tag multi-select ─────────────────────────────────────────────────

function LanguageSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? value.split(",").map(l => l.trim()).filter(Boolean) : [];
  const [custom, setCustom] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (lang: string) => {
    const next = selected.includes(lang)
      ? selected.filter(l => l !== lang)
      : [...selected, lang];
    onChange(next.join(", "));
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed].join(", "));
    }
    setCustom("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCustom();
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(lang => (
            <span
              key={lang}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            >
              {lang}
              <button
                type="button"
                onClick={() => toggle(lang)}
                className="hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Language grid */}
      <div className="flex flex-wrap gap-1.5">
        {INDIAN_LANGUAGES.map(lang => (
          <button
            key={lang}
            type="button"
            onClick={() => toggle(lang)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 active:scale-95",
              selected.includes(lang)
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
            )}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* Custom language input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add other language..."
          className="flex-1 h-9 px-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="h-9 px-3 text-sm rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ── Phone input with country code ─────────────────────────────────────────────

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const CODES = ["+91", "+1", "+44", "+61", "+971", "+65"];
  const [code, setCode] = useState("+91");
  const [num, setNum] = useState("");

  // Init from stored value
  useEffect(() => {
    if (!value) return;
    const matched = CODES.find(c => value.startsWith(c));
    if (matched) {
      setCode(matched);
      setNum(value.slice(matched.length).trim());
    } else {
      setNum(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (newCode: string, newNum: string) => {
    onChange(newNum ? `${newCode} ${newNum}` : "");
  };

  return (
    <div className="flex gap-2">
      <select
        value={code}
        onChange={e => { setCode(e.target.value); update(e.target.value, num); }}
        className="h-12 rounded-xl border border-input bg-background px-3 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-24 flex-shrink-0"
      >
        {CODES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <Input
        type="tel"
        placeholder="98765 43210"
        value={num}
        onChange={e => { setNum(e.target.value); update(code, e.target.value); }}
        className="h-12 rounded-xl flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
      />
    </div>
  );
}

export default function DoctorProfilePage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<DoctorProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetch("/api/doctor/profile")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        if (data && typeof data === "object" && !data.error) {
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
        } else if (data?.error) {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        console.error("[doctor/profile]", err);
        // Only show toast for real errors, not "no profile yet"
        if (err.message !== "HTTP 404") {
          toast.error("Failed to load profile — " + (err.message || "please refresh"));
        }
        setIsNew(true);
      })
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
      {/* Header with avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold shadow-lg select-none flex-shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your doctor profile and credentials</p>
        </div>
      </div>

      {/* Blue portal banner */}
      <div className="mb-4 flex items-center justify-between gap-4 px-4 py-3 bg-blue-600 dark:bg-blue-700 rounded-xl text-white">
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

      {/* Verification status banner */}
      {!loading && !isNew && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <span className="text-amber-500 mt-0.5 flex-shrink-0">⏳</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Verification Pending</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Your profile is under review. Once verified, a ✓ badge will appear next to your name for patients.
              Email <a href="mailto:verify@nearcare.app" className="underline font-medium">verify@nearcare.app</a> with your medical registration number to expedite.
            </p>
          </div>
        </div>
      )}

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
                  <Label className="dark:text-gray-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />Phone
                  </Label>
                  <PhoneInput
                    value={profile.phone}
                    onChange={(v) => handleChange("phone", v)}
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

                {/* Languages — full width */}
              </div>
              <div className="space-y-1.5">
                <Label className="dark:text-gray-300">Languages Spoken</Label>
                <LanguageSelector
                  value={profile.languages}
                  onChange={(v) => handleChange("languages", v)}
                />
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
