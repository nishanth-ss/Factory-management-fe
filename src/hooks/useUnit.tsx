import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./useNoistackToast";
import type { UnitCreatePayload, UnitCreateResponse, UnitType } from "@/types/unit";
// ✅ Fetch Units List
export function useUnits(params: { page?: number; limit?: number; search?: string }, options?: any) {
  const { page = 1, limit = 10, search = "" } = params;

  return useQuery<any, Error>({
    queryKey: ["units", page, limit, search],
    queryFn: async () => {
      const res = await apiRequest<any>("GET", "/unit", undefined, {
        params: { page, limit, search },
      });
      return res;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
    ...options,
  });
}

// ✅ Create Unit
export const useCreateUnit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<UnitCreateResponse, Error, UnitCreatePayload>({
    mutationFn: (data: UnitCreatePayload) => apiRequest<UnitCreateResponse>("POST", "/unit", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["units"], refetchType: "active" });
      toast(res.message || "Unit created successfully", { variant: "success" });
    },
    onError: (error) => {
      toast(error.message || "Failed to create unit", { variant: "error" });
    },
  });
};

// ✅ Fetch Single Unit
export const useSingleUnit = (
  id?: string,
  options?: Omit<UseQueryOptions<UnitType, Error>, "queryKey" | "queryFn">
) => {
  return useQuery<UnitType, Error>({
    queryKey: ["unit", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing unit id");
      const res = await apiRequest<UnitType>("GET", `/unit/${id}`);
      return res;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
    ...options,
  });
};

// ✅ Update Unit
export const useUpdateUnit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<UnitCreateResponse, Error, { id: string; data: UnitCreatePayload }>({
    mutationFn: ({ id, data }) => apiRequest<UnitCreateResponse>("PUT", `/unit/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast(res.message || "Unit updated successfully", { variant: "success" });
    },
    onError: (error) => {
      toast(error.message || "Failed to update unit", { variant: "error" });
    },
  });
};

// ✅ Delete Unit
export const useDeleteUnit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<UnitCreateResponse, Error, { id: string }>({
    mutationFn: ({ id }) => apiRequest<UnitCreateResponse>("DELETE", `/unit/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast(res.message || "Unit deleted successfully", { variant: "success" });
    },
    onError: (error) => {
      toast(error.message || "Failed to delete unit", { variant: "error" });
    },
  });
};
