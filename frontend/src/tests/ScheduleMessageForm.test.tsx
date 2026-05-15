import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { ScheduleMessageForm } from '../features/scheduler/components/ScheduleMessageForm';
import { store } from '../app/store';

// Mock apiClient
vi.mock('../api/apiClient', () => ({
    apiClient: {
        post: vi.fn().mockResolvedValue({ data: { _id: 'sched-1' } }),
    },
}));

const renderWithProviders = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
        </Provider>
    );
};

describe('ScheduleMessageForm (React Hook Form + Zod)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all form fields', () => {
        renderWithProviders(<ScheduleMessageForm />);
        expect(screen.getByText('Target Organization')).toBeInTheDocument();
        expect(screen.getByText('Target Channel')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type initial mission dispatch template or plain message...')).toBeInTheDocument();
        expect(screen.getByText(/Engage Schedule Relay/i)).toBeInTheDocument();
    });

    it('shows validation errors when submitting empty form', async () => {
        renderWithProviders(<ScheduleMessageForm />);
        fireEvent.click(screen.getByText(/Engage Schedule Relay/i));

        await waitFor(() => {
            expect(screen.getByText('Team ID is required')).toBeInTheDocument();
        });
    });

    it('shows recurrence end date field when recurrence is not none', async () => {
        renderWithProviders(<ScheduleMessageForm />);
        const recurrenceSelect = screen.getAllByRole('combobox')[2];
        fireEvent.change(recurrenceSelect, { target: { value: 'weekly' } });

        await waitFor(() => {
            expect(screen.getByText('Series Terminus Window (Optional)')).toBeInTheDocument();
        });
    });

    it('hides recurrence end date when recurrence is none', () => {
        renderWithProviders(<ScheduleMessageForm />);
        expect(screen.queryByText('Series Terminus Window (Optional)')).not.toBeInTheDocument();
    });

    it('shows timezone field pre-filled', () => {
        renderWithProviders(<ScheduleMessageForm />);
        expect(screen.getByText(Intl.DateTimeFormat().resolvedOptions().timeZone)).toBeInTheDocument();
    });
});
