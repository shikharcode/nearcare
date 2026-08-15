"use client";

import React, { useState, useRef, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Link as LinkIcon,
  Footprints,
  Heart,
  Moon,
  Weight,
  Activity,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface AppleHealthRecord {
  type: string;
  date: string;
  value: number;
  unit?: string;
}

interface PreviewInfo {
  count: number;
  from: string;
  to: string;
}

interface CSVRow {
  date: string;
  [key: string]: string;
}

// ── CSV template columns (matches API expectation) ───────────────────────────

const CSV_COLUMNS = [
  "date", "mood", "sleep", "water", "exercise", "steps", "weight",
  "heartRate", "systolic", "diastolic", "bloodSugar", "temperature",
  "oxygenSaturation", "calories", "symptoms", "notes",
];

const CSV_EXAMPLE_ROW = [
  "2026-08-15", "4", "7.5", "2.0", "30", "8000", "70.5",
  "72", "120", "80", "95", "36.6", "98", "2000", "headache", "Felt good",
];

// ── Apple Health XML parsing ─────────────────────────────────────────────────

const SUPPORTED_HK_TYPES = new Set([
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierHeartRate",
  "HKQuantityTypeIdentifierBodyMass",
  "HKQuantityTypeIdentifierBloodPressureSystolic",
  "HKQuantityTypeIdentifierBloodPressureDiastolic",
  "HKQuantityTypeIdentifierBloodGlucose",
  "HKQuantityTypeIdentifierOxygenSaturation",
  "HKCategoryTypeIdentifierSleepAnalysis",
]);

function parseAppleHealthXML(xmlText: string): AppleHealthRecord[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const recordEls = doc.querySelectorAll("Record");
  const records: AppleHealthRecord[] = [];

  recordEls.forEach(el => {
    const type = el.getAttribute("type") ?? "";
    if (!SUPPORTED_HK_TYPES.has(type)) return;

    const rawDate = el.getAttribute("startDate") ?? el.getAttribute("creationDate") ?? "";
    const rawValue = el.getAttribute("value") ?? "";
    const unit = el.getAttribute("unit") ?? undefined;

    if (!rawDate || rawValue === "") return;

    const value = type === "HKCategoryTypeIdentifierSleepAnalysis"
      ? parseSleepDuration(el)
      : parseFloat(rawValue);

    if (isNaN(value)) return;

    records.push({ type, date: rawDate, value, unit });
  });

  return records;
}

function parseSleepDuration(el: Element): number {
  const start = el.getAttribute("startDate");
  const end = el.getAttribute("endDate");
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return parseFloat((ms / 3_600_000).toFixed(4)); // hours
}

function appleHealthPreview(records: AppleHealthRecord[]): PreviewInfo {
  const dates = records
    .map(r => r.date.slice(0, 10))
    .filter(Boolean)
    .sort();
  const unique = new Set(dates);
  return {
    count: records.length,
    from: dates[0] ?? "",
    to: dates[dates.length - 1] ?? "",
  };
}

// ── Google Fit CSV parsing ───────────────────────────────────────────────────

function parseGoogleFitCSV(text: string): { rows: CSVRow[]; preview: PreviewInfo } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
  if (lines.length < 2) return { rows: [], preview: { count: 0, from: "", to: "" } };

  const header = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",");
    const row: CSVRow = { date: "" };
    header.forEach((h, idx) => {
      row[h] = cells[idx]?.replace(/^"|"$/g, "").trim() ?? "";
    });

    // Google Fit exports use various date column names
    const dateRaw = row["date"] || row["start time"] || row["day"] || "";
    const dateMatch = dateRaw.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;
    row["date"] = dateMatch[1];
    if (row["date"]) rows.push(row);
  }

  const dates = rows.map(r => r["date"]).sort();
  return {
    rows,
    preview: { count: rows.length, from: dates[0] ?? "", to: dates[dates.length - 1] ?? "" },
  };
}

function googleFitRowsToCSV(rows: CSVRow[]): string {
  // Map Google Fit field names to our CSV columns
  const fieldMap: Record<string, string> = {
    "steps": "steps",
    "move minutes count": "exercise",
    "heart rate (bpm)": "heartRate",
    "average heart rate (bpm)": "heartRate",
    "weight (kg)": "weight",
    "calories (kcal)": "calories",
    "sleep": "sleep",
  };

  const mapped = rows.map(row => {
    const out: Record<string, string> = { date: row["date"] };
    for (const [fitKey, ourKey] of Object.entries(fieldMap)) {
      if (row[fitKey] !== undefined && row[fitKey] !== "") {
        out[ourKey] = row[fitKey];
      }
    }
    // Also pass through keys that already match our column names
    CSV_COLUMNS.forEach(col => {
      if (row[col] !== undefined && row[col] !== "" && !out[col]) {
        out[col] = row[col];
      }
    });
    return out;
  });

  const header = CSV_COLUMNS.join(",");
  const dataLines = mapped.map(r => CSV_COLUMNS.map(c => r[c] ?? "").join(","));
  return [header, ...dataLines].join("\n");
}

// ── Manual CSV preview ───────────────────────────────────────────────────────

function parseManualCSV(text: string): { rows: CSVRow[]; preview: PreviewInfo } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
  if (lines.length < 2) return { rows: [], preview: { count: 0, from: "", to: "" } };

  const header = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",");
    const row: CSVRow = { date: "" };
    header.forEach((h, idx) => {
      row[h] = cells[idx]?.replace(/^"|"$/g, "").trim() ?? "";
    });
    if (row["date"]) rows.push(row);
  }

  const dates = rows.map(r => r["date"]).sort();
  return {
    rows,
    preview: { count: rows.length, from: dates[0] ?? "", to: dates[dates.length - 1] ?? "" },
  };
}

// ── Shared helpers ───────────────────────────────────────────────────────────

function generateCSVTemplate(): string {
  const header = CSV_COLUMNS.join(",");
  const example = CSV_EXAMPLE_ROW.join(",");
  return `${header}\n${example}\n`;
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function DropZone({
  onFile,
  accept,
  label,
  disabled,
}: {
  onFile: (file: File) => void;
  accept: string;
  label: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <Upload className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">or drag and drop here</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
        disabled={disabled}
      />
    </div>
  );
}

function ResultBanner({ result }: { result: ImportResult }) {
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <CheckCircle className="size-4" />
          <span className="text-sm font-medium">{result.imported} records imported</span>
        </div>
        {result.skipped > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertCircle className="size-4" />
            <span className="text-sm">{result.skipped} skipped</span>
          </div>
        )}
      </div>
      {result.errors.length > 0 && (
        <div className="rounded-lg bg-destructive/10 p-3 space-y-1">
          <p className="text-xs font-medium text-destructive">Errors ({result.errors.length})</p>
          {result.errors.slice(0, 5).map((e, i) => (
            <p key={i} className="text-xs text-destructive/80">{e}</p>
          ))}
          {result.errors.length > 5 && (
            <p className="text-xs text-muted-foreground">…and {result.errors.length - 5} more</p>
          )}
        </div>
      )}
    </div>
  );
}

function PreviewBadge({ preview, fileName }: { preview: PreviewInfo; fileName: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
      <FileText className="size-5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        <p className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{preview.count}</span> records
          {preview.from && preview.to && (
            <> from <span className="font-semibold text-foreground">{preview.from}</span> to <span className="font-semibold text-foreground">{preview.to}</span></>
          )}
        </p>
      </div>
    </div>
  );
}

// ── Tab: Apple Health ────────────────────────────────────────────────────────

function AppleHealthTab() {
  const [records, setRecords] = useState<AppleHealthRecord[] | null>(null);
  const [preview, setPreview] = useState<PreviewInfo | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setResult(null);
    setFileName(file.name);

    try {
      let xmlText: string;

      if (file.name.endsWith(".zip")) {
        // Dynamically load JSZip for zip extraction
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(file);
        const xmlEntry =
          zip.file("apple_health_export/export.xml") ??
          zip.file("export.xml") ??
          zip.file(/export\.xml$/i)[0];
        if (!xmlEntry) {
          toast.error("Could not find export.xml inside the zip file");
          return;
        }
        xmlText = await xmlEntry.async("string");
      } else {
        xmlText = await file.text();
      }

      const parsed = parseAppleHealthXML(xmlText);
      if (parsed.length === 0) {
        toast.error("No supported health records found in this file");
        return;
      }
      setRecords(parsed);
      setPreview(appleHealthPreview(parsed));
    } catch (err) {
      toast.error("Failed to parse file: " + (err instanceof Error ? err.message : String(err)));
    }
  }, []);

  const handleImport = async () => {
    if (!records) return;
    setLoading(true);
    try {
      const res = await fetch("/api/import/apple-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      const data: ImportResult = await res.json();
      setResult(data);
      if (data.imported > 0) toast.success(`Imported ${data.imported} days from Apple Health`);
      else toast.info("No new records were imported");
    } catch {
      toast.error("Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2">
        <p className="text-sm font-semibold">How to export from Apple Health</p>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Open the Health app on your iPhone</li>
          <li>Tap your profile picture (top right)</li>
          <li>Scroll down and tap <strong>Export All Health Data</strong></li>
          <li>Tap <strong>Export</strong> and share the zip file here</li>
        </ol>
      </div>

      <DropZone
        onFile={handleFile}
        accept=".zip,.xml"
        label="Upload export zip or export.xml"
        disabled={loading}
      />

      {preview && fileName && (
        <PreviewBadge preview={preview} fileName={fileName} />
      )}

      {records && preview && !result && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {["Steps", "Heart Rate", "Sleep", "Weight", "Blood Pressure"].map(label => (
              <Badge key={label} variant="secondary">{label}</Badge>
            ))}
          </div>
          <Button onClick={handleImport} disabled={loading} className="w-full sm:w-auto">
            {loading && <RefreshCw className="size-4 mr-2 animate-spin" />}
            Import {preview.count} records
          </Button>
        </div>
      )}

      {result && <ResultBanner result={result} />}
    </div>
  );
}

// ── Tab: Google Fit ──────────────────────────────────────────────────────────

function GoogleFitTab() {
  const [csvContent, setCSVContent] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewInfo | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setResult(null);
    setFileName(file.name);

    try {
      let csvText: string;

      if (file.name.endsWith(".zip")) {
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(file);
        // Find first CSV in Fit data folder
        const csvEntry =
          zip.file(/Daily activity metrics.*\.csv$/i)[0] ??
          zip.file(/\.csv$/i)[0];
        if (!csvEntry) {
          toast.error("Could not find a CSV file inside the zip");
          return;
        }
        csvText = await csvEntry.async("string");
      } else {
        csvText = await file.text();
      }

      const { rows, preview: pv } = parseGoogleFitCSV(csvText);
      if (rows.length === 0) {
        toast.error("No data rows found in the CSV");
        return;
      }
      setCSVContent(googleFitRowsToCSV(rows));
      setPreview(pv);
    } catch (err) {
      toast.error("Failed to parse file: " + (err instanceof Error ? err.message : String(err)));
    }
  }, []);

  const handleImport = async () => {
    if (!csvContent) return;
    setLoading(true);
    try {
      const blob = new Blob([csvContent], { type: "text/csv" });
      const form = new FormData();
      form.append("file", blob, "google-fit.csv");

      const res = await fetch("/api/import/csv", { method: "POST", body: form });
      const data: ImportResult = await res.json();
      setResult(data);
      if (data.imported > 0) toast.success(`Imported ${data.imported} days from Google Fit`);
      else toast.info("No new records were imported");
    } catch {
      toast.error("Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-green-50 dark:bg-green-950/30 p-4 space-y-2">
        <p className="text-sm font-semibold">How to export from Google Fit</p>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Go to <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="underline text-foreground">takeout.google.com</a></li>
          <li>Deselect all, then select <strong>Fit</strong></li>
          <li>Choose CSV format and download</li>
          <li>Upload the downloaded zip or any CSV file here</li>
        </ol>
      </div>

      <DropZone
        onFile={handleFile}
        accept=".csv,.zip"
        label="Upload Google Fit CSV or takeout zip"
        disabled={loading}
      />

      {preview && fileName && (
        <PreviewBadge preview={preview} fileName={fileName} />
      )}

      {preview && csvContent && !result && (
        <Button onClick={handleImport} disabled={loading} className="w-full sm:w-auto">
          {loading && <RefreshCw className="size-4 mr-2 animate-spin" />}
          Import {preview.count} days
        </Button>
      )}

      {result && <ResultBanner result={result} />}
    </div>
  );
}

// ── Tab: Fitbit ──────────────────────────────────────────────────────────────

function FitbitTab() {
  const [syncing, setSyncing] = useState(false);

  const handleConnect = () => {
    window.location.href = "/api/import/fitbit/connect";
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/import/fitbit/sync", { method: "POST" });
      const data: ImportResult = await res.json();
      if (data.imported > 0) toast.success(`Synced ${data.imported} days from Fitbit`);
      else toast.info("No new Fitbit records to sync");
    } catch {
      toast.error("Fitbit sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const dataPoints = [
    { icon: Footprints, label: "Steps" },
    { icon: Heart, label: "Heart Rate" },
    { icon: Moon, label: "Sleep" },
    { icon: Activity, label: "Active Minutes" },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-orange-50 dark:bg-orange-950/30 p-4 space-y-2">
        <p className="text-sm font-semibold">Connect your Fitbit account</p>
        <p className="text-sm text-muted-foreground">
          Authorize CareBridge to read your Fitbit data. Your credentials are never stored — only health metrics are imported.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {dataPoints.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center">
            <Icon className="size-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleConnect} variant="outline" className="gap-2">
          <LinkIcon className="size-4" />
          Connect Fitbit
        </Button>
        <Button onClick={handleSync} disabled={syncing} className="gap-2">
          {syncing ? <RefreshCw className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Sync Now
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Note: Fitbit OAuth requires the app to be registered at{" "}
        <a href="https://dev.fitbit.com" target="_blank" rel="noopener noreferrer" className="underline">dev.fitbit.com</a>.
        Contact your administrator if the connection button does not work.
      </p>
    </div>
  );
}

// ── Tab: Manual CSV ──────────────────────────────────────────────────────────

function ManualCSVTab() {
  const [preview, setPreview] = useState<PreviewInfo | null>(null);
  const [previewRows, setPreviewRows] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleDownloadTemplate = () => {
    downloadCSV(generateCSVTemplate(), "carebridge-health-import-template.csv");
  };

  const handleFile = useCallback(async (f: File) => {
    setResult(null);
    setFileName(f.name);
    setFile(f);

    const text = await f.text();
    const { rows, preview: pv } = parseManualCSV(text);
    if (rows.length === 0) {
      toast.error("No data rows found. Make sure the CSV matches the template format.");
      return;
    }
    setPreview(pv);
    setPreviewRows(rows.slice(0, 5));
  }, []);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/import/csv", { method: "POST", body: form });
      const data: ImportResult = await res.json();
      setResult(data);
      if (data.imported > 0) toast.success(`Imported ${data.imported} health records`);
      else toast.info("No new records were imported");
    } catch {
      toast.error("Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const previewColumns = ["date", "steps", "heartRate", "sleep", "weight", "mood"];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold">Import from spreadsheet</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Download the template, fill in your data, and upload it back.
          </p>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 shrink-0">
          <Download className="size-4" />
          Download Template
        </Button>
      </div>

      <DropZone
        onFile={handleFile}
        accept=".csv"
        label="Upload filled CSV file"
        disabled={loading}
      />

      {preview && fileName && (
        <PreviewBadge preview={preview} fileName={fileName} />
      )}

      {previewRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                {previewColumns.map(col => (
                  <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {previewRows.map((row, i) => (
                <tr key={i}>
                  {previewColumns.map(col => (
                    <td key={col} className="px-3 py-2 text-foreground/80">{row[col] || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {(preview?.count ?? 0) > 5 && (
            <p className="px-3 py-2 text-xs text-muted-foreground border-t">
              ...and {(preview?.count ?? 0) - 5} more rows
            </p>
          )}
        </div>
      )}

      {file && preview && !result && (
        <Button onClick={handleImport} disabled={loading} className="w-full sm:w-auto">
          {loading && <RefreshCw className="size-4 mr-2 animate-spin" />}
          Import {preview.count} records
        </Button>
      )}

      {result && <ResultBanner result={result} />}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Health Data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bring your existing health data from other apps into CareBridge.
        </p>
      </div>

      <Tabs defaultValue="apple">
        <TabsList className="w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="apple" className="text-xs py-2">Apple Health</TabsTrigger>
          <TabsTrigger value="google" className="text-xs py-2">Google Fit</TabsTrigger>
          <TabsTrigger value="fitbit" className="text-xs py-2">Fitbit</TabsTrigger>
          <TabsTrigger value="csv" className="text-xs py-2">Manual CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="apple" className="mt-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Apple Health Export</CardTitle>
            </CardHeader>
            <CardContent>
              <AppleHealthTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google" className="mt-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Google Fit Export</CardTitle>
            </CardHeader>
            <CardContent>
              <GoogleFitTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fitbit" className="mt-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Fitbit Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <FitbitTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv" className="mt-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Manual CSV Import</CardTitle>
            </CardHeader>
            <CardContent>
              <ManualCSVTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
