import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScheduleMessageForm } from '../features/scheduler/components/ScheduleMessageForm';

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
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
};

describe('ScheduleMessageForm (React Hook Form + Zod)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all form fields', () => {
        renderWithProviders(<ScheduleMessageForm />);
        expect(screen.getByPlaceholderText('Team ID')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Channel ID')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your message...')).toBeInTheDocument();
        expect(screen.getByText('Schedule Message')).toBeInTheDocument();
    });

    it('shows validation errors when submitting empty form', async () => {
        renderWithProviders(<ScheduleMessageForm />);
        fireEvent.click(screen.getByText('Schedule Message'));

        await waitFor(() => {
            expect(screen.getByText('Team is required')).toBeInTheDocument();
        });
    });

    it('shows recurrence end date field when recurrence is not none', async () => {
        renderWithProviders(<ScheduleMessageForm />);
        const recurrenceSelect = screen.getByRole('combobox');
        fireEvent.change(recurrenceSelect, { target: { value: 'weekly' } });

        await waitFor(() => {
            expect(screen.getByText('Series End Date (optional)')).toBeInTheDocument();
        });
    });

    it('hides recurrence end date when recurrence is none', () => {
        renderWithProviders(<ScheduleMessageForm />);
        expect(screen.queryByText('Series End Date (optional)')).not.toBeInTheDocument();
    });

    it('shows timezone field pre-filled', () => {
        renderWithProviders(<ScheduleMessageForm />);
        const timezoneInput = screen.getByDisplayValue(Intl.DateTimeFormat().resolvedOptions().timeZone);
        expect(timezoneInput).toBeInTheDocument();
    });
});
