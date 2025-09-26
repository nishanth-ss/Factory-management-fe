import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { IndentsApiResponse, IndentType } from "@/types/indent";
import { useToast } from "./useNoistackToast";
import { setIndentResponse } from "@/store/manufacturingCollection";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export const useIndents = (params?: { page?: number; limit?: number }) => {
  const dispatch = useDispatch();

  const query = useQuery<IndentsApiResponse>({
    queryKey: ["indents"],
    queryFn: async () => {
      const queryString = params ? new URLSearchParams(params as any).toString() : "";
      const res = await apiRequest<IndentsApiResponse>("GET", `/indent?${queryString}`);
      return res; // return the full API response, not just the array
    },
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setIndentResponse(query.data)); // store full response in Redux
    }
  }, [query.data, dispatch]);

  return query;
};

export const useCreateIndent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: IndentType) => apiRequest<IndentsApiResponse>("POST", "/indent", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["indents"] });
      toast(res?.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error?.message, { variant: "error" });
    },
  });
};

export const useUpdateIndent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: { id: string; status: string }) => apiRequest<IndentsApiResponse>("PUT", `/indent/${data.id}`, { status: data.status }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["indents"] });
      toast(res?.message, { variant: "success" });
    },
    onError: (error) => {
      toast(error?.message, { variant: "error" });
    },
  });
};
