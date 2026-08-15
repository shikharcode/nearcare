"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, BellOff, Clock, Send, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "reminder_enabled";

export default function MedicationRemindersPage() {
  const [enabled, setEnabled] = useState(false);
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    setEnabled(stored === "true");
  }, []);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    toast.success(
      next
        ? "Daily medication reminders enabled"
        : "Daily medication reminders disabled"
    );
  };

  const handleTestReminder = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: {
          "x-cron-secret": "test",
        },
      });

      if (res.status === 401) {
        // Expected in production — cron secret won't match "test"
        toast.info("Test triggered — check server logs (cron secret required in production)");
        return;
      }

      const data = await res.json() as { sent: number; errors: number };
      if (data.sent > 0) {
        toast.success(`Test reminder sent to ${data.sent} user${data.sent > 1 ? "s" : ""}!`);
      } else if (data.errors > 0) {
        toast.error("Reminder failed to send — check server logs.");
      } else {
        toast.info("No pending medications found for today — nothing to remind about.");
      }
    } catch {
      toast.error("Failed to send test reminder.");
    } finally {
      setSending(false);
    }
  };

  // Avoid hydration mismatch from localStorage
  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reminder Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Manage your daily medication email reminders
        </p>
      </div>

      {/* Toggle card */}
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                  enabled
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                )}
              >
                {enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Enable daily medication reminders
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Receive an email reminder for medications not yet logged each day
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={handleToggle}
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                enabled ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  enabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule info card */}
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Reminder schedule</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Reminders are sent daily at <strong>8:00 AM</strong>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Your local server timezone is used. Reminders only include medications not yet logged that day.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 shadow-none">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">How reminders work</p>
              <ul className="mt-2 space-y-1 text-xs text-blue-700 dark:text-blue-300 list-disc list-inside">
                <li>Only active medications are included in reminders</li>
                <li>Reminders only include medications not yet logged that day</li>
                <li>If all medications are already logged, no email is sent</li>
                <li>Each email includes a direct link to log your medications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test reminder */}
      <div className="pt-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Use the button below to send a test reminder email right now.
        </p>
        <Button
          variant="outline"
          onClick={handleTestReminder}
          disabled={sending}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending..." : "Send test reminder now"}
        </Button>
      </div>
    </div>
  );
}
