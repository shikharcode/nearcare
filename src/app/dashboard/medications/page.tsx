'use client'

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, subDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MedicationAutocomplete } from "@/components/medications/medication-autocomplete";
import { type InteractionResult } from "@/lib/medication-interactions";
import { toast } from "sonner";
import { today, cn } from "@/lib/utils";
import { Plus, Check, X, Pill, Loader2, Scan, Pencil, Info, ClipboardList, QrCode, AlertTriangle } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  prescribedBy: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const PILL_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-200 dark:ring-blue-700" },
  { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-600 dark:text-purple-400", ring: "ring-purple-200 dark:ring-purple-700" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-700" },
  { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-600 dark:text-orange-400", ring: "ring-orange-200 dark:ring-orange-700" },
  { bg: "bg-pink-100 dark:bg-pink-900/40", text: "text-pink-600 dark:text-pink-400", ring: "ring-pink-200 dark:ring-pink-700" },
  { bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-600 dark:text-teal-400", ring: "ring-teal-200 dark:ring-teal-700" },
];

const GRADIENT_BORDERS = [
  "from-blue-500 to-indigo-500",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-teal-500 to-cyan-500",
];

type Medication = {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  prescribedBy?: string;
  isActive?: boolean;
  notes?: string;
  startDate?: string;
  endDate?: string;
};
type MedWithInteractions = Medication & { interactions?: InteractionResult | null };
type MedLog = { id: string; medicationId: string; taken: boolean; date: string };
type ScannedMed = { name: string; dosage?: string; frequency?: string; duration?: string };

const SEVERITY_STYLES: Record<"mild" | "moderate" | "severe", string> = {
  mild: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
  moderate: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  severe: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",
};

function InteractionWarningDialog({
  medId,
  interactions,
  onClose,
  onRemove,
}: {
  medId: string;
  interactions: InteractionResult;
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(medId);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            Drug Interaction Detected
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-3">
            {interactions.interactions.map((item, i) => (
              <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.med1}</span>
                  <span className="text-gray-400 text-xs">+</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.med2}</span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize ml-auto", SEVERITY_STYLES[item.severity])}>
                    {item.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{item.recommendation}</p>
              </div>
            ))}
          </div>
          {interactions.generalAdvice && (
            <p className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-950/30 rounded-xl px-4 py-3">
              {interactions.generalAdvice}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 rounded-xl"
              onClick={onClose}
            >
              Keep Medication
            </Button>
            <Button
              type="button"
              className="flex-1 h-12 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? "Removing..." : "Remove"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function dateNDaysAgo(n: number): string {
  return format(subDays(new Date(), n), "yyyy-MM-dd");
}

function NotesTooltip({ notes }: { notes: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors flex-shrink-0"
        aria-label="Show notes"
      >
        <Info className="h-4 w-4" />
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 rounded-xl bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-2.5 shadow-xl pointer-events-none whitespace-pre-wrap">
          {notes}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </span>
      )}
    </span>
  );
}

// Circular progress ring with animated stroke on mount
function CircularProgress({ pct, taken, total }: { pct: number; taken: number; total: number }) {
  const [animated, setAnimated] = useState(false);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = animated ? (pct / 100) * circumference : 0;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const motivational =
    pct === 0 ? "Let's start!" :
    pct === 100 ? "Perfect! 🎉" :
    pct >= 50 ? "Halfway there! 💪" :
    "Keep going!";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="white"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: "stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white leading-none">{pct}%</span>
          <span className="text-blue-100 text-xs mt-0.5">done</span>
        </div>
      </div>
      <p className="text-white text-xl font-bold mt-3">
        {taken} of {total} taken today
      </p>
      <p className="text-blue-100 text-sm mt-1">{motivational}</p>
    </div>
  );
}

// 7-day adherence dots for the hero card
function HeroAdherenceDots({ medLogs, last7Dates }: { medLogs: MedLog[]; last7Dates: string[] }) {
  return (
    <div className="flex items-end gap-2 mt-6">
      {last7Dates.map((date) => {
        const log = medLogs.find((l) => l.date === date);
        const dayLabel = format(new Date(date + "T00:00:00"), "EEE")[0];
        const isTaken = log?.taken;
        const isSkipped = log && !log.taken;
        return (
          <div key={date} className="flex flex-col items-center gap-1.5">
            <div
              title={log ? `${date}: ${log.taken ? "taken" : "skipped"}` : `${date}: no log`}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-all duration-300",
                isTaken
                  ? "bg-green-300 border-green-200 shadow-[0_0_8px_rgba(134,239,172,0.8)]"
                  : isSkipped
                  ? "bg-red-400 border-red-300"
                  : "bg-white/20 border-white/30"
              )}
            />
            <span className="text-blue-100/70 text-[10px] font-medium">{dayLabel}</span>
          </div>
        );
      })}
      <div className="ml-3 flex flex-col gap-1 text-[11px] text-blue-100/80 self-start pt-0.5">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-300 inline-block shadow-[0_0_6px_rgba(134,239,172,0.7)]" />Taken</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Skipped</span>
      </div>
    </div>
  );
}

// Animated check/skip state badge
function StatusBadge({ taken }: { taken: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold animate-in fade-in zoom-in-95 duration-300",
      taken
        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
        : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
    )}>
      {taken
        ? <><Check className="h-4 w-4" />Taken</>
        : <><X className="h-4 w-4" />Skipped</>
      }
    </div>
  );
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medLogs, setMedLogs] = useState<MedLog[]>([]);
  const [rangeLogs, setRangeLogs] = useState<MedLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [medName, setMedName] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannedMeds, setScannedMeds] = useState<ScannedMed[]>([]);
  const [scanOpen, setScanOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [editMedName, setEditMedName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [interactionWarning, setInteractionWarning] = useState<InteractionResult | null>(null);
  const [interactionMedId, setInteractionMedId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    reset: editReset,
    setValue: editSetValue,
    formState: { errors: editErrors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const last7Dates = Array.from({ length: 7 }, (_, i) => dateNDaysAgo(6 - i));
  const thirtyDaysAgo = dateNDaysAgo(29);

  useEffect(() => {
    const todayStr = today();
    Promise.all([
      fetch("/api/medications").then(r => r.json()),
      fetch(`/api/medications/log?date=${todayStr}`).then(r => r.json()),
      fetch(`/api/medications/log?startDate=${thirtyDaysAgo}&endDate=${todayStr}`).then(r => r.json()),
    ]).then(([meds, logs, range]) => {
      setMedications(meds);
      setMedLogs(logs);
      setRangeLogs(range);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, name: medName || data.name }),
      });
      if (!res.ok) throw new Error();
      const med: MedWithInteractions = await res.json();
      setMedications(prev => [...prev, med]);
      reset(); setMedName(""); setOpen(false);
      toast.success("Medication added!");
      if (med.interactions?.hasInteractions === true) {
        setInteractionWarning(med.interactions);
        setInteractionMedId(med.id);
      }
    } catch { toast.error("Failed to add medication."); }
    finally { setLoading(false); }
  };

  const openEditDialog = (med: Medication) => {
    setEditingMed(med);
    setEditMedName(med.name);
    editReset({
      name: med.name,
      dosage: med.dosage ?? "",
      frequency: med.frequency ?? "",
      startDate: med.startDate ?? "",
      endDate: med.endDate ?? "",
      prescribedBy: med.prescribedBy ?? "",
      notes: med.notes ?? "",
    });
    setEditOpen(true);
  };

  const onEditSubmit = async (data: FormData) => {
    if (!editingMed) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/medications/${editingMed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, name: editMedName || data.name }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setMedications(prev => prev.map(m => m.id === updated.id ? updated : m));
      setEditOpen(false);
      setEditingMed(null);
      toast.success("Medication updated!");
    } catch { toast.error("Failed to update medication."); }
    finally { setEditLoading(false); }
  };

  const logMedication = async (medicationId: string, taken: boolean) => {
    try {
      const res = await fetch("/api/medications/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicationId, taken, date: today() }),
      });
      if (!res.ok) throw new Error();
      const log = await res.json();
      setMedLogs(prev => [...prev.filter(l => l.medicationId !== medicationId), log]);
      setRangeLogs(prev => [...prev.filter(l => !(l.medicationId === medicationId && l.date === today())), log]);
      toast.success(taken ? "Marked as taken" : "Skipped");
    } catch { toast.error("Failed to update."); }
  };

  const deleteMed = async (id: string) => {
    try {
      await fetch(`/api/medications/${id}`, { method: "DELETE" });
      setMedications(prev => prev.filter(m => m.id !== id));
      toast.success("Removed.");
    } catch { toast.error("Failed to remove."); }
  };

  const handleScanPrescription = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanOpen(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ai/extract", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setScannedMeds(data.medications || []);
      if (!data.medications?.length) toast.info("No medications found in this document.");
    } catch { toast.error("Failed to scan prescription."); setScanOpen(false); }
    finally { setScanning(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const addScannedMed = async (med: ScannedMed) => {
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: med.name, dosage: med.dosage, frequency: med.frequency }),
      });
      if (!res.ok) throw new Error();
      const newMed = await res.json();
      setMedications(prev => [...prev, newMed]);
      setScannedMeds(prev => prev.filter(m => m.name !== med.name));
      toast.success(`${med.name} added!`);
    } catch { toast.error("Failed to add."); }
  };

  const addAllScannedMeds = async () => {
    for (const med of scannedMeds) await addScannedMed(med);
    setScanOpen(false);
    toast.success("All medications added!");
  };

  const activeMeds = medications.filter(m => m.isActive);
  const getTodayStatus = (medId: string) => medLogs.find(l => l.medicationId === medId);
  const takenToday = medLogs.filter(l => l.taken).length;
  const progressPct = activeMeds.length > 0 ? Math.round((takenToday / activeMeds.length) * 100) : 0;

  const getAdherencePct = (medId: string): number | null => {
    const logs = rangeLogs.filter(l => l.medicationId === medId);
    if (logs.length === 0) return null;
    return Math.round((logs.filter(l => l.taken).length / logs.length) * 100);
  };

  const get7DayLogs = (medId: string) =>
    rangeLogs.filter(l => l.medicationId === medId && last7Dates.includes(l.date));

  const allMed7DayLogs = rangeLogs.filter(l => last7Dates.includes(l.date));

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Medications</h1>
          <p className="text-base text-gray-500 dark:text-gray-400 mt-1">Track and manage your daily medications</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleScanPrescription} />
          <Button
            variant="outline"
            className="h-12 rounded-xl px-4 font-medium border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
          >
            {scanning ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Scan className="h-5 w-5 mr-2" />}
            <span className="hidden sm:inline">Scan Rx</span>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button className="h-12 rounded-xl px-4 font-medium bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all duration-200 active:scale-95" />
            }>
              <Plus className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Add Med</span>
              <span className="sm:hidden">Add</span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Medication</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <div>
                  <Label>Medication Name *</Label>
                  <MedicationAutocomplete value={medName} onChange={(v) => { setMedName(v); setValue("name", v); }} placeholder="Search e.g. Metformin, Aspirin..." />
                  {errors.name && !medName && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input id="dosage" placeholder="500mg" {...register("dosage")} className="mt-1 h-11 rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Input id="frequency" placeholder="Twice daily" {...register("frequency")} className="mt-1 h-11 rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" {...register("startDate")} className="mt-1 h-11 rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" {...register("endDate")} className="mt-1 h-11 rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="prescribedBy">Prescribed By</Label>
                  <Input id="prescribedBy" placeholder="Dr. Smith" {...register("prescribedBy")} className="mt-1 h-11 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Take with food..." {...register("notes")} className="mt-1 rounded-xl" rows={2} />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={loading}>
                  {loading ? "Adding..." : "Add Medication"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit medication dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditingMed(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Medication</DialogTitle></DialogHeader>
          <form onSubmit={editHandleSubmit(onEditSubmit)} className="space-y-4 mt-2">
            <div>
              <Label>Medication Name *</Label>
              <MedicationAutocomplete value={editMedName} onChange={(v) => { setEditMedName(v); editSetValue("name", v); }} placeholder="Search e.g. Metformin, Aspirin..." />
              {editErrors.name && !editMedName && <p className="text-red-500 text-xs mt-1">{editErrors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-dosage">Dosage</Label>
                <Input id="edit-dosage" placeholder="500mg" {...editRegister("dosage")} className="mt-1 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="edit-frequency">Frequency</Label>
                <Input id="edit-frequency" placeholder="Twice daily" {...editRegister("frequency")} className="mt-1 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input id="edit-startDate" type="date" {...editRegister("startDate")} className="mt-1 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input id="edit-endDate" type="date" {...editRegister("endDate")} className="mt-1 h-11 rounded-xl" />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-prescribedBy">Prescribed By</Label>
              <Input id="edit-prescribedBy" placeholder="Dr. Smith" {...editRegister("prescribedBy")} className="mt-1 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" placeholder="Take with food..." {...editRegister("notes")} className="mt-1 rounded-xl" rows={2} />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => { setEditOpen(false); setEditingMed(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-12 rounded-xl font-semibold" disabled={editLoading}>
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Scan result dialog */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Medications Found in Prescription</DialogTitle></DialogHeader>
          {scanning ? (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Analyzing prescription with AI...</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">This usually takes a few seconds</p>
            </div>
          ) : scannedMeds.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Scan className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-base font-medium">No medications detected</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center">Try a clearer image or a different file format.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {scannedMeds.map((med, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden relative"
                >
                  {/* Gradient left border accent */}
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b", GRADIENT_BORDERS[i % GRADIENT_BORDERS.length])} />
                  <div className="pl-2 flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{med.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {[med.dosage, med.frequency, med.duration].filter(Boolean).join(" · ") || "No details"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-10 rounded-xl px-4 font-medium flex-shrink-0"
                    onClick={() => addScannedMed(med)}
                  >
                    <Plus className="h-4 w-4 mr-1" />Add
                  </Button>
                </div>
              ))}
              {scannedMeds.length > 1 && (
                <Button className="w-full h-12 rounded-xl font-semibold mt-2" onClick={addAllScannedMeds}>
                  Add All {scannedMeds.length} Medications
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Hero Card */}
      {activeMeds.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 shadow-xl shadow-blue-200/50 dark:shadow-blue-900/40 overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative flex flex-col items-center text-center">
            <p className="text-blue-100 text-sm font-semibold uppercase tracking-widest mb-4">Today&apos;s Progress</p>
            <CircularProgress pct={progressPct} taken={takenToday} total={activeMeds.length} />
            <HeroAdherenceDots medLogs={allMed7DayLogs} last7Dates={last7Dates} />
          </div>
        </div>
      )}

      {/* Today's Check-in */}
      {activeMeds.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Today&apos;s Check-in</h2>
          <div className="space-y-3">
            {activeMeds.map((med, idx) => {
              const status = getTodayStatus(med.id);
              const color = PILL_COLORS[idx % PILL_COLORS.length];
              const adherencePct = getAdherencePct(med.id);
              return (
                <div
                  key={med.id}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-900 border shadow-md transition-all duration-200",
                    status?.taken
                      ? "border-green-100 dark:border-green-900/50"
                      : status
                      ? "border-red-100 dark:border-red-900/50"
                      : "border-gray-100 dark:border-gray-800 hover:shadow-lg"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ring-2",
                    color.bg, color.ring
                  )}>
                    <Pill className={cn("h-7 w-7", color.text)} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{med.name}</p>
                      {adherencePct !== null && (
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                          adherencePct >= 80
                            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                            : adherencePct >= 50
                            ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                        )}>
                          {adherencePct}% adherence
                        </span>
                      )}
                      {med.notes && <NotesTooltip notes={med.notes} />}
                    </div>
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-0.5">
                      {[med.dosage, med.frequency].filter(Boolean).join(" · ") || "No dosage info"}
                    </p>
                    {med.notes && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 flex-shrink-0" />{med.notes}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {status ? (
                      <StatusBadge taken={status.taken} />
                    ) : (
                      <>
                        <button
                          onClick={() => logMedication(med.id, true)}
                          className="w-[52px] h-[52px] rounded-full bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center shadow-lg shadow-green-100 dark:shadow-green-900/20 transition-all duration-200 active:scale-90 hover:-translate-y-0.5"
                          aria-label="Mark as taken"
                        >
                          <Check className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => logMedication(med.id, false)}
                          className="w-[52px] h-[52px] rounded-full bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 flex items-center justify-center shadow-lg shadow-red-100 dark:shadow-red-900/20 transition-all duration-200 active:scale-90 hover:-translate-y-0.5"
                          aria-label="Skip medication"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Medications */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          All Medications
          <span className="ml-2 text-base font-medium text-gray-400 dark:text-gray-500">({medications.length})</span>
        </h2>

        {medications.length === 0 ? (
          /* Empty state */
          <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-none bg-transparent">
            <CardContent className="flex flex-col items-center py-20">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900/50 flex items-center justify-center shadow-xl shadow-blue-100 dark:shadow-blue-900/30 animate-bounce" style={{ animationDuration: "2s" }}>
                  <Pill className="h-12 w-12 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-9 h-9 rounded-2xl bg-green-100 dark:bg-green-900/60 flex items-center justify-center border-2 border-white dark:border-gray-950 shadow-md">
                  <ClipboardList className="h-4.5 w-4.5 text-green-600 dark:text-green-400" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center border-2 border-white dark:border-gray-950 shadow-md">
                  <QrCode className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">No medications yet</h3>
              <p className="text-base text-gray-400 dark:text-gray-500 mt-2 mb-8 text-center max-w-sm leading-relaxed">
                Add your medications to get daily check-in reminders and track your adherence over time.
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                  className="w-full h-14 rounded-2xl text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all duration-200 active:scale-95"
                  onClick={() => setOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />Add Manually
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl text-base font-medium border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 active:scale-95"
                  onClick={() => fileRef.current?.click()}
                >
                  <Scan className="h-5 w-5 mr-2" />Scan Prescription
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((med, idx) => {
              const color = PILL_COLORS[idx % PILL_COLORS.length];
              const gradientBorder = GRADIENT_BORDERS[idx % GRADIENT_BORDERS.length];
              const adherencePct = getAdherencePct(med.id);
              const medRangeLogs = get7DayLogs(med.id);
              return (
                <div
                  key={med.id}
                  className="group relative flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                >
                  {/* Top gradient line accent */}
                  <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity", gradientBorder)} />

                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5",
                    color.bg
                  )}>
                    <Pill className={cn("h-6 w-6", color.text)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{med.name}</p>
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0",
                        med.isActive
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      )}>
                        {med.isActive ? "Active" : "Inactive"}
                      </span>
                      {adherencePct !== null && (
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                          adherencePct >= 80
                            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                            : adherencePct >= 50
                            ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                        )}>
                          {adherencePct}%
                        </span>
                      )}
                      {med.notes && <NotesTooltip notes={med.notes} />}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {[med.dosage, med.frequency, med.prescribedBy && `Dr. ${med.prescribedBy}`].filter(Boolean).join(" · ") || "No details"}
                    </p>
                    {med.notes && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                        <Info className="h-3 w-3 flex-shrink-0" />{med.notes}
                      </p>
                    )}
                    {medRangeLogs.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2.5">
                        {last7Dates.map((date) => {
                          const log = medRangeLogs.find(l => l.date === date);
                          return (
                            <div
                              key={date}
                              title={log ? `${date}: ${log.taken ? "taken" : "skipped"}` : `${date}: no log`}
                              className={cn(
                                "w-3 h-3 rounded-full transition-all duration-200",
                                !log
                                  ? "bg-gray-200 dark:bg-gray-700"
                                  : log.taken
                                  ? "bg-green-400 dark:bg-green-500 shadow-[0_0_6px_rgba(74,222,128,0.5)]"
                                  : "bg-red-400 dark:bg-red-500"
                              )}
                            />
                          );
                        })}
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">7d</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={() => openEditDialog(med)}
                      className="w-9 h-9 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-400 dark:text-blue-500 flex items-center justify-center transition-all duration-150 active:scale-90"
                      aria-label="Edit medication"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteMed(med.id)}
                      className="w-9 h-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-400 dark:text-red-500 flex items-center justify-center transition-all duration-150 active:scale-90"
                      aria-label="Remove medication"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interaction warning dialog */}
      {interactionWarning && interactionMedId && (
        <InteractionWarningDialog
          medId={interactionMedId}
          interactions={interactionWarning}
          onClose={() => { setInteractionWarning(null); setInteractionMedId(null); }}
          onRemove={async (id) => { await deleteMed(id); }}
        />
      )}
    </div>
  );
}
