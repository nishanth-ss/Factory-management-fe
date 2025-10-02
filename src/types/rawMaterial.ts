export interface RawMaterialType {
    id: string;
    code: string;
    name: string;
    description: string;
    uom: string;
    category: string;
    batchable: boolean;
    reorder_level: string;
    created_at: string;
    raw_material_name?: string;
}

export interface RawMaterialsApiResponse {
    status: boolean;
    data: RawMaterialType[];
    total: number;
    limit: number;
    page: number;
    message: string;
}

export interface RawMaterialCreateResponse {
    status: boolean;
    data: RawMaterialType[]; // still array, API returns [ { ... } ]
    message: string;
}