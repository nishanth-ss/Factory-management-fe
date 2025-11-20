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
    raw_material_name?: string;  
    completed_units?: number;
    active_units?: number;
    total_units?: number; 
  }
  
  // 🔹 Response when creating/updating a batch
  export interface RawMaterialBatchCreateResponse {
    success: boolean;
    message: string;
    data: RawMaterialBatchType;
  }
  
  // 🔹 Paginated API response for fetching batches
export interface RawMaterialBatchesApiResponse {
  status: boolean;
  data: RawMaterialBatchType[];
  total: number;
  message: string;
}
  