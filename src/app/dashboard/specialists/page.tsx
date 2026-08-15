"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Stethoscope, Phone, BadgeCheck, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const SPECIALITIES = [
  "Cardiologist",
  "Endocrinologist",
  "General Physician",
  "Orthopedic",
  "Neurologist",
  "Gynecologist",
  "Ophthalmologist",
  "Dermatologist",
  "Psychiatrist",
  "Pediatrician",
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

interface HealthAlert {
  id: string;
  type: string;
  message: string;
  severity: string;
}

interface Facility {
  name: string;
  address: string;
  state: string;
  district: string;
  specialities: string[];
  phone: string;
  registrationNumber: string;
}

function getSmartSuggestions(alerts: HealthAlert[]): string[] {
  const suggestions: string[] = [];
  const combined = alerts.map((a) => a.message.toLowerCase()).join(" ");

  if (/bp|blood pressure|hypertension|heart|cardiac/.test(combined)) {
    suggestions.push("Consider seeing a Cardiologist");
  }
  if (/blood sugar|glucose|diabetes|hba1c/.test(combined)) {
    suggestions.push("Consider seeing an Endocrinologist");
  }
  if (/pain|joint|bone|ortho/.test(combined)) {
    suggestions.push("Consider seeing an Orthopedic specialist");
  }
  return suggestions;
}

const suggestionColors = [
  "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
  "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
];

export default function SpecialistsPage() {
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [speciality, setSpeciality] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [fallback, setFallback] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch("/api/alerts?type=anomaly_detected");
        if (!res.ok) return;
        const data = await res.json();
        const list: HealthAlert[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.alerts)
          ? data.alerts
          : [];
        setAlerts(list);
        setSuggestions(getSmartSuggestions(list));
      } catch {
        // silently ignore — suggestions are best-effort
      }
    }
    fetchAlerts();
  }, []);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);
    setFacilities([]);
    setFallback(false);
    setFallbackMessage("");

    try {
      const params = new URLSearchParams();
      if (speciality) params.set("speciality", speciality);
      if (state) params.set("state", state);
      if (district) params.set("district", district);

      const res = await fetch(`/api/specialists/search?${params.toString()}`);
      const data = await res.json();

      setFacilities(data.facilities ?? []);
      setFallback(!!data.fallback);
      if (data.message) setFallbackMessage(data.message);
    } catch {
      setFallback(true);
      setFallbackMessage(
        "HFR API temporarily unavailable. Visit hfr.abdm.gov.in to search manually."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-10 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            Find a Specialist
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Powered by India&apos;s Health Facility Registry (ABDM)
          </p>
        </div>
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">
            Based on your health data
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={s}
                onClick={() => {
                  const match = SPECIALITIES.find((sp) =>
                    s.toLowerCase().includes(sp.toLowerCase())
                  );
                  if (match) setSpeciality(match);
                }}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 min-h-[44px]",
                  suggestionColors[i % suggestionColors.length]
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Search Facilities
        </p>

        {/* Speciality */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="speciality-select">
            Speciality
          </label>
          <select
            id="speciality-select"
            value={speciality}
            onChange={(e) => setSpeciality(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All specialities</option>
            {SPECIALITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="state-select">
            State
          </label>
          <select
            id="state-select"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All states</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="district-input">
            District{" "}
            <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
          </label>
          <input
            id="district-input"
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="e.g. South Delhi"
            className="w-full min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className={cn(
            "w-full min-h-[44px] rounded-xl font-semibold text-sm transition-all",
            loading
              ? "bg-blue-400 dark:bg-blue-700 text-white cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-sm hover:shadow-md"
          )}
        >
          {loading ? "Searching..." : "Search Facilities"}
        </button>
      </div>

      {/* Fallback Banner */}
      {fallback && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Live HFR data temporarily unavailable
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {fallbackMessage ||
                "Please try again shortly or search manually on the HFR portal."}
            </p>
            <a
              href="https://hfr.abdm.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 underline underline-offset-2"
            >
              Visit hfr.abdm.gov.in
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-3">
          {facilities.length > 0 ? (
            <>
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">
                {facilities.length} {facilities.length === 1 ? "facility" : "facilities"} found
              </p>
              {facilities.map((f, idx) => (
                <div
                  key={`${f.registrationNumber}-${idx}`}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">
                      {f.name}
                    </h3>
                    {f.registrationNumber && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[11px] font-semibold border border-green-200 dark:border-green-800 flex-shrink-0">
                        <BadgeCheck className="h-3 w-3" />
                        {f.registrationNumber}
                      </span>
                    )}
                  </div>

                  {f.address && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {f.address}
                      {f.district ? `, ${f.district}` : ""}
                      {f.state ? `, ${f.state}` : ""}
                    </p>
                  )}

                  {f.specialities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {f.specialities.map((sp) => (
                        <span
                          key={sp}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  )}

                  {f.phone && (
                    <a
                      href={`tel:${f.phone}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[44px]"
                    >
                      <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      {f.phone}
                    </a>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-12 space-y-2">
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                No facilities found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Try a different district, or{" "}
                <a
                  href="https://hfr.abdm.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
                >
                  visit hfr.abdm.gov.in
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
            What is HFR?
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            The Health Facility Registry (HFR) is India&apos;s official national database of healthcare
            facilities, maintained by the Ayushman Bharat Digital Mission (ABDM). It lists hospitals,
            clinics, diagnostic centres, and specialists across all states — verified and publicly
            accessible to help you find the right care near you.
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Link your ABHA (Ayushman Bharat Health Account) ID to enable seamless health data
            sharing with registered facilities.
          </p>
          <Link
            href="/dashboard/profile/abha"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            Link your ABHA ID
          </Link>
        </div>
      </div>
    </div>
  );
}
