import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// ✅ Fetch expenditures with pagination
export function useExpenditures({ page, limit, category,type,search }: { page: number; limit: number; category: string; type: string; search: string }) {
  const query = useQuery<any, Error>({
    queryKey: ["expenditures", page, limit, category,type,search], // 👈 include page + limit here
    queryFn: async () => {
      const res = await apiRequest<any>(
        "GET",
        `/expenditure?page=${page}&limit=${limit}&category=${category}&type=${type}&search=${search}`
      );
      return res;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
  });

  return query;
}
