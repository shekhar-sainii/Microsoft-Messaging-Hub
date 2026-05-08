import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/apiClient";

/**
 * useTeamsData hooks
 * All requests go through apiClient which automatically:
 * - Sends the httpOnly session cookie (withCredentials: true)
 * - Attaches X-CSRF-Token header
 * No manual token handling needed.
 */

export const useInitialData = () => {
    return useQuery({
        queryKey: ["initial-data"],
        queryFn: async () => {
            const response = await apiClient.get("/teams/initial");
            return response.data;
        }
    });
};

export const useTeams = () => {
    return useQuery({
        queryKey: ["teams"],
        queryFn: async () => {
            const response = await apiClient.get("/teams");
            return response.data.value || response.data;
        },
        staleTime: 1000 * 60 * 5,
        retry: false, // Don't retry on failure — prevents hammering the backend
    });
};

export const useChannels = (teamId: string | null) => {
    return useQuery({
        queryKey: ["channels", teamId],
        queryFn: async () => {
            if (!teamId) return [];
            const response = await apiClient.get(`/teams/${teamId}/channels`);
            return response.data.value || response.data;
        },
        enabled: !!teamId,
        staleTime: 1000 * 60 * 5,
        retry: false,
    });
};

export const useTeamPhoto = (teamId: string) => {
    return useQuery({
        queryKey: ["team-photo", teamId],
        queryFn: async () => {
            const response = await apiClient.get(`/teams/${teamId}/photo`);
            return response.data.photo;
        },
        enabled: !!teamId,
    });
};

export const useTeamMembers = (teamId: string | null) => {
    return useQuery({
        queryKey: ["team-members", teamId],
        queryFn: async () => {
            if (!teamId) return [];
            const response = await apiClient.get(`/teams/${teamId}/members`);
            return response.data.value || response.data;
        },
        enabled: !!teamId,
        staleTime: 1000 * 60 * 10, // Members don't change often
    });
};
