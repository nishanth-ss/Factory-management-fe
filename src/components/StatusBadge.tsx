import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IndentStatus } from "@/types/indent";

interface StatusBadgeProps {
  status: IndentStatus | string | undefined;
  size?: "sm" | "default";
}

const statusConfig: Record<IndentStatus, { status: string; color: string }> = {
  draft: { status: "Draft", color: "bg-orange-400 text-white" },
  pending: { status: "Pending", color: "bg-orange-400 text-white" },
  submitted: { status: "Submitted", color: "bg-green-500 text-white" },
  approved: { status: "Approved", color: "bg-green-500 text-white" },
  received: { status: "Received", color: "bg-green-500 text-white" },
  rejected: { status: "Rejected", color: "bg-red-500 text-white" },
  "in-progress": { status: "In Progress", color: "bg-yellow-500 text-white" },
  "in_progress": { status: "In Progress", color: "bg-yellow-500 text-white" },
  "in_process": { status: "In Process", color: "bg-yellow-500 text-white" },
  completed: { status: "Completed", color: "bg-green-500 text-white" },
  planned: { status: "Planned", color: "bg-blue-500 text-white" },
  qc: { status: "QC", color: "bg-orange-500 text-white" },
  released: { status: "Released", color: "bg-green-500 text-white" },
  "partially_received": { status: "Partially Received", color: "bg-green-500 text-white" },
  closed: { status: "Closed", color: "bg-red-500 text-white" },
};

function normalizeStatus(input?: string): IndentStatus {
  const raw = (input ?? "draft").toString().toLowerCase().trim();
  // Map common variants to our canonical set
  if (raw === "in progress" || raw === "inprogress" || raw === "in-progress") return "in-progress";
  if (raw === "in process" || raw === "in_process") return "in_process";
  const allowed: IndentStatus[] = [
    "draft",
    "pending",
    "submitted",
    "approved",
    "rejected",
    "in-progress",
    "in_progress",
    "in_process",
    "completed",
    "planned",
    "qc",
    "released",
    "received",
    "partially_received",
    "closed",
  ];
  const maybe = raw.replace(/\s+/g, "_") as IndentStatus;
  return allowed.includes(maybe) ? maybe : "draft";
}

export default function StatusBadge({ status = "draft", size = "default" }: StatusBadgeProps) {
  const normalized = normalizeStatus(status as string);
  const config = statusConfig[normalized];
  return (
    <Badge
      variant="secondary"
      className={cn(config.color, size === "sm" && "text-xs px-2 py-0.5")}
      data-testid={`status-${normalized}`}
    >
      {config.status}
    </Badge>
  );
}