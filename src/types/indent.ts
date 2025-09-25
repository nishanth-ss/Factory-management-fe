export interface IndentType {
  id?: string;
  indent_no: string;
  required_by: string;
  priority: string;
  notes?: string;
  date?: string;
  status?: IndentStatus;
  items: {
    raw_material_id: string;
    qty: number;
    uom: string;
    notes?: string;
    purpose?: string;
  }[];
}

export type IndentStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "in-progress"
  | "in_process"
  | "completed"
  | "planned"
  | "qc"
  | "released"
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