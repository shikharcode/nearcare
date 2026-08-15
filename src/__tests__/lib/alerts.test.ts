import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("resend", () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
      },
    })),
  };
});

import { checkThresholds, type AlertResult } from "../../lib/alerts";

describe("checkThresholds", () => {
  describe("Blood Pressure", () => {
    it("normal BP (120/80) → no alerts", () => {
      const result = checkThresholds({ systolic: 120, diastolic: 80 });
      const bpAlerts = result.filter((a) => a.type === "blood_pressure");
      expect(bpAlerts).toHaveLength(0);
    });

    it("high BP warning (145/92) → 1 warning", () => {
      const result = checkThresholds({ systolic: 145, diastolic: 92 });
      const bpAlerts = result.filter((a) => a.type === "blood_pressure");
      expect(bpAlerts).toHaveLength(1);
      expect(bpAlerts[0].severity).toBe("warning");
    });

    it("critical BP (185/122) → 1 critical", () => {
      const result = checkThresholds({ systolic: 185, diastolic: 122 });
      const bpAlerts = result.filter((a) => a.type === "blood_pressure");
      expect(bpAlerts).toHaveLength(1);
      expect(bpAlerts[0].severity).toBe("critical");
    });

    it("low BP (85/55) → 1 warning", () => {
      const result = checkThresholds({ systolic: 85, diastolic: 55 });
      const bpAlerts = result.filter((a) => a.type === "blood_pressure");
      expect(bpAlerts).toHaveLength(1);
      expect(bpAlerts[0].severity).toBe("warning");
      expect(bpAlerts[0].message).toMatch(/below normal/i);
    });

    it("only systolic provided (no diastolic) → no BP alert", () => {
      const result = checkThresholds({ systolic: 180 });
      const bpAlerts = result.filter((a) => a.type === "blood_pressure");
      expect(bpAlerts).toHaveLength(0);
    });

    it("boundary: exactly 140/90 → no alert (must be ABOVE)", () => {
      const result = checkThresholds({ systolic: 140, diastolic: 90 });
      const bpAlerts = result.filter((a) => a.type === "blood_pressure");
      expect(bpAlerts).toHaveLength(0);
    });

    it("boundary: exactly 141/90 → warning", () => {
      const result = checkThresholds({ systolic: 141, diastolic: 90 });
      const bpAlerts = result.filter((a) => a.type === "blood_pressure");
      expect(bpAlerts).toHaveLength(1);
      expect(bpAlerts[0].severity).toBe("warning");
    });
  });

  describe("Heart Rate", () => {
    it("normal HR (75) → no alert", () => {
      const result = checkThresholds({ heartRate: 75 });
      const hrAlerts = result.filter((a) => a.type === "heart_rate");
      expect(hrAlerts).toHaveLength(0);
    });

    it("elevated HR (125) without exercise → warning", () => {
      const result = checkThresholds({ heartRate: 125 });
      const hrAlerts = result.filter((a) => a.type === "heart_rate");
      expect(hrAlerts).toHaveLength(1);
      expect(hrAlerts[0].severity).toBe("warning");
    });

    it("elevated HR (125) with 25 min exercise → NO warning (suppressed)", () => {
      const result = checkThresholds({ heartRate: 125 }, { exerciseMinutes: 25 });
      const hrAlerts = result.filter((a) => a.type === "heart_rate");
      expect(hrAlerts).toHaveLength(0);
    });

    it("elevated HR (125) with only 15 min exercise → warning (not enough exercise)", () => {
      const result = checkThresholds({ heartRate: 125 }, { exerciseMinutes: 15 });
      const hrAlerts = result.filter((a) => a.type === "heart_rate");
      expect(hrAlerts).toHaveLength(1);
      expect(hrAlerts[0].severity).toBe("warning");
    });

    it("critical HR (155) → critical regardless of exercise", () => {
      const result = checkThresholds({ heartRate: 155 });
      const hrAlerts = result.filter((a) => a.type === "heart_rate");
      expect(hrAlerts).toHaveLength(1);
      expect(hrAlerts[0].severity).toBe("critical");
    });

    it("critical HR (155) with 60 min exercise → STILL critical (exercise never suppresses critical)", () => {
      const result = checkThresholds({ heartRate: 155 }, { exerciseMinutes: 60 });
      const hrAlerts = result.filter((a) => a.type === "heart_rate");
      expect(hrAlerts).toHaveLength(1);
      expect(hrAlerts[0].severity).toBe("critical");
    });

    it("low HR (45) → warning", () => {
      const result = checkThresholds({ heartRate: 45 });
      const hrAlerts = result.filter((a) => a.type === "heart_rate");
      expect(hrAlerts).toHaveLength(1);
      expect(hrAlerts[0].severity).toBe("warning");
      expect(hrAlerts[0].message).toMatch(/lower than normal/i);
    });
  });

  describe("Blood Sugar", () => {
    it("normal (100) → no alert", () => {
      const result = checkThresholds({ bloodSugar: 100 });
      const bsAlerts = result.filter((a) => a.type === "blood_sugar");
      expect(bsAlerts).toHaveLength(0);
    });

    it("low (65) without exercise → critical with 'dangerously low' message", () => {
      const result = checkThresholds({ bloodSugar: 65 });
      const bsAlerts = result.filter((a) => a.type === "blood_sugar");
      expect(bsAlerts).toHaveLength(1);
      expect(bsAlerts[0].severity).toBe("critical");
      expect(bsAlerts[0].message).toMatch(/dangerously low/i);
    });

    it("low (65) WITH 35 min exercise → critical with 'after exercise' message", () => {
      const result = checkThresholds({ bloodSugar: 65 }, { exerciseMinutes: 35 });
      const bsAlerts = result.filter((a) => a.type === "blood_sugar");
      expect(bsAlerts).toHaveLength(1);
      expect(bsAlerts[0].severity).toBe("critical");
      expect(bsAlerts[0].message).toMatch(/after exercise/i);
    });

    it("high warning (200) → warning", () => {
      const result = checkThresholds({ bloodSugar: 200 });
      const bsAlerts = result.filter((a) => a.type === "blood_sugar");
      expect(bsAlerts).toHaveLength(1);
      expect(bsAlerts[0].severity).toBe("warning");
    });

    it("critical high (280) → critical", () => {
      const result = checkThresholds({ bloodSugar: 280 });
      const bsAlerts = result.filter((a) => a.type === "blood_sugar");
      expect(bsAlerts).toHaveLength(1);
      expect(bsAlerts[0].severity).toBe("critical");
    });
  });

  describe("Temperature", () => {
    it("normal (37.0) → no alert", () => {
      const result = checkThresholds({ temperature: 37.0 });
      const tempAlerts = result.filter((a) => a.type === "temperature");
      expect(tempAlerts).toHaveLength(0);
    });

    it("low-grade (37.6) → warning (new lower threshold)", () => {
      const result = checkThresholds({ temperature: 37.6 });
      const tempAlerts = result.filter((a) => a.type === "temperature");
      expect(tempAlerts).toHaveLength(1);
      expect(tempAlerts[0].severity).toBe("warning");
    });

    it("high fever (39.6) → critical", () => {
      const result = checkThresholds({ temperature: 39.6 });
      const tempAlerts = result.filter((a) => a.type === "temperature");
      expect(tempAlerts).toHaveLength(1);
      expect(tempAlerts[0].severity).toBe("critical");
    });
  });

  describe("SpO2 (Oxygen Saturation)", () => {
    it("normal (98) → no alert", () => {
      const result = checkThresholds({ oxygenSaturation: 98 });
      const spo2Alerts = result.filter((a) => a.type === "spo2");
      expect(spo2Alerts).toHaveLength(0);
    });

    it("low warning (93) → warning", () => {
      const result = checkThresholds({ oxygenSaturation: 93 });
      const spo2Alerts = result.filter((a) => a.type === "spo2");
      expect(spo2Alerts).toHaveLength(1);
      expect(spo2Alerts[0].severity).toBe("warning");
    });

    it("critical low (88) → critical", () => {
      const result = checkThresholds({ oxygenSaturation: 88 });
      const spo2Alerts = result.filter((a) => a.type === "spo2");
      expect(spo2Alerts).toHaveLength(1);
      expect(spo2Alerts[0].severity).toBe("critical");
    });
  });

  describe("Pain", () => {
    it("low pain (5) → no alert", () => {
      const result = checkThresholds({ painLevel: 5 });
      const painAlerts = result.filter((a) => a.type === "pain");
      expect(painAlerts).toHaveLength(0);
    });

    it("high pain (7) → warning (boundary)", () => {
      const result = checkThresholds({ painLevel: 7 });
      const painAlerts = result.filter((a) => a.type === "pain");
      expect(painAlerts).toHaveLength(1);
      expect(painAlerts[0].severity).toBe("warning");
    });

    it("severe pain (9) → warning", () => {
      const result = checkThresholds({ painLevel: 9 });
      const painAlerts = result.filter((a) => a.type === "pain");
      expect(painAlerts).toHaveLength(1);
      expect(painAlerts[0].severity).toBe("warning");
    });
  });

  describe("Combined / Edge Cases", () => {
    it("multiple bad vitals → multiple alerts returned", () => {
      const result = checkThresholds({
        systolic: 185,
        diastolic: 122,
        heartRate: 155,
        bloodSugar: 280,
        temperature: 39.6,
        oxygenSaturation: 88,
        painLevel: 9,
      });
      expect(result.length).toBeGreaterThanOrEqual(5);
      const types = result.map((a) => a.type);
      expect(types).toContain("blood_pressure");
      expect(types).toContain("heart_rate");
      expect(types).toContain("blood_sugar");
      expect(types).toContain("temperature");
      expect(types).toContain("spo2");
      expect(types).toContain("pain");
    });

    it("empty log {} → no alerts", () => {
      const result = checkThresholds({});
      expect(result).toHaveLength(0);
    });
  });
});
