import { useQuery } from "@tanstack/react-query";
import { AnalyticsService } from "../api/services/analytics.service";

export const useSummaryStats = () => {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: AnalyticsService.getSummary
  });
};

export const useAnalyticsStats = () => {
  return useQuery({
    queryKey: ["analytics", "stats"],
    queryFn: AnalyticsService.getStats
  });
};

export const useAnalyticsFailures = () => {
  return useQuery({
    queryKey: ["analytics", "failures"],
    queryFn: AnalyticsService.getFailures
  });
};

export const useAuditLogs = (limit = 10, skip = 0) => {
  return useQuery({
    queryKey: ["analytics", "logs", limit, skip],
    queryFn: () => AnalyticsService.getAuditLogs(limit, skip)
  });
};

export const useRetryMessage = () => {
  return {
    mutate: async (messageId: string) => {
      return AnalyticsService.retryMessage(messageId);
    }
  };
};
