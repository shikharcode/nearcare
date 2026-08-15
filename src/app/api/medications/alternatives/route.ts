import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

type OpenFDALabel = {
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
  };
};

type OpenFDAResponse = {
  results?: OpenFDALabel[];
  error?: { message: string };
};

type Alternative = {
  name: string;
  type: "generic" | "brand";
  searchUrl1mg: string;
  searchUrlPharmEasy: string;
};

function buildSearchUrl1mg(name: string) {
  return "https://www.1mg.com/search/all?name=" + encodeURIComponent(name);
}

function buildSearchUrlPharmEasy(name: string) {
  return "https://pharmeasy.in/search/all?name=" + encodeURIComponent(name);
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ error: "name query param required" }, { status: 400 });
  }

  let genericName: string | null = null;
  const alternativesMap = new Map<string, Alternative>();

  // Step 1: Search by brand name to find the generic equivalent
  try {
    const brandRes = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(name)}"&limit=3`,
      { next: { revalidate: 3600 } }
    );
    if (brandRes.ok) {
      const brandData: OpenFDAResponse = await brandRes.json();
      if (brandData.results?.length) {
        for (const result of brandData.results) {
          const gNames = result.openfda?.generic_name;
          if (gNames?.length) {
            // Take the first generic name found, clean it up (FDA returns uppercase)
            const raw = gNames[0].split(";")[0].trim();
            genericName = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
            // Add as generic alternative
            const key = genericName.toLowerCase();
            if (!alternativesMap.has(key)) {
              alternativesMap.set(key, {
                name: genericName,
                type: "generic",
                searchUrl1mg: buildSearchUrl1mg(genericName),
                searchUrlPharmEasy: buildSearchUrlPharmEasy(genericName),
              });
            }
          }
          // Collect other brand names from this result
          const bNames = result.openfda?.brand_name;
          if (bNames?.length) {
            for (const bn of bNames) {
              const cleanBn = bn.trim();
              const key = cleanBn.toLowerCase();
              if (key !== name.toLowerCase() && !alternativesMap.has(key)) {
                alternativesMap.set(key, {
                  name: cleanBn,
                  type: "brand",
                  searchUrl1mg: buildSearchUrl1mg(cleanBn),
                  searchUrlPharmEasy: buildSearchUrlPharmEasy(cleanBn),
                });
              }
            }
          }
        }
      }
    }
  } catch {
    // OpenFDA unavailable — continue with partial data
  }

  // Step 2: If name might itself be a generic, search by generic_name to find brands
  try {
    const genericRes = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(name)}"&limit=3`,
      { next: { revalidate: 3600 } }
    );
    if (genericRes.ok) {
      const genericData: OpenFDAResponse = await genericRes.json();
      if (genericData.results?.length) {
        // If we got results searching by generic_name, then name IS a generic
        if (!genericName) {
          const raw = name.trim();
          genericName = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        }
        for (const result of genericData.results) {
          // Collect brand names
          const bNames = result.openfda?.brand_name;
          if (bNames?.length) {
            for (const bn of bNames) {
              const cleanBn = bn.trim();
              const key = cleanBn.toLowerCase();
              if (key !== name.toLowerCase() && !alternativesMap.has(key)) {
                alternativesMap.set(key, {
                  name: cleanBn,
                  type: "brand",
                  searchUrl1mg: buildSearchUrl1mg(cleanBn),
                  searchUrlPharmEasy: buildSearchUrlPharmEasy(cleanBn),
                });
              }
            }
          }
        }
      }
    }
  } catch {
    // OpenFDA unavailable — continue with partial data
  }

  // Always add the searched name itself as a search option
  const nameKey = name.toLowerCase();
  if (!alternativesMap.has(nameKey)) {
    alternativesMap.set(nameKey, {
      name,
      type: "brand",
      searchUrl1mg: buildSearchUrl1mg(name),
      searchUrlPharmEasy: buildSearchUrlPharmEasy(name),
    });
  }

  const alternatives = Array.from(alternativesMap.values()).slice(0, 6);

  const savingsTip =
    genericName
      ? `Generic versions of ${genericName} can be 60–80% cheaper than brand-name alternatives.`
      : "Ask your pharmacist about generic alternatives — they can save 60–80% on out-of-pocket costs.";

  return NextResponse.json({
    brandName: name,
    genericName,
    alternatives,
    savingsTip,
  });
}
