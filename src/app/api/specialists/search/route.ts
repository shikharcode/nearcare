import { NextRequest, NextResponse } from "next/server";

interface HFRFacility {
  facilityName?: string;
  address?: string;
  state?: string;
  district?: string;
  speciality?: string[] | string;
  contactNumber?: string;
  registrationNumber?: string;
  [key: string]: unknown;
}

interface MappedFacility {
  name: string;
  address: string;
  state: string;
  district: string;
  specialities: string[];
  phone: string;
  registrationNumber: string;
}

function mapFacility(f: HFRFacility): MappedFacility {
  return {
    name: f.facilityName ?? "Unknown Facility",
    address: f.address ?? "",
    state: f.state ?? "",
    district: f.district ?? "",
    specialities: Array.isArray(f.speciality)
      ? f.speciality
      : f.speciality
      ? [f.speciality]
      : [],
    phone: f.contactNumber ?? "",
    registrationNumber: f.registrationNumber ?? "",
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const speciality = searchParams.get("speciality") ?? "";
  const state = searchParams.get("state") ?? "";
  const district = searchParams.get("district") ?? "";

  const params = new URLSearchParams({
    facilityType: "HFR",
    state,
    district,
    facilityName: "",
    speciality,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `https://hfr.abdm.gov.in/api/v1/hfr/health-facility/search?${params.toString()}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HFR returned ${res.status}`);
    }

    const data = await res.json();

    const raw: HFRFacility[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.facilities)
      ? data.facilities
      : [];

    const facilities = raw.slice(0, 10).map(mapFacility);

    return NextResponse.json({ facilities, fallback: false });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({
      facilities: [],
      message:
        "HFR API temporarily unavailable. Visit hfr.abdm.gov.in to search manually.",
      fallback: true,
    });
  }
}
