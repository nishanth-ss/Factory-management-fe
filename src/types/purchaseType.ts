export interface PurchaseOrderItem {
    raw_material_id: string;
    qty: number;
    uom: string;
    rate: number;
  }
  
  export interface PurchaseOrder {
    id?: string;
    purchase_order_id?: string;
    po_no: string;
    vendor_id: string;
    total_value: number;
    status: string;
    expected_delivery: string; // ISO date string, e.g. "2025-10-10"
    items: PurchaseOrderItem[];
    vendor_name?: string;
  }

  export interface PurchaseOrderApiResponse {
    data: PurchaseOrder[];
    total: number;
    page: number;
    limit: number;
  }
  