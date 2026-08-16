import { pgTable, text, timestamp, integer, real, boolean, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  name: text("name"),
  dateOfBirth: text("date_of_birth"),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  emergencyContact: text("emergency_contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const healthLogs = pgTable("health_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD
  mood: integer("mood"), // 1-5
  energy: integer("energy"), // 1-5
  sleep: real("sleep"), // hours
  water: real("water"), // liters
  exercise: integer("exercise"), // minutes
  steps: integer("steps"),
  weight: real("weight"), // kg
  heartRate: integer("heart_rate"), // bpm
  systolic: integer("systolic"), // blood pressure mmHg
  diastolic: integer("diastolic"), // blood pressure mmHg
  bloodSugar: real("blood_sugar"), // mg/dL
  temperature: real("temperature"), // celsius
  oxygenSaturation: integer("oxygen_saturation"), // %
  calories: integer("calories"),
  symptoms: text("symptoms"), // comma separated
  notes: text("notes"),
  painLevel: integer("pain_level"), // 0-10
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medications = pgTable("medications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  dosage: text("dosage"),
  frequency: text("frequency"), // daily, twice daily, etc
  times: text("times"), // JSON array of times like ["08:00","20:00"]
  startDate: text("start_date"),
  endDate: text("end_date"),
  prescribedBy: text("prescribed_by"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicationLogs = pgTable("medication_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  medicationId: uuid("medication_id").notNull().references(() => medications.id),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time"), // HH:MM
  taken: boolean("taken").default(false),
  skippedReason: text("skipped_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // prescription, lab_report, scan, other
  fileKey: text("file_key").notNull(), // R2 storage key
  fileUrl: text("file_url"),
  extractedData: text("extracted_data"), // JSON from Gemini
  doctorName: text("doctor_name"),
  date: text("date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shareLinks = pgTable("share_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  label: text("label"), // "Dr. Smith", "Emergency"
  expiresAt: timestamp("expires_at"),
  includeDocuments: boolean("include_documents").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const familyContacts = pgTable("family_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  relationship: text("relationship"), // son, daughter, spouse, caregiver, doctor
  alertsEnabled: boolean("alerts_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const healthAlerts = pgTable("health_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  logId: uuid("log_id"),
  type: text("type").notNull(), // blood_pressure, heart_rate, blood_sugar, temperature, spo2, pain
  severity: text("severity").notNull(), // warning, critical
  message: text("message").notNull(),
  value: text("value"),
  emailSent: boolean("email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorProfiles = pgTable("doctor_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  specialty: text("specialty"),
  licenseNumber: text("license_number"),
  hospital: text("hospital"),
  phone: text("phone"),
  bio: text("bio"),
  yearsOfExperience: integer("years_of_experience"),
  languages: text("languages"), // comma separated
  isVerified: boolean("is_verified").default(false),
  verificationSubmitted: boolean("verification_submitted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorPatients = pgTable("doctor_patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorUserId: text("doctor_user_id").notNull().references(() => users.id),
  patientUserId: text("patient_user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  inviteToken: text("invite_token").unique(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
});

export const doctorNotes = pgTable("doctor_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorUserId: text("doctor_user_id").notNull().references(() => users.id),
  patientUserId: text("patient_user_id").notNull().references(() => users.id),
  note: text("note").notNull(),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorManagedPatients = pgTable("doctor_managed_patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorUserId: text("doctor_user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth"),
  phone: text("phone"),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  emergencyContact: text("emergency_contact"),
  claimToken: text("claim_token").notNull().unique(),
  claimedAt: timestamp("claimed_at"),
  claimedByUserId: text("claimed_by_user_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const caregiverAccess = pgTable("caregiver_access", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientUserId: text("patient_user_id").notNull().references(() => users.id),
  caregiverEmail: text("caregiver_email").notNull(),
  token: text("token").notNull().unique(),
  canLogHealth: boolean("can_log_health").default(true),
  canViewData: boolean("can_view_data").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
