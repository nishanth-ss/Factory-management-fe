import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./useNoistackToast";

// ---------- Types ----------
export interface TransitRegisterType {
    data:{
        id: string;
        manufacture_articles_id: string;
        transit_date: string;
        production_name: string;
        indent_id: string;
        quantity: number;
        unit: string;
        created_at?: string;
        updated_at?: string;
    },
    pagination:{
        total_records: number;
        total_pages: number;
        current_page: number;
        limit: number;
    }
}

export interface TransitRegisterCreatePayload {
  manufacture_articles_id: string;
  transit_date: string;
  production_name: string;
  indent_id: string;
  quantity: number;
  unit: string;
}

// types.ts
export interface TransitRegisterItem {
    id: string;
    manufacture_articles_id: string;
    transit_date: string;
    production_name: string;
    indent_id: string;
    quantity: string | number;
    unit: string;
    store_keeper_approval: boolean;
    jailor_approval: boolean;
    superintendent_approval: boolean;
    created_at?: string;
    updated_at?: string;
    remarks?: string;
    article_name: string;
    article_remarks: string | null;
    total_records?: number;
}

export interface TransitRegisterResponseData {
    data: TransitRegisterItem[];  // ← Array!
    pagination: {
        total_records: number;
        total_pages: number;
        current_page: number;
        limit: number;
    };
}

export interface TransitRegisterResponse {
    data: TransitRegisterResponseData;
    message?: string;
}

// types.ts or in your hook file
export interface TransitRegisterSingleResponse {
    data: TransitRegisterItem;  // ← single item, not array
    message?: string;
}

// ---------- Fetch All Transit Registers ----------
export function useTransitRegisters(params?: { 
  page?: number; 
  limit?: number | string; 
  search?: string;
  enabled?: boolean;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const search = params?.search ?? "";
  const enabled = params?.enabled ?? true;

  return useQuery<TransitRegisterResponse, Error>({
    queryKey: ["transit-registers", page, limit, search],
    queryFn: async () => {
      const res = await apiRequest<TransitRegisterResponse>(
        "GET",
        `/transit_register?search=${search}`,
        undefined,
        { params: { page, limit } }
      );
      return res;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
    enabled,
  });
}

// ---------- Create Transit Register ----------
export const useCreateTransitRegister = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ message: string }, Error, TransitRegisterCreatePayload>({
    mutationFn: (data) => apiRequest("POST", "/transit_register", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["transit-registers"] });
      toast(res?.message ?? "Transit record created successfully", { variant: "success" });
    },
    onError: (error) => {
      toast(error.message ?? "Error creating transit record", { variant: "error" });
    },
  });
};

export const useUpdateTransitRegister = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    { message: string },
    Error,
    { id: string; data: TransitRegisterCreatePayload }
  >({
    mutationFn: ({ id, data }) => apiRequest("PUT", `/transit_register/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["transit-registers"] });
      toast(res?.message ?? "Transit record updated successfully", {
        variant: "success",
      });
    },
    onError: (error) => {
      toast(error.message ?? "Error updating transit record", {
        variant: "error",
      });
    },
  });
};

// ---------- Fetch Single Transit Register ----------
export const useSingleTransitRegister = (
  id?: string,
  options?: Omit<UseQueryOptions<TransitRegisterSingleResponse, Error>, "queryKey" | "queryFn">
) => {
  return useQuery<TransitRegisterSingleResponse, Error>({
    queryKey: ["transit-register", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing transit register id");
      return await apiRequest<TransitRegisterSingleResponse>("GET", `/transit_register/${id}`);
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
    ...options,
  });
};

// ---------- Delete Transit Register ----------
export const useDeleteTransitRegister = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ message: string }, Error, { id: string }>({
    mutationFn: ({ id }) => apiRequest("DELETE", `/transit_register/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["transit-registers"] });
      toast(res?.message ?? "Transit record deleted successfully", { variant: "success" });
    },
    onError: (error) => {
      toast(error.message ?? "Error deleting transit record", { variant: "error" });
    },
  });
};
