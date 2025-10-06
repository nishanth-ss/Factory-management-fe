import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./useNoistackToast";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import type { GrnType, GrnCreateResponse, GrnCreatePayload } from "@/types/grn"; 
import { setGrnResponse } from "@/store/manufacturingCollection";

// ✅ Fetch GRNs
export function useGrns(params: { page?: number; limit?: number; search?: string }) {
  const dispatch = useDispatch();

  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const search = params.search ?? "";

  const query = useQuery<any, Error>({
    queryKey: ["grns", page, limit, search],
    queryFn: async () => {
      const res = await apiRequest<any>("GET", "/grns", undefined, {
        params: { page, limit, search },
      });
      return res; // return full API response
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setGrnResponse(query.data)); // store full response in Redux
    }
  }, [query.data, dispatch]);

  return query;
}

// ✅ Create GRN
export const useCreateGrn = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, GrnCreatePayload>({
    mutationFn: (data: GrnCreatePayload) => apiRequest<any>("POST", "/grns", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["grns"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message, { variant: "error" });
    },
  });
};

// ✅ Fetch Single GRN
export const useSingleGrn = (
  id?: string,
  options?: Omit<UseQueryOptions<GrnType, Error>, "queryKey" | "queryFn">
) => {
  return useQuery<GrnType, Error>({
    queryKey: ["grn", id],
    queryFn: async () => {
      if (!id) {
        throw new Error("Missing grn id");
      }
      const res = await apiRequest<GrnType>("GET", `/grns/${id}`);
      return res;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
    enabled: !!id,
    ...options,
  });
};

// ✅ Update GRN
export const useUpdateGrn = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<GrnCreateResponse, Error, { id: string; data: GrnCreatePayload }>({
    mutationFn: ({ id, data }) => apiRequest<GrnCreateResponse>("PUT", `/grns/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["grns"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message, { variant: "error" });
    },
  });
};

// ✅ Delete GRN
export const useDeleteGrn = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<GrnCreateResponse, Error, { id: string }>({
    mutationFn: ({ id }) => apiRequest<GrnCreateResponse>("DELETE", `/grns/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["grns"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message || "Something went wrong", { variant: "error" });
    },
  });
};
