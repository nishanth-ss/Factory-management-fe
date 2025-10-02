// src/types/rawMaterialBatch.ts

// 🔹 Single batch object
export interface RawMaterialBatchType {
    id?: string;
    raw_material_id: string;     // Reference to raw material
    batch_no: string;            // Batch number (unique)
    qty_received: number;        // Quantity received in this batch
    qty_available: number;       // Current available quantity
    cost_per_unit: number;       // Cost per unit
    mfg_date: string;            // Manufacturing date (ISO string, e.g. "2025-09-15")
    exp_date: string;            // Expiry date (ISO string)
    location: string;     
    status?: string;
    raw_material_name?: string;       // Storage location (e.g. "Warehouse A - Section B")
  }
  
  // 🔹 Response when creating/updating a batch
  export interface RawMaterialBatchCreateResponse {
    success: boolean;
    message: string;
    data: RawMaterialBatchType;
  }
  
  // 🔹 Paginated API response for fetching batches
  export interface RawMaterialBatchApiResponse {
    success: boolean;
    message: string;
    data: RawMaterialBatchType[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  