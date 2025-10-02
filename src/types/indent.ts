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
    raw_material?: {
      id: string;
      code: string;
      name: string;
      description: string;
      uom: string;
      category: string;
      batchable: boolean;
      reorder_level: number;
    };
  }[];
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