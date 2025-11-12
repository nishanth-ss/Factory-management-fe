import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./useNoistackToast";
import type { ManufactureArticleCreatePayload, ManufactureArticleCreateResponse, ManufactureArticleType } from "@/types/manufactureArticles";


// ✅ Fetch All Manufacture Articles
export function useManufactureArticles(params: { page?: number; limit?: number | string; search?: string }) {

  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const search = params.search ?? "";

  const query = useQuery<any, Error>({
    queryKey: ["manufacture-articles", page, limit, search],
    queryFn: async () => {
      const res = await apiRequest<any>(
        "GET",
        "/manufacture-articles",
        undefined,
        { params: { page, limit, search } }
      );
      return res;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
  });

  return query;
}

// ✅ Create Manufacture Article
export const useCreateManufactureArticle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ManufactureArticleCreateResponse, Error, ManufactureArticleCreatePayload>({
    mutationFn: (data) => apiRequest("POST", "/manufacture-articles", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["manufacture-articles"] });
      toast(res.message ?? "Article created successfully", { variant: "success" });
    },
    onError: (error) => {
      toast(error.message ?? "Error creating article", { variant: "error" });
    },
  });
};

// Response type for single manufacture article
interface ManufactureArticleResponse {
  data: ManufactureArticleType;
}

// ✅ Fetch Single Manufacture Article
export const useSingleManufactureArticle = (
  id?: string,
  options?: Omit<UseQueryOptions<ManufactureArticleResponse, Error>, "queryKey" | "queryFn">
) => {
  return useQuery<ManufactureArticleResponse, Error>({
    queryKey: ["manufacture-article", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing article id");
      return await apiRequest<ManufactureArticleResponse>("GET", `/manufacture-articles/${id}`);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
    ...options,
  });
};

// ✅ Update Manufacture Article
export const useUpdateManufactureArticle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ManufactureArticleCreateResponse, Error, { id: string; data: ManufactureArticleCreatePayload }>({
    mutationFn: ({ id, data }) => apiRequest("PUT", `/manufacture-articles/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["manufacture-articles"] });
      toast(res.message ?? "Article updated successfully", { variant: "success" });
    },
    onError: (error) => {
      toast(error.message ?? "Error updating article", { variant: "error" });
    },
  });
};

// ✅ Delete Manufacture Article
export const useDeleteManufactureArticle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ManufactureArticleCreateResponse, Error, { id: string }>({
    mutationFn: ({ id }) => apiRequest("DELETE", `/manufacture-articles/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["manufacture-articles"] });
      toast(res.message ?? "Article deleted successfully", { variant: "success" });
    },
    onError: (error) => {
      toast(error.message ?? "Error deleting article", { variant: "error" });
    },
  });
};
