export interface Vendor {
    id: string;
    name: string;
    contactEmail?: string;
    phone?: string;
    gstin?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
    };
    message?: string;
}

export interface VendorsApiResponse {
    data: Vendor[];
    total: number;
    page: number;
    limit: number;
    message: string;
}

export interface CreateVendor {
    id?: string;
    name: string;
    contactEmail?: string;
    phone?: string;
    gstin?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
    message?: string;
  }
  