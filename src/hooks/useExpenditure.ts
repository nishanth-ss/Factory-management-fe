import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// ✅ Fetch GRNs
export function useExpenditures() {

  const query = useQuery<any, Error>({
    queryKey: ["expenditures"],
    queryFn: async () => {
      const res = await apiRequest<any>("GET", "/expenditure");
      return res; // return full API response
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
  });

  return query;
}