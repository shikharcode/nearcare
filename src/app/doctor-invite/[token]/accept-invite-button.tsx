'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  token: string;
  doctorName: string;
}

export function AcceptInviteButton({ token, doctorName }: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/doctor-invite/${token}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to accept invitation.");
        return;
      }
      toast.success(`Dr. ${doctorName} can now view your health records.`);
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <button
      onClick={handleAccept}
      disabled={accepting}
      className={cn(
        "flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors",
        accepting && "opacity-60 cursor-not-allowed"
      )}
    >
      {accepting ? (
        <>
          <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          Accepting...
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Accept Invitation
        </>
      )}
    </button>
  );
}
