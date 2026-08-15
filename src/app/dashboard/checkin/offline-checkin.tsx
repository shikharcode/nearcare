"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const QUEUE_KEY = "nearcare_offline_queue";

export type OfflineCheckIn = {
  queuedAt: string;
  data: Record<string, unknown>;
};

function readQueue(): OfflineCheckIn[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineCheckIn[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineCheckIn[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function flushQueue(): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;

  const successes: OfflineCheckIn[] = [];

  for (const item of queue) {
    try {
      const res = await fetch("/api/health-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.data),
      });
      if (res.ok) {
        successes.push(item);
      }
    } catch {
      // still offline or error — leave in queue
    }
  }

  if (successes.length > 0) {
    const remaining = queue.filter((item) => !successes.includes(item));
    writeQueue(remaining);
  }

  return successes.length;
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [queuedCount, setQueuedCount] = useState<number>(0);

  const refreshCount = useCallback(() => {
    setQueuedCount(readQueue().length);
  }, []);

  const syncNow = useCallback(async () => {
    const synced = await flushQueue();
    refreshCount();
    if (synced > 0) {
      toast.success(`Synced ${synced} offline check-in${synced !== 1 ? "s" : ""}`);
    }
    return synced;
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();

    function handleOnline() {
      setIsOnline(true);
      syncNow();
    }

    function handleOffline() {
      setIsOnline(false);
      refreshCount();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshCount, syncNow]);

  const enqueue = useCallback(
    (data: Record<string, unknown>) => {
      const queue = readQueue();
      queue.push({ queuedAt: new Date().toISOString(), data });
      writeQueue(queue);
      refreshCount();
    },
    [refreshCount]
  );

  return { isOnline, queuedCount, syncNow, enqueue };
}

// Standalone offline check-in banner component
export function OfflineCheckInBanner() {
  const { isOnline, queuedCount } = useOfflineQueue();

  if (isOnline && queuedCount === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
      {!isOnline ? (
        <p>
          You are offline — your check-in will be saved and synced when connected.
          {queuedCount > 0 && (
            <span className="ml-1 font-medium">
              ({queuedCount} queued)
            </span>
          )}
        </p>
      ) : (
        queuedCount > 0 && (
          <p>
            Syncing {queuedCount} offline check-in{queuedCount !== 1 ? "s" : ""}…
          </p>
        )
      )}
    </div>
  );
}
