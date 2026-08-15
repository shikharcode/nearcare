'use client'

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CloudUpload,
  FileText,
  FlaskConical,
  ScanLine,
  FolderOpen,
  Loader2,
  Search,
  Trash2,
  X,
  ExternalLink,
  Stethoscope,
  CalendarDays,
  Pill,
  ClipboardList,
  Activity,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type DocType = "all" | "prescription" | "lab_report" | "scan" | "other";

interface ExtractedData {
  summary?: string;
  doctorName?: string;
  date?: string;
  diagnosis?: string;
  medications?: { name: string; dosage?: string; frequency?: string }[];
  labResults?: { test: string; value: string; unit?: string; status?: string }[];
  instructions?: string;
}

interface Doc {
  id: string;
  name: string;
  type: string;
  extractedData?: string | ExtractedData | null;
  doctorName?: string | null;
  date?: string | null;
  signedUrl?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  prescription: "Prescription",
  lab_report: "Lab Report",
  scan: "Scan",
  other: "Other",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  prescription: <Pill className="h-7 w-7" />,
  lab_report: <FlaskConical className="h-7 w-7" />,
  scan: <ScanLine className="h-7 w-7" />,
  other: <FolderOpen className="h-7 w-7" />,
};

const TAB_ICONS: Record<string, React.ReactNode> = {
  all: <FileText className="h-4 w-4" />,
  prescription: <Pill className="h-4 w-4" />,
  lab_report: <FlaskConical className="h-4 w-4" />,
  scan: <ScanLine className="h-4 w-4" />,
  other: <FolderOpen className="h-4 w-4" />,
};

const TYPE_ICON_BG: Record<string, string> = {
  prescription: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  lab_report: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  scan: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
  other: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
};

const TYPE_BADGE_CLASSES: Record<string, string> = {
  prescription: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  lab_report: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  scan: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  other: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
};

const TAB_ACTIVE_CLASSES: Record<string, string> = {
  all: "bg-gray-900 text-white dark:bg-white dark:text-gray-900",
  prescription: "bg-blue-600 text-white",
  lab_report: "bg-emerald-600 text-white",
  scan: "bg-purple-600 text-white",
  other: "bg-orange-500 text-white",
};

const TAB_INACTIVE_CLASSES =
  "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700";

function parseExtracted(raw: string | ExtractedData | null | undefined): ExtractedData | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
}

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl mb-3", color)}>
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

function ViewDetailsDialog({ doc, extracted }: { doc: Doc; extracted: ExtractedData | null }) {
  const typeKey = doc.type in TYPE_ICON_BG ? doc.type : "other";

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40" />}>
        View Details
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 pr-8">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", TYPE_ICON_BG[typeKey])}>
              {TYPE_ICONS[typeKey]}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {doc.name}
              </DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={cn("text-xs font-medium", TYPE_BADGE_CLASSES[typeKey])}>
                  {TYPE_LABELS[doc.type] ?? doc.type}
                </Badge>
                {(extracted?.doctorName ?? doc.doctorName) && (
                  <Badge variant="outline" className="text-xs font-medium gap-1">
                    <Stethoscope className="h-3 w-3" />
                    Dr. {extracted?.doctorName ?? doc.doctorName}
                  </Badge>
                )}
                {(extracted?.date ?? doc.date) && (
                  <Badge variant="outline" className="text-xs font-medium gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(extracted?.date ?? doc.date ?? "")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {extracted ? (
          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            {/* Left column */}
            <div className="space-y-4">
              {extracted.summary && (
                <div>
                  <SectionHeader
                    icon={<ClipboardList className="h-4 w-4" />}
                    label="Summary"
                    color="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed px-1">
                    {extracted.summary}
                  </p>
                </div>
              )}

              {extracted.diagnosis && (
                <div>
                  <SectionHeader
                    icon={<Activity className="h-4 w-4" />}
                    label="Diagnosis"
                    color="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed px-1">
                    {extracted.diagnosis}
                  </p>
                </div>
              )}

              {extracted.instructions && (
                <div>
                  <SectionHeader
                    icon={<FileText className="h-4 w-4" />}
                    label="Instructions"
                    color="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed px-1">
                    {extracted.instructions}
                  </p>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {extracted.medications && extracted.medications.length > 0 && (
                <div>
                  <SectionHeader
                    icon={<Pill className="h-4 w-4" />}
                    label="Medications"
                    color="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                  />
                  <div className="space-y-2">
                    {extracted.medications.map((m, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-700"
                      >
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{m.name}</p>
                        {(m.dosage || m.frequency) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {[m.dosage, m.frequency].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {extracted.labResults && extracted.labResults.length > 0 && (
                <div>
                  <SectionHeader
                    icon={<FlaskConical className="h-4 w-4" />}
                    label="Lab Results"
                    color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  />
                  <div className="space-y-2">
                    {extracted.labResults.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-700"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{r.test}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {r.value}{r.unit ? ` ${r.unit}` : ""}
                          </span>
                          {r.status && (
                            <Badge
                              className={cn(
                                "text-xs font-medium",
                                r.status === "normal"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                              )}
                            >
                              {r.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="h-10 w-10 text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No extracted data available for this document.</p>
          </div>
        )}

        {doc.signedUrl && (
          <DialogFooter className="mt-2">
            <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                <ExternalLink className="h-4 w-4" />
                View Original Document
              </Button>
            </a>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DocType>("all");
  const [search, setSearch] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/documents").then(r => r.json()).then(setDocuments);
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name.replace(/\.[^/.]+$/, ""));

      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const doc = await res.json();
      setDocuments(prev => [doc, ...prev]);
      toast.success("Document uploaded and analyzed!");
    } catch {
      toast.error("Upload failed. Check your R2 configuration.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success("Document deleted.");
    } catch {
      toast.error("Failed to delete document.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = documents;
    if (activeTab !== "all") {
      list = list.filter(d => d.type === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q));
    }
    return list;
  }, [documents, activeTab, search]);

  const tabCounts: Record<DocType, number> = useMemo(() => {
    const counts = { all: documents.length, prescription: 0, lab_report: 0, scan: 0, other: 0 };
    for (const d of documents) {
      const t = d.type as DocType;
      if (t in counts) counts[t]++;
      else counts.other++;
    }
    return counts;
  }, [documents]);

  const estimatedStorage = useMemo(() => {
    const avg = 0.8; // MB per doc estimate
    const total = documents.length * avg;
    return total < 1 ? `${Math.round(total * 1024)} KB` : `${total.toFixed(1)} MB`;
  }, [documents]);

  const tabs: { value: DocType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "prescription", label: "Prescription" },
    { value: "lab_report", label: "Lab Report" },
    { value: "scan", label: "Scan" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Documents</h1>
          <p className="text-gray-500 dark:text-gray-400 text-base mt-1">
            {documents.length > 0
              ? `${documents.length} document${documents.length !== 1 ? "s" : ""} · ~${estimatedStorage} stored`
              : "Prescriptions, lab reports, and scans"}
          </p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-12 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95 gap-2 whitespace-nowrap"
          >
            {uploading
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : <CloudUpload className="h-5 w-5" />}
            {uploading ? "Analyzing..." : "Upload"}
          </Button>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-5 sm:p-8 text-center mb-6 cursor-pointer transition-all duration-200",
          isDragOver
            ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40 scale-[1.01]"
            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
        )}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className={cn(
          "w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors",
          isDragOver ? "bg-blue-100 dark:bg-blue-900/40" : "bg-gray-100 dark:bg-gray-800"
        )}>
          <CloudUpload className={cn("h-6 w-6 sm:h-8 sm:w-8 transition-colors", isDragOver ? "text-blue-500" : "text-gray-400 dark:text-gray-500")} />
        </div>
        <p className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Drop files here or tap to upload
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          PDF, JPG, PNG · AI extracts key info
        </p>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 min-h-[44px]",
                activeTab === tab.value
                  ? TAB_ACTIVE_CLASSES[tab.value]
                  : TAB_INACTIVE_CLASSES
              )}
            >
              {TAB_ICONS[tab.value]}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.value === "all" ? "All" : tab.label.split(" ")[0]}</span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                activeTab === tab.value
                  ? "bg-white/20 text-white"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              )}>
                {tabCounts[tab.value]}
              </span>
            </button>
          ))}
        </div>

        {documents.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl text-base border-gray-200 dark:border-gray-700"
            />
          </div>
        )}
      </div>

      {/* Empty state — no documents at all */}
      {documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-blue-50 dark:bg-blue-950/40 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-blue-400 dark:text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            No documents yet
          </h3>
          <p className="text-base text-gray-400 dark:text-gray-500 mb-8 max-w-xs">
            Upload prescriptions, lab reports, and scans — AI will extract the key info automatically.
          </p>
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold text-base shadow-xl shadow-blue-500/25 transition-all duration-200 active:scale-95 gap-2"
          >
            <CloudUpload className="h-5 w-5" />
            Upload Your First Document
          </Button>
        </div>
      )}

      {/* Empty state — no results for filter/search */}
      {documents.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-base font-semibold text-gray-600 dark:text-gray-300 mb-1">No documents found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filter.</p>
        </div>
      )}

      {/* Document grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const extracted = parseExtracted(doc.extractedData);
            const isDeleting = deletingId === doc.id;
            const typeKey = doc.type in TYPE_ICON_BG ? doc.type : "other";

            return (
              <Card
                key={doc.id}
                className="group relative border-gray-100 dark:border-gray-800 shadow-md hover:shadow-xl rounded-2xl transition-all duration-200 hover:scale-[1.02] cursor-pointer overflow-hidden bg-white dark:bg-gray-900"
              >
                {/* Delete button — always visible on mobile, hover on desktop */}
                <button
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100 opacity-100"
                  onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}
                  disabled={isDeleting}
                  aria-label="Delete document"
                >
                  {isDeleting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />
                  }
                </button>

                <CardContent className="p-4 flex flex-col gap-3 h-full">
                  {/* Icon + name row */}
                  <div className="flex items-start gap-3 pr-8">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", TYPE_ICON_BG[typeKey])}>
                      {TYPE_ICONS[typeKey]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                        {doc.name}
                      </p>
                      {doc.date && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 block">
                          {formatDate(doc.date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {extracted?.summary && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug">
                      {extracted.summary}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-gray-50 dark:border-gray-800">
                    <Badge className={cn("text-xs font-medium px-2 py-0.5", TYPE_BADGE_CLASSES[typeKey])}>
                      {TYPE_LABELS[doc.type] ?? doc.type}
                    </Badge>
                    <ViewDetailsDialog doc={doc} extracted={extracted} />
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
