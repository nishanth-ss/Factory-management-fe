// src/types/rawMaterialBatch.ts

// 🔹 Single batch object
export interface RawMaterialBatchType {
    id?: string;
    product_id: string;    
    batch_no: string;     
    start_date: string;            
    end_date: string;        
    status?: string;
    notes?: string;       
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
  