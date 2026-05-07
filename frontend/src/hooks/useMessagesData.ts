import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessagesService } from "../api/services/messages.service";
import type { SendMessagePayload, ReplyPayload } from "../api/services/messages.service";

export const useMessagesHistory = (limit = 50, skip = 0) => {
  return useQuery({
    queryKey: ["messages", "history", limit, skip],
    queryFn: () => MessagesService.getSentHistory(limit, skip)
  });
};

export const useSearchMessages = (query: string) => {
  return useQuery({
    queryKey: ["messages", "search", query],
    queryFn: () => MessagesService.search(query),
    enabled: query.length > 2
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => MessagesService.send(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "history"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "stats"] });
    }
  });
};

export const useReplyMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReplyPayload) => MessagesService.reply(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "history"] });
    }
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, channelId, msgId }: { teamId: string, channelId: string, msgId: string }) => 
      MessagesService.delete(teamId, channelId, msgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "history"] });
    }
  });
};
