export interface UnitItem {
  raw_material_id: string;
  weight: number;
  unit: string;
  rate: number;
}

export interface UnitType {
  id: string;
  unit_name: string;
  department_name: string;
  purpose: string;
  shop_name: string;
  product_name: string;
  items: UnitItem[];
  created_at?: string;
  updated_at?: string;
}

export interface UnitCreatePayload {
  unit_name: string;
  department_name: string;
  purpose: string;
  shop_name: string;
  product_name: string;
  items: UnitItem[];
}

export interface UnitCreateResponse {
  message: string;
  data?: UnitType;
}
