'use client'

import * as React from "react"
import { toast } from "sonner"
import { Share2, Copy, Check, Plus, Trash2, Link, FileText, Clock, AlertCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type ShareLink = {
  id: string
  token: string
  label: string
  includeDocuments: boolean
  expiresAt: string | null
  createdAt: string
}

const defaultForm = { label: "", expiresAt: "", includeDocuments: false }

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "Never expires"
  return `Expires ${new Date(expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
}

export default function SharePage() {
  const [links, setLinks] = React.useState<ShareLink[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState(defaultForm)
  const [creating, setCreating] = React.useState(false)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [deletingToken, setDeletingToken] = React.useState<string | null>(null)

  const appUrl = typeof window !== "undefined" ? window.location.origin : ""

  React.useEffect(() => {
    fetch("/api/share")
      .then((r) => r.json())
      .then((data) => setLinks(data))
      .catch(() => toast.error("Could not load share links."))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label.trim() || "Doctor Share",
          includeDocuments: form.includeDocuments,
          expiresAt: form.expiresAt || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      const link = await res.json()
      setLinks((prev) => [...prev, link])
      setForm(defaultForm)
      setDialogOpen(false)
      toast.success("Share link created!")
    } catch {
      toast.error("Failed to create share link.")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(link: ShareLink) {
    if (!window.confirm(`Delete the share link "${link.label}"? Anyone with this link will lose access.`)) return
    setDeletingToken(link.token)
    try {
      const res = await fetch(`/api/share/${link.token}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setLinks((prev) => prev.filter((l) => l.token !== link.token))
      toast.success("Share link deleted.")
    } catch {
      toast.error("Could not delete share link.")
    } finally {
      setDeletingToken(null)
    }
  }

  function copyLink(token: string) {
    const url = `${appUrl}/share/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
    toast.success("Link copied to clipboard!")
  }

  const activeCount = links.filter((l) => !isExpired(l.expiresAt)).length

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 className="h-6 w-6 text-blue-500" />
            Share with Doctor
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate read-only links for your doctor or family
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="gap-1.5" />}>
            <Plus className="h-4 w-4" />
            New Link
          </DialogTrigger>

          <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:ring-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                Create Share Link
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              {/* Label */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="sl-label"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Label
                </Label>
                <Input
                  id="sl-label"
                  placeholder="e.g. Dr. Smith"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              {/* Expiry date */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="sl-expiry"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Expiry Date{" "}
                  <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="sl-expiry"
                  type="date"
                  value={form.expiresAt}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Leave blank for a permanent link
                </p>
              </div>

              {/* Include documents toggle */}
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.includeDocuments}
                  onClick={() => setForm((f) => ({ ...f, includeDocuments: !f.includeDocuments }))}
                  className={cn(
                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 mt-0.5",
                    form.includeDocuments
                      ? "bg-blue-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
                      form.includeDocuments ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Include uploaded documents
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Share your medical records and lab results
                  </p>
                </div>
              </div>

              <div className="-mx-4 -mb-4 flex justify-end gap-2 rounded-b-xl border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDialogOpen(false)
                    setForm(defaultForm)
                  }}
                  disabled={creating}
                  className="dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? "Creating…" : "Create Link"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="py-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : links.length === 0 ? (
        <EmptyState onAdd={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
            {activeCount} active · {links.length - activeCount} expired
          </p>
          {links.map((link) => (
            <ShareLinkCard
              key={link.id}
              link={link}
              appUrl={appUrl}
              copied={copied === link.token}
              isDeleting={deletingToken === link.token}
              onCopy={() => copyLink(link.token)}
              onDelete={() => handleDelete(link)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ShareLinkCard({
  link,
  appUrl,
  copied,
  isDeleting,
  onCopy,
  onDelete,
}: {
  link: ShareLink
  appUrl: string
  copied: boolean
  isDeleting: boolean
  onCopy: () => void
  onDelete: () => void
}) {
  const expired = isExpired(link.expiresAt)
  const shareUrl = `${appUrl}/share/${link.token}`

  return (
    <Card
      className={cn(
        "transition-all duration-150 dark:bg-gray-900 dark:border-gray-800",
        isDeleting && "opacity-50 pointer-events-none",
        expired && "opacity-70"
      )}
    >
      <CardContent className="py-4 px-4 space-y-3">
        {/* Top row: icon + label + badges + delete */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex-shrink-0">
            <Share2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
          </div>
          <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 flex-1 truncate">
            {link.label}
          </p>
          {link.includeDocuments && (
            <Badge variant="secondary" className="text-xs gap-1 flex-shrink-0">
              <FileText className="h-3 w-3" />
              Docs
            </Badge>
          )}
          {expired ? (
            <Badge className="text-xs gap-1 flex-shrink-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800">
              <AlertCircle className="h-3 w-3" />
              Expired
            </Badge>
          ) : link.expiresAt ? (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-shrink-0">
              <Clock className="h-3 w-3" />
              {formatExpiry(link.expiresAt)}
            </span>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              No expiry
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            title="Delete link"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex-shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* URL box + copy button */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2.5 border transition-colors duration-200",
            copied
              ? "bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-700"
              : expired
              ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          )}
        >
          <p
            className={cn(
              "text-xs flex-1 truncate font-mono transition-colors duration-200",
              copied
                ? "text-green-700 dark:text-green-300"
                : expired
                ? "text-gray-400 dark:text-gray-600 line-through"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            {shareUrl}
          </p>
          <Button
            size="sm"
            variant={copied ? "default" : "ghost"}
            onClick={onCopy}
            disabled={expired}
            className={cn(
              "flex-shrink-0 h-7 px-2 transition-all duration-200",
              copied && "bg-green-500 hover:bg-green-600 text-white"
            )}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Copy</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-5">
        <Link className="h-8 w-8 text-blue-400 dark:text-blue-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No share links yet
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6 leading-relaxed">
        Create a read-only link to share your health data with your doctor, specialist, or family member — no account needed.
      </p>
      <Button onClick={onAdd} className="gap-1.5">
        <Plus className="h-4 w-4" />
        Create Your First Link
      </Button>
    </div>
  )
}
