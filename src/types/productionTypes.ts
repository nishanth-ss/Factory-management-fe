// src/types/production.ts

// 🔹 Batch consumption record (used inside production)
export interface ProductionBatchConsumption {
  raw_material_batch_id: string;
  qty_consumed: number;
  cost: number;
}

export interface ProductionOperationExpense {
  expense_type: string;
  amount: number;
  expense_date: string;
  remarks: string;
}

// 🔹 Single production record (matches API response)
export interface ProductionType {
  transit_id: string;
  production_name: string;
  transit_date: string;
  total_produced_qty: string;
  unit: string;
  indent_id: string;
  total_units: string;
  completed_units: string;
  active_units: string;
  total_ordered_qty: string;
  total_dispatched_qty: string;
  remaining_qty: string;
  total_cost: string;
  article_name: string;
  article_remarks: string;
  indent_no: string;
  indent_quantity: string;
}

// 🔹 Response when creating/updating a production record
export interface ProductionCreateResponse {
  success: boolean;
  message: string;
  data: ProductionType;
}

// 🔹 Paginated API response for fetching production records
export interface ProductionApiResponse {
  status: boolean;
  message: string;
  data: ProductionType[];
  total: number;
  page: number;
  limit?: number;
  totalPages?: number;
}