"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  token: string;
}

export function ClaimButton({ token }: Props) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  async function handleClaim() {
    setClaiming(true);
    try {
      const res = await fetch(`/api/claim/${token}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to claim profile. Please try again.");
        return;
      }
      setClaimed(true);
      toast.success("Profile claimed! Your health data is ready.");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setClaiming(false);
    }
  }

  if (claimed) {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-sm font-medium text-green-700 dark:text-green-300 text-center">
          Profile claimed! Redirecting to your dashboard...
        </p>
        <div className="h-1 w-32 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className="h-full bg-green-500 animate-[progress_2s_linear_forwards] rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClaim}
      disabled={claiming}
      className={cn(
        "flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-colors",
        claiming && "opacity-60 cursor-not-allowed"
      )}
    >
      {claiming ? (
        <>
          <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          Claiming Profile...
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Claim This Profile
        </>
      )}
    </button>
  );
}
