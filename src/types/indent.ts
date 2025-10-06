export interface IndentType {
  id?: string;
  indent_no: string;
  required_by: string;
  priority: "low" | "medium" | "high";
  notes?: string;
  batch_no?: string;
  date?: string;
  status?: IndentStatus;
  requested_by?: string;
  created_at?: string;
  requested_by_name?: string;
}

export type IndentStatus =
  | "draft"
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "in-progress"
  | "in_process"
  | "completed"
  | "planned"
  | "qc"
  | "released"
  | "partially_received"
  | "closed";

export interface IndentsApiResponse {
  status: boolean;
  data: {
    indents: IndentType[];
    total: number;
    page: number;
    limit: number;
  };
  message: string;
}