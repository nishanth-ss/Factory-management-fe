import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./useNoistackToast";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { setRawMaterialBatchResponse } from "@/store/manufacturingCollection";
import type { RawMaterialBatchApiResponse, RawMaterialBatchCreateResponse, RawMaterialBatchType } from "@/types/rawmaterialBatch";

// 🔹 Fetch batches
export function useRawMaterialBatches(params: { page?: number; limit?: number | string; search?: string }) {
  const dispatch = useDispatch();

  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const search = params.search ?? "";

  const query = useQuery<RawMaterialBatchApiResponse, Error>({
    queryKey: ["batches", page, limit, search],
    queryFn: async () => {
      const res = await apiRequest<RawMaterialBatchApiResponse>(
        "GET",
        "batch",
        undefined,
        {
          params: { page, limit, search },
        }
      );
      return res; // return full API response
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setRawMaterialBatchResponse(query.data)); // store full response in Redux
    }
  }, [query.data, dispatch]);

  return query;
}

// 🔹 Create batch
export const useCreateBatch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<RawMaterialBatchCreateResponse, Error, any>({
    mutationFn: (data: any) =>
      apiRequest<RawMaterialBatchCreateResponse>(
        "POST",
        "batch",
        data
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message, { variant: "error" });
    },
  });
};

// 🔹 Update batch
export const useUpdateBatch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    RawMaterialBatchCreateResponse,
    Error,
    { id: string; data: RawMaterialBatchType }
  >({
    mutationFn: ({ id, data }) =>
      apiRequest<RawMaterialBatchCreateResponse>(
        "PUT",
        `batch/${id}`,
        data
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message, { variant: "error" });
    },
  });
};
