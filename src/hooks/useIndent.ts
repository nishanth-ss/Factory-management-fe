import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { IndentsApiResponse, IndentType } from "@/types/indent";
import { useToast } from "./useNoistackToast";
import { setIndentResponse } from "@/store/manufacturingCollection";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export const useIndents = (params?: { page?: number; limit?: number; search?: string }) => {
  const dispatch = useDispatch();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const search = params?.search ?? "";

  const query = useQuery<IndentsApiResponse>({
    queryKey: ["indents", page, limit, search],
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit), search }).toString();
      const res = await apiRequest<IndentsApiResponse>("GET", `/indent?${qs}`);
      return res; // return the full API response, not just the array
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
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

export const useGetIndentById = (id: string) => {
  return useQuery({
    queryKey: ["indent", id],
    queryFn: async () => {
      if (!id) {
        return null;
      }
      const res = await apiRequest<IndentType>("GET", `/indent/${id}`);
      return res;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !!id,
    staleTime: 10_000,
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
