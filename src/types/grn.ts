export interface GrnType {
    id?: string;
    grn_id?: string;
    grn_no: string;
    po_no: string;
    vendor_name: string;
    purchase_order_id: string;
    notes?: string;
    gate_pass_number?: string;
    received_by_name?: string;
    received_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface GrnsApiResponse {
    data: GrnType[];
    total: number;
    page: number;
    limit: number;
    message: string;
}

// Payload used when creating a GRN
export interface GrnCreatePayload {
    grn_no: string;
    po_no: string;
    purchase_order_id: string;
    gate_pass_number: string;
    notes?: string;
    received_by?: string;
}

export interface GrnCreateResponse {
    message: string;
}
