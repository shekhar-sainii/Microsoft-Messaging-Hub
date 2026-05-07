import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
    activeTab: string;
    selectedChannel: { teamId: string; channelId: string } | null;
    sidebarOpen: boolean;
}

const initialState: UiState = {
    activeTab: 'dashboard',
    selectedChannel: null,
    sidebarOpen: true,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setActiveTab(state, action: PayloadAction<string>) {
            state.activeTab = action.payload;
        },
        setSelectedChannel(state, action: PayloadAction<{ teamId: string; channelId: string } | null>) {
            state.selectedChannel = action.payload;
        },
        toggleSidebar(state) {
            state.sidebarOpen = !state.sidebarOpen;
        },
    },
});

export const { setActiveTab, setSelectedChannel, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
