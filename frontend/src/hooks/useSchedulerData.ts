import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SchedulerService } from "../api/services/scheduler.service";
import type { SchedulePayload } from "../api/services/scheduler.service";

export const useScheduledMessages = () => {
  return useQuery({
    queryKey: ["scheduler"],
    queryFn: SchedulerService.list
  });
};

export const useScheduleMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SchedulePayload) => SchedulerService.schedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    }
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: Partial<SchedulePayload> }) => 
      SchedulerService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    }
  });
};

export const useCancelSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cancelSeries = false }: { id: string; cancelSeries?: boolean }) =>
      SchedulerService.cancel(id, cancelSeries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    }
  });
};
