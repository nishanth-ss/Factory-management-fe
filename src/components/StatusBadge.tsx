import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IndentStatus } from "@/types/indent";

interface StatusBadgeProps {
  status: IndentStatus | string | undefined;
  size?: "sm" | "default";
}

const statusConfig: Record<IndentStatus, { status: string; color: string }> = {
  draft: { status: "Draft", color: "bg-status-draft text-black" },
  submitted: { status: "Submitted", color: "bg-status-submitted text-black" },
  approved: { status: "Approved", color: "bg-status-approved text-black" },
  rejected: { status: "Rejected", color: "bg-status-rejected text-black" },
  "in-progress": { status: "In Progress", color: "bg-status-in-progress text-black" },
  "in_process": { status: "In Process", color: "bg-status-in-progress text-black" },
  completed: { status: "Completed", color: "bg-status-completed text-black" },
  planned: { status: "Planned", color: "bg-status-draft text-black" },
  qc: { status: "QC", color: "bg-status-in-progress text-black" },
  released: { status: "Released", color: "bg-status-completed text-black" },
  "partially_received": { status: "Partially Received", color: "bg-status-completed text-black" },
  closed: { status: "Closed", color: "bg-status-rejected text-black" },
};

function normalizeStatus(input?: string): IndentStatus {
  const raw = (input ?? "draft").toString().toLowerCase().trim();
  // Map common variants to our canonical set
  if (raw === "in progress" || raw === "inprogress" || raw === "in-progress") return "in-progress";
  if (raw === "in process" || raw === "in_process") return "in_process";
  const allowed: IndentStatus[] = [
    "draft",
    "submitted",
    "approved",
    "rejected",
    "in-progress",
    "in_process",
    "completed",
    "planned",
    "qc",
    "released",
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