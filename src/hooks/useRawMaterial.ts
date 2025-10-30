import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RawMaterialCreateResponse, RawMaterialType, RawMaterialsApiResponse } from "@/types/rawMaterial";
import { useToast } from "./useNoistackToast";
import { useDispatch } from "react-redux";
import { setRawMaterialResponse } from "@/store/manufacturingCollection";
import { useEffect } from "react";

export function useRawMaterials(params: { page?: number; limit?: number | string; search?: string; unit_id?: string }) {
  const dispatch = useDispatch();

  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const search = params.search ?? "";
  const unit_id = params.unit_id ?? "";

  const query = useQuery<RawMaterialsApiResponse, Error>({
    queryKey: ["raw-materials", page, limit, search, unit_id],
    queryFn: async () => {
      const res = await apiRequest<RawMaterialsApiResponse>("GET", `${unit_id ? `/unit/raw-materials` : "/raw-material"}`, undefined, {
        params: { page, limit, search, unit_id },
      });
      return res; // return full API response
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setRawMaterialResponse(query.data)); // store full response in Redux
    }
  }, [query.data, dispatch]);

  return query;
}

export const useCreateRawMaterial = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<RawMaterialCreateResponse, Error, RawMaterialType>({
    mutationFn: (data: RawMaterialType) =>
      apiRequest<RawMaterialCreateResponse>("POST", "/raw-material", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message, { variant: "error" });
    },
  });
};

export const useUpdateRawMaterial = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<RawMaterialCreateResponse, Error, { id: string; data: RawMaterialType }>({
    mutationFn: ({ id, data }) =>
      apiRequest<RawMaterialCreateResponse>("PUT", `/raw-material/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message, { variant: "error" });
    },
  });
};

export const useRawMaterialHistory = (id: string) => {

  const { data, error, ...rest } = useQuery({
    queryKey: ['rawMaterialHistory', id],
    queryFn: () => 
      apiRequest<any>("GET", `/logs/raw-materials?raw_material_id=${id}`)
  });

  return { data, error, ...rest };
};

