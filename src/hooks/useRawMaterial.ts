import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RawMaterialCreateResponse, RawMaterialType, RawMaterialsApiResponse } from "@/types/rawMaterial";
import { useToast } from "./useNoistackToast";
import { useDispatch } from "react-redux";
import { setRawMaterialResponse } from "@/store/manufacturingCollection";
import { useEffect } from "react";

export function useRawMaterials() {
  const dispatch = useDispatch();

  const query = useQuery<RawMaterialsApiResponse, Error>({
    queryKey: ["raw-materials"],
    queryFn: async () => {
      const res = await apiRequest<RawMaterialsApiResponse>("GET", "/raw-material", undefined, {
        params: { page: 1, limit: 10 },
      });
      return res; // return full API response
    },
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
      apiRequest<RawMaterialCreateResponse>("POST", "/raw-material", data, { withCredentials: false }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      toast(res.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error.message, { variant: "error" });
    },
  });
};
