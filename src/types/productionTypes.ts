// src/types/production.ts

// 🔹 Batch consumption record (used inside production)
export interface ProductionBatchConsumption {
    raw_material_batch_id: string; // Which raw material batch was consumed
    qty_consumed: number;          // Quantity consumed
    cost: number;                  // Cost of consumed qty
  }

export interface ProductionOperationExpense {
    expense_type: string; // Labour, Electricity, Water Bill, etc.
    amount: number; // Amount of expense
    expense_date: string; // Date of expense
    remarks: string; // Remarks
}
  
  // 🔹 Single production record
  export interface ProductionType {
    batch_no: string;                       // Production batch number
    article_sku: string;                    // SKU of the product being produced
    planned_qty: number;                    // Planned quantity to produce
    start_date: string;                     // Production start date (ISO string)
    end_date: string;                       // Production end date (ISO string)
    status: "planned" | "in_progress" | "completed" | "cancelled"; // Production status
    batch_consumptions: ProductionBatchConsumption[];
    operation_expenses: ProductionOperationExpense[]; // Operation expenses
  }
  
  // 🔹 Response when creating/updating a production record
  export interface ProductionCreateResponse {
    success: boolean;
    message: string;
    data: ProductionType;
  }
  
  // 🔹 Paginated API response for fetching production records
  export interface ProductionApiResponse {
    success: boolean;
    message: string;
    data: ProductionType[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  