export interface PurchaseOrderItem {
    raw_material_id: string;
    qty: number;
    uom: string;
    rate: number;
  }
  
  export interface PurchaseOrder {
    id?: string;
    po_no: string;
    vendor_id: string;
    expected_delivery: string; // ISO date string, e.g. "2025-10-10"
    items: PurchaseOrderItem[];
  }

  export interface PurchaseOrderApiResponse {
    data: PurchaseOrder[];
    total: number;
    page: number;
    limit: number;
  }
  