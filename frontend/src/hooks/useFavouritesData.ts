import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FavouriteService, FavouriteChannel } from "../api/services/favourite.service";
import toast from "react-hot-toast";

export const useFavourites = () => {
  return useQuery({
    queryKey: ["favourites"],
    queryFn: FavouriteService.getFavourites,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useAddFavourite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FavouriteChannel) => FavouriteService.addFavourite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      toast.success("Added to favourites");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to add favourite");
    }
  });
};

export const useRemoveFavourite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => FavouriteService.removeFavourite(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      toast.success("Removed from favourites");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to remove favourite");
    }
  });
};
