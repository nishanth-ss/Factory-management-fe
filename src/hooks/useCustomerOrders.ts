import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/useNoistackToast";

interface Pagination {
  total_records: number;
  total_pages: number;
  current_page: number;
  limit: number;
}

export interface CustomerOrder {
  id: string;
  transit_register_id: string;
  so_no: string;
  order_date: string;
  customer_name: string;
  customer_address: string;
  ordered_qty: number;
  total_transferred_qty: string | number;
  rate: string | number;
  due_date: string;
  notes?: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  created_at: string;
  updated_at?: string;
  created_by?: string;
  article_name?: string; // Added as optional since it's used in the view
}

interface ApiResponse<T> {
  status: boolean;
  data: T;
  message: string;
}

interface CustomerOrdersData {
  data: CustomerOrder[];
  pagination: Pagination;
}

/** ============================
 * GET ALL CUSTOMER ORDERS
 * ===========================*/
interface UseCustomerOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const useCustomerOrders = (params?: UseCustomerOrdersParams): UseQueryResult<ApiResponse<CustomerOrdersData>> => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const search = params?.search ?? "";

  return useQuery<ApiResponse<CustomerOrdersData>>({
    queryKey: ["customer-orders", page, limit, search],
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit), search }).toString();
      const response = await apiRequest<ApiResponse<CustomerOrdersData>>("GET", `/customer-order?${qs}`);
      return response;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
  });
};

/** ============================
 * CREATE CUSTOMER ORDER
 * ===========================*/
export const useCreateCustomerOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/customer-order", data),

    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      const errorMessage = res instanceof Error 
        ? res.message 
        : typeof res === 'object' && res !== null && 'message' in res 
          ? (res as { message: string }).message 
          : 'Failed to create order';
      toast(errorMessage, { variant: "success" });
    },

    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null && 'message' in error 
          ? (error as { message: string }).message 
          : 'Failed to create order';
      toast(errorMessage, { variant: "error" });
    },
  });
};

/** ============================
 * GET CUSTOMER ORDER BY ID
 * ===========================*/
export const useGetCustomerOrderById = (id: string) => {
  return useQuery({
    queryKey: ["customer-order", id],
    queryFn: async () => {
      if (!id) return null;
      return await apiRequest("GET", `/customer-order/${id}`);
    },
    enabled: !!id,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
};

/** ============================
 * UPDATE CUSTOMER ORDER
 * ===========================*/
export const useUpdateCustomerOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    // { id, ...payload } structure
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/customer-order/${id}`, data);
    },

    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      const errorMessage = res instanceof Error 
        ? res.message 
        : typeof res === 'object' && res !== null && 'message' in res 
          ? (res as { message: string }).message 
          : 'Failed to update order';
      toast(errorMessage, { variant: "success" });
    },

    onError: (error: any) => {
      toast(error?.message || "Failed to update order", { variant: "error" });
    },
  });
};
