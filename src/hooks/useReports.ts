import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useReports = () => {
  return useQuery<any, Error>({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await apiRequest("GET", "expenditure/report");
      return res; // Return full API response
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
  });
};

export const useReportQuery = () => {
    const queryClient = useQueryClient();
  
    const fetchReport = async (reportName: string, dateRange: string) => {
      return queryClient.fetchQuery({
        queryKey: ["report", reportName],
        queryFn: () => apiRequest("GET", `expenditure/${reportName}?filter=${dateRange}`),
        staleTime: 10_000,
      });
    };
  
    return { fetchReport };
  };