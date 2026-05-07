import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WebhooksService } from "../api/services/webhooks.service";

export const useWebhooks = () => {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: WebhooksService.list
  });
};

export const useCreateWebhook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: WebhooksService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    }
  });
};

export const useDeleteWebhook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WebhooksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    }
  });
};
