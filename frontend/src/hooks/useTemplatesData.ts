import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TemplatesService } from "../api/services/templates.service";
import type { MessageTemplate } from "../api/services/templates.service";

export const useTemplates = () => {
  return useQuery({
    queryKey: ["templates"],
    queryFn: TemplatesService.list
  });
};

export const useSaveTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (template: Partial<MessageTemplate>) => TemplatesService.save(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    }
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, template }: { id: string, template: Partial<MessageTemplate> }) => 
      TemplatesService.update(id, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    }
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TemplatesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    }
  });
};
