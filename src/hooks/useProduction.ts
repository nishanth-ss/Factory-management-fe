import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./useNoistackToast";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { setProductionResponse } from "@/store/manufacturingCollection";
import type { ProductionApiResponse, ProductionCreateResponse, ProductionType } from "@/types/productionTypes";
import type { AxiosResponse } from "axios";

// 🔹 Fetch production records
export function useProductions(params: { page?: number; limit?: number; search?: string }) {
  const dispatch = useDispatch();

  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const search = params.search ?? "";

  const query = useQuery<ProductionApiResponse, Error>({
    queryKey: ["productions", page, limit, search],
    queryFn: async () => {
      const res = await apiRequest<ProductionApiResponse>(
        "GET",
        "/production",
        undefined,
        { params: { page, limit, search } }
      );
      return res;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setProductionResponse(query.data));
    }
  }, [query.data, dispatch]);

  return query;
}

// 🔹 Create production record
export const useCreateProduction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ProductionCreateResponse, Error, ProductionType>({
    mutationFn: (data: ProductionType) =>
      apiRequest<ProductionCreateResponse>("POST", "/production", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["productions"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message, { variant: "error" });
    },
  });
};

// 🔹 Update production record
export const useUpdateProduction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ProductionCreateResponse, Error, { id: string; data: ProductionType }>({
    mutationFn: ({ id, data }) =>
      apiRequest<ProductionCreateResponse>("PUT", `/production/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["productions"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message, { variant: "error" });
    },
  });
};


// get production batch
export const GetALLProductionBatch = () => {
  return useQuery<AxiosResponse, Error>({
    queryKey: ["production-batch"],
    queryFn: () =>
      apiRequest<AxiosResponse>("GET", `/production/batch`),
  });
};
