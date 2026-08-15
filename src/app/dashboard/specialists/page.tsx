"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Stethoscope,
  Heart,
  Droplets,
  Brain,
  Bone,
  Star,
  Sun,
  Wind,
  Activity,
  Eye,
  Ear,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Specialist {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const specialists: Specialist[] = [
  {
    name: "Cardiologist",
    icon: <Heart className="w-6 h-6" />,
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  {
    name: "Endocrinologist",
    icon: <Droplets className="w-6 h-6" />,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    name: "Neurologist",
    icon: <Brain className="w-6 h-6" />,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    name: "Orthopedic",
    icon: <Bone className="w-6 h-6" />,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  {
    name: "Gynecologist",
    icon: <Star className="w-6 h-6" />,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
  },
  {
    name: "Dermatologist",
    icon: <Sun className="w-6 h-6" />,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
  },
  {
    name: "Psychiatrist",
    icon: <Brain className="w-6 h-6" />,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    name: "Diabetologist",
    icon: <Droplets className="w-6 h-6" />,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    name: "Pulmonologist",
    icon: <Wind className="w-6 h-6" />,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50",
  },
  {
    name: "Gastroenterologist",
    icon: <Activity className="w-6 h-6" />,
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    name: "Ophthalmologist",
    icon: <Eye className="w-6 h-6" />,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
  },
  {
    name: "ENT Specialist",
    icon: <Ear className="w-6 h-6" />,
    color: "text-teal-500",
    bgColor: "bg-teal-50",
  },
  {
    name: "General Physician",
    icon: <Stethoscope className="w-6 h-6" />,
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
];

const steps = [
  {
    step: 1,
    title: "Select a Specialization",
    description: "Tap the specialty that matches your health concern.",
  },
  {
    step: 2,
    title: "Generate Your Brief",
    description:
      "We compile your relevant health data into a concise 1-page summary tailored for that specialist.",
  },
  {
    step: 3,
    title: "Walk in Prepared",
    description:
      "Share the brief with your doctor so they have full context from the first minute.",
  },
];

export default function SpecialistsPage() {
  const router = useRouter();
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  const handleSpecSelect = (name: string) => {
    setSelectedSpec((prev) => (prev === name ? null : name));
  };

  const handleNotifyMe = () => {
    toast.success("You will be notified when doctor search launches!");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-10">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Find a Specialist
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
            Select your required specialization and get a personalized health
            brief ready for your appointment.
          </p>
        </div>

        {/* Specialization Grid */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Select Specialization
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {specialists.map((spec) => {
              const isSelected = selectedSpec === spec.name;
              return (
                <button
                  key={spec.name}
                  onClick={() => handleSpecSelect(spec.name)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 min-h-[80px] p-3 text-center transition-all duration-150 active:scale-95",
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-md"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <span
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center",
                      spec.bgColor,
                      spec.color
                    )}
                  >
                    {spec.icon}
                  </span>
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 leading-tight">
                    {spec.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* CTA Card — shown when a specialist is selected */}
        {selectedSpec && (
          <section>
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-5 text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
                Appointment Prep
              </p>
              <h3 className="text-lg font-bold mb-1">
                Preparing for your {selectedSpec} visit?
              </h3>
              <p className="text-sm text-blue-100 mb-4">
                Get a tailored 1-page summary of your health data for this
                appointment.
              </p>
              <button
                onClick={() => router.push("/dashboard/appointment")}
                className="w-full min-h-[44px] rounded-xl bg-white text-blue-600 font-semibold text-sm py-3 active:scale-95 transition-transform"
              >
                Generate Appointment Brief
              </button>
            </div>
          </section>
        )}

        {/* Coming Soon Card */}
        <section>
          <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/60 p-5 text-center space-y-2">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-200 dark:bg-gray-800 dark:text-gray-500 px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
            <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400">
              Live Doctor &amp; Hospital Search
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Integrating with Indian healthcare directories — Practo, NHA
              health facility registry.
            </p>
            <button
              onClick={handleNotifyMe}
              className="mt-2 min-h-[44px] w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium text-sm py-2 active:scale-95 transition-transform hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Notify me
            </button>
          </div>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            How It Works
          </h2>
          <ol className="space-y-4">
            {steps.map(({ step, title, description }) => (
              <li key={step} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-bold text-sm flex items-center justify-center">
                  {step}
                </span>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">
                    {title}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
