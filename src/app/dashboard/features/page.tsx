import {
  Activity,
  Mic,
  MessageSquare,
  Pill,
  ScanLine,
  Zap,
  DollarSign,
  FolderOpen,
  Brain,
  Bot,
  AlertCircle,
  CalendarCheck,
  TrendingUp,
  ClipboardList,
  FileHeart,
  Share2,
  Bell,
  ShieldAlert,
  Users,
  Eye,
  Stethoscope,
  UserPlus,
  UserCheck,
  History,
  FlaskConical,
  Printer,
  FileText,
  BadgeCheck,
  BarChart3,
  Sparkles,
  Filter,
  Languages,
  MapPin,
  Smartphone,
  WifiOff,
  Moon,
  ShieldCheck,
  Search,
  CheckCircle2,
  Lock,
  Flag,
  Watch,
  MessageCircle,
  Building2,
  RefreshCcw,
  Heart,
  ClipboardEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Feature {
  icon: React.ElementType;
  name: string;
  description: string;
}

interface Section {
  id: string;
  label: string;
  subtitle: string;
  color: string;
  iconBg: string;
  cardBg: string;
  badgeColor: string;
  SectionIcon: React.ElementType;
  features: Feature[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const sections: Section[] = [
  {
    id: "patient",
    label: "For You",
    subtitle: "Patient",
    color: "text-blue-700 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    cardBg:
      "bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700",
    badgeColor:
      "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300",
    SectionIcon: Heart,
    features: [
      {
        icon: Activity,
        name: "Daily Health Log",
        description: "Track vitals, mood, sleep, energy, and symptoms every day.",
      },
      {
        icon: Zap,
        name: "Quick Check-in",
        description: "Log your daily health in under 30 seconds.",
      },
      {
        icon: Mic,
        name: "Voice Log",
        description: "Speak your symptoms and have them transcribed instantly.",
      },
      {
        icon: MessageSquare,
        name: "NLP Log",
        description: "Type naturally — AI parses your words into structured data.",
      },
      {
        icon: Pill,
        name: "Medication Tracker",
        description: "Never miss a dose with smart reminders and progress rings.",
      },
      {
        icon: ScanLine,
        name: "Prescription Scanner",
        description: "Photograph a prescription and auto-fill all medications.",
      },
      {
        icon: AlertCircle,
        name: "Drug Interaction Check",
        description: "Instantly flag dangerous combinations in your med list.",
      },
      {
        icon: DollarSign,
        name: "Medicine Cost Finder",
        description: "Compare prices across pharmacies to save on prescriptions.",
      },
      {
        icon: FolderOpen,
        name: "Document Vault",
        description: "Upload and search all your reports, scans, and lab results.",
      },
      {
        icon: Brain,
        name: "AI Insights",
        description: "Gemini analyzes your week and surfaces personalized patterns.",
      },
      {
        icon: Bot,
        name: "AI Chat",
        description: "Ask any health question and get context-aware answers.",
      },
      {
        icon: AlertCircle,
        name: "Anomaly Detection",
        description: "Automatic alerts when readings fall outside safe ranges.",
      },
      {
        icon: CalendarCheck,
        name: "Appointment Prep",
        description: "AI-generated briefing to bring to your next doctor visit.",
      },
      {
        icon: TrendingUp,
        name: "Trends & Charts",
        description: "Visualize months of health data across all vital categories.",
      },
      {
        icon: ClipboardList,
        name: "Health History",
        description: "Full chronological record of every logged health event.",
      },
      {
        icon: FileHeart,
        name: "Health Passport",
        description: "One-page portable summary of your complete health profile.",
      },
      {
        icon: Share2,
        name: "Share with Doctor",
        description: "Generate a read-only token link for your healthcare provider.",
      },
    ],
  },
  {
    id: "family",
    label: "For Your Family",
    subtitle: "Caregivers",
    color: "text-emerald-700 dark:text-emerald-400",
    iconBg:
      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    cardBg:
      "bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-700",
    badgeColor:
      "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300",
    SectionIcon: Users,
    features: [
      {
        icon: Bell,
        name: "Family Alerts",
        description: "Notify caregivers by email when critical readings are detected.",
      },
      {
        icon: ShieldAlert,
        name: "SOS Button",
        description: "One-tap emergency alert sent to all family contacts instantly.",
      },
      {
        icon: Users,
        name: "Caregiver Mode",
        description: "Manage a loved one's health profile with delegated access.",
      },
      {
        icon: Eye,
        name: "Remote Monitoring",
        description: "View real-time vitals and logs for family members you care for.",
      },
    ],
  },
  {
    id: "doctors",
    label: "For Doctors",
    subtitle: "Clinical Portal",
    color: "text-purple-700 dark:text-purple-400",
    iconBg:
      "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
    cardBg:
      "bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700",
    badgeColor:
      "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300",
    SectionIcon: Stethoscope,
    features: [
      {
        icon: Stethoscope,
        name: "Doctor Portal",
        description: "Dedicated dashboard to manage your entire patient panel.",
      },
      {
        icon: UserPlus,
        name: "Invite Patient",
        description: "Send secure invite tokens for existing NearCare users.",
      },
      {
        icon: ClipboardEdit,
        name: "Create Patient (Offline)",
        description: "Add patients who don't have a NearCare account yet.",
      },
      {
        icon: UserCheck,
        name: "Patient Claim Flow",
        description: "Offline patients can claim their record when they sign up.",
      },
      {
        icon: History,
        name: "View Patient History",
        description: "Access the full health log and document vault of your patients.",
      },
      {
        icon: Pill,
        name: "Prescribe Medications",
        description: "Add medications directly to a patient's tracker from your portal.",
      },
      {
        icon: FlaskConical,
        name: "Order Lab Tests",
        description: "Issue lab test orders that appear in the patient's documents.",
      },
      {
        icon: Printer,
        name: "Print Prescription",
        description: "Generate a formatted printable prescription with one click.",
      },
      {
        icon: FileText,
        name: "Doctor Notes",
        description: "Attach private or shared clinical notes to any patient record.",
      },
      {
        icon: BadgeCheck,
        name: "Verification Badge",
        description: "Verified doctor badge visible to all your connected patients.",
      },
    ],
  },
  {
    id: "ai",
    label: "AI Powered",
    subtitle: "Gemini AI",
    color: "text-amber-700 dark:text-amber-400",
    iconBg:
      "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    cardBg:
      "bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700",
    badgeColor:
      "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300",
    SectionIcon: Sparkles,
    features: [
      {
        icon: BarChart3,
        name: "Weekly Summary",
        description: "Personalized narrative health recap generated every Sunday.",
      },
      {
        icon: Bot,
        name: "Health Chat",
        description: "Context-aware assistant that knows your full health history.",
      },
      {
        icon: AlertCircle,
        name: "Anomaly Detection",
        description: "Gemini flags statistically abnormal vitals in real time.",
      },
      {
        icon: Filter,
        name: "Smart Alert Filtering",
        description: "AI suppresses false alarms while surfacing genuine concerns.",
      },
      {
        icon: CalendarCheck,
        name: "Appointment Briefing",
        description: "Auto-generated visit summary ready to share with your doctor.",
      },
      {
        icon: Zap,
        name: "Medication Interactions",
        description: "AI cross-references your full med list for interaction risks.",
      },
      {
        icon: Languages,
        name: "NLP Parsing",
        description: "Understand freeform health descriptions in natural language.",
      },
      {
        icon: MapPin,
        name: "Indian Context AI",
        description: "Trained on India-specific disease patterns, diets, and seasons.",
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    subtitle: "Infrastructure",
    color: "text-gray-700 dark:text-gray-300",
    iconBg: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    cardBg:
      "bg-gray-50/80 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600",
    badgeColor: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
    SectionIcon: ShieldCheck,
    features: [
      {
        icon: Smartphone,
        name: "PWA Install",
        description: "Install NearCare on your phone home screen like a native app.",
      },
      {
        icon: WifiOff,
        name: "Offline Support",
        description: "Log health data without internet — syncs automatically later.",
      },
      {
        icon: Moon,
        name: "Dark / Light Mode",
        description: "System-adaptive theme with instant manual override.",
      },
      {
        icon: ShieldCheck,
        name: "ABHA Health ID",
        description: "Link your government Ayushman Bharat Health Account.",
      },
      {
        icon: Search,
        name: "HFR Specialist Finder",
        description: "Search the Health Facility Registry for nearby verified doctors.",
      },
      {
        icon: CheckCircle2,
        name: "126 Tests Passing",
        description: "Comprehensive automated test suite covering all critical flows.",
      },
      {
        icon: Lock,
        name: "End-to-End Encrypted",
        description: "All health data encrypted at rest and in transit with AES-256.",
      },
      {
        icon: Flag,
        name: "India-First Design",
        description: "Built for Indian users — vernacular support, local context, INR pricing.",
      },
    ],
  },
];

// ─── Coming Soon ──────────────────────────────────────────────────────────────

const comingSoon: { icon: React.ElementType; name: string; description: string }[] = [
  {
    icon: Watch,
    name: "Apple Watch Sync",
    description: "Auto-import heart rate, SpO2, and ECG from Apple Health.",
  },
  {
    icon: MessageCircle,
    name: "WhatsApp Alerts",
    description: "Receive health alerts and reminders on WhatsApp.",
  },
  {
    icon: Building2,
    name: "Hospital Integration",
    description: "Direct EMR sync with partnered hospital systems.",
  },
  {
    icon: RefreshCcw,
    name: "ABHA Live Sync",
    description: "Real-time two-way sync with the national health record.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const totalFeatures = sections.reduce((acc, s) => acc + s.features.length, 0);
const totalCategories = sections.length;

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <div className="min-h-screen pb-24 md:pb-10">
      {/* Header */}
      <div className="px-4 pt-6 pb-2 md:px-8 md:pt-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            All Features
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-[52px]">
          Everything NearCare can do for you
        </p>
      </div>

      {/* Feature count banner */}
      <div className="mx-4 md:mx-8 mt-5 rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 p-px shadow-lg shadow-blue-500/20">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-0.5">
              Platform Overview
            </p>
            <p className="text-white text-xl md:text-2xl font-bold">
              {totalFeatures} features across {totalCategories} categories
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {sections.map((s) => (
              <div
                key={s.id}
                className="bg-white/15 rounded-xl px-3 py-1.5 text-center min-w-[56px]"
              >
                <p className="text-white font-bold text-lg leading-none">
                  {s.features.length}
                </p>
                <p className="text-white/70 text-[10px] font-medium mt-0.5 leading-tight">
                  {s.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="px-4 md:px-8 mt-8 space-y-10">
        {sections.map((section) => {
          const SectionIcon = section.SectionIcon;
          return (
            <section key={section.id}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    section.iconBg
                  )}
                >
                  <SectionIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2
                      className={cn(
                        "text-lg font-bold leading-tight",
                        section.color
                      )}
                    >
                      {section.label}
                    </h2>
                    <span
                      className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                        section.badgeColor
                      )}
                    >
                      {section.features.length} features
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {section.subtitle}
                  </p>
                </div>
              </div>

              {/* Feature cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {section.features.map((feature) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div
                      key={feature.name}
                      className={cn(
                        "rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                        section.cardBg
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                            section.iconBg
                          )}
                        >
                          <FeatureIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                            {feature.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Coming Soon */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-400 dark:text-gray-500 leading-tight">
                  Coming Soon
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                  {comingSoon.length} features
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-600 font-medium">
                On the roadmap
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {comingSoon.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <div
                  key={feature.name}
                  className="rounded-2xl p-4 bg-gray-50/80 dark:bg-gray-800/20 border border-dashed border-gray-200 dark:border-gray-700 opacity-60"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                      <FeatureIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 leading-snug">
                        {feature.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
