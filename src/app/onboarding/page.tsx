'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { Heart, ChevronRight, SkipForward, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();

  // Redirect already-onboarded users straight to dashboard
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.name) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  const [step, setStep] = useState(1);

  // Step 1: profile
  const [name, setName] = useState(user?.fullName || "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Step 2: medication
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medFrequency, setMedFrequency] = useState("");
  const [savingMed, setSavingMed] = useState(false);

  // Step 3: invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dateOfBirth, bloodType }),
      });
      if (!res.ok) throw new Error();
      setStep(2);
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveMedication = async () => {
    if (!medName.trim()) {
      setStep(3);
      return;
    }
    setSavingMed(true);
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: medName,
          dosage: medDosage,
          frequency: medFrequency || "daily",
          times: ["08:00"],
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Medication added.");
      setStep(3);
    } catch {
      toast.error("Failed to add medication.");
    } finally {
      setSavingMed(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      router.push("/dashboard");
      return;
    }
    setSendingInvite(true);
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (!res.ok) throw new Error();
      toast.success("Invite sent!");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to send invite.");
      router.push("/dashboard");
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500 fill-red-500" />
          <span className="font-bold text-gray-900 dark:text-white">NearCare</span>
        </div>
        <UserButton />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const s = i + 1;
              const isDone = s < step;
              const isCurrent = s === step;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                      isDone
                        ? "bg-blue-600 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
                    )}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : s}
                  </div>
                  {s < TOTAL_STEPS && (
                    <div
                      className={cn(
                        "h-0.5 w-8 rounded-full transition-colors",
                        s < step ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-800"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mb-8">
            Step {step} of {TOTAL_STEPS}
          </p>

          {/* Step 1: Profile */}
          {step === 1 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Set up your profile
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Tell us a little about yourself so we can personalize your experience.
              </p>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="ob-name" className="text-sm text-gray-700 dark:text-gray-300">
                    Full Name
                  </Label>
                  <Input
                    id="ob-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ob-dob" className="text-sm text-gray-700 dark:text-gray-300">
                    Date of Birth
                  </Label>
                  <Input
                    id="ob-dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-10 text-sm"
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
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile || !name.trim()}
                className="w-full h-11 mt-8 font-semibold text-base"
              >
                {savingProfile ? "Saving..." : (
                  <span className="flex items-center gap-2">
                    Next <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Medication */}
          {step === 2 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
              <div className="flex items-start justify-between mb-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Add your first medication
                </h1>
                <span className="text-xs text-gray-400 dark:text-gray-600 mt-1 ml-2 shrink-0">Optional</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Add a medication you take regularly. You can add more later.
              </p>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="ob-med-name" className="text-sm text-gray-700 dark:text-gray-300">
                    Medication Name
                  </Label>
                  <Input
                    id="ob-med-name"
                    type="text"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="e.g. Metformin"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ob-med-dosage" className="text-sm text-gray-700 dark:text-gray-300">
                    Dosage
                  </Label>
                  <Input
                    id="ob-med-dosage"
                    type="text"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    placeholder="e.g. 500mg"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ob-med-freq" className="text-sm text-gray-700 dark:text-gray-300">
                    Frequency
                  </Label>
                  <Input
                    id="ob-med-freq"
                    type="text"
                    value={medFrequency}
                    onChange={(e) => setMedFrequency(e.target.value)}
                    placeholder="e.g. twice daily"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1 h-11 font-medium"
                >
                  <SkipForward className="h-4 w-4 mr-1.5" />
                  Skip
                </Button>
                <Button
                  onClick={handleSaveMedication}
                  disabled={savingMed}
                  className="flex-1 h-11 font-semibold"
                >
                  {savingMed ? "Saving..." : (
                    <span className="flex items-center gap-2">
                      Next <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Invite */}
          {step === 3 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
              <div className="flex items-start justify-between mb-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Invite a family member
                </h1>
                <span className="text-xs text-gray-400 dark:text-gray-600 mt-1 ml-2 shrink-0">Optional</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Add a caregiver or family member who can receive health alerts on your behalf.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="ob-invite" className="text-sm text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <Input
                  id="ob-invite"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. family@example.com"
                  className="h-10 text-sm"
                />
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 h-11 font-medium"
                >
                  <SkipForward className="h-4 w-4 mr-1.5" />
                  Skip
                </Button>
                <Button
                  onClick={handleSendInvite}
                  disabled={sendingInvite}
                  className="flex-1 h-11 font-semibold"
                >
                  {sendingInvite ? "Sending..." : (
                    <span className="flex items-center gap-2">
                      Finish <Check className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
