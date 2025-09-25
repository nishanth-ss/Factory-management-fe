import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "draft" | "submitted" | "approved" | "rejected" | "in-progress" | "in_process" | "completed" | "planned" | "qc" | "released";
  size?: "sm" | "default";
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-status-draft text-white" },
  submitted: { label: "Submitted", color: "bg-status-submitted text-black" },
  approved: { label: "Approved", color: "bg-status-approved text-white" },
  rejected: { label: "Rejected", color: "bg-status-rejected text-white" },
  "in-progress": { label: "In Progress", color: "bg-status-in-progress text-white" },
  "in_process": { label: "In Process", color: "bg-status-in-progress text-white" },
  completed: { label: "Completed", color: "bg-status-completed text-white" },
  planned: { label: "Planned", color: "bg-status-draft text-white" },
  qc: { label: "QC", color: "bg-status-in-progress text-white" },
  released: { label: "Released", color: "bg-status-completed text-white" },
};

export default function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(config.color, size === "sm" && "text-xs px-2 py-0.5")}
      data-testid={`status-${status}`}
    >
      {config.label}
    </Badge>
  );
}