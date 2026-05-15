import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MessageComposer } from '../features/composer/components/MessageComposer';
import { store } from '../app/store';

// Mock OneDrivePicker
vi.mock('../components/OneDrivePicker', () => ({
    OneDrivePicker: ({ attachedFiles, onFilesSelected, onRemove }: any) => (
        <div data-testid="onedrive-picker">
            <button onClick={() => onFilesSelected([{ id: 'f1', name: 'test.pdf', url: '#', size: 1024 }])}>
                Attach File
            </button>
            {attachedFiles.map((f: any) => (
                <div key={f.id}>
                    {f.name}
                    <button onClick={() => onRemove(f.id)}>Remove</button>
                </div>
            ))}
        </div>
    ),
}));

describe('MessageComposer', () => {
    const mockOnSend = vi.fn();
    const mockOnSchedule = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    const renderWithProviders = (ui: React.ReactElement) => render(
        <Provider store={store}>{ui}</Provider>
    );

    it('renders the composer with subject and importance fields', () => {
        renderWithProviders(<MessageComposer onSend={mockOnSend} />);
        expect(screen.getByPlaceholderText(/Message Subject/i)).toBeInTheDocument();
        expect(screen.getByText('Normal')).toBeInTheDocument();
        expect(screen.getByText(/Send Dispatch/i)).toBeInTheDocument();
    });

    it('shows importance options', () => {
        renderWithProviders(<MessageComposer onSend={mockOnSend} />);
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        fireEvent.change(select, { target: { value: 'high' } });
        expect((select as HTMLSelectElement).value).toBe('high');
    });

    it('disables Send Now button when editor is empty', () => {
        renderWithProviders(<MessageComposer onSend={mockOnSend} />);
        const sendBtn = screen.getByText(/Send Dispatch/i);
        expect(sendBtn).toBeDisabled();
    });

    it('shows schedule button when onSchedule prop is provided', () => {
        renderWithProviders(<MessageComposer onSend={mockOnSend} onSchedule={mockOnSchedule} />);
        // Use a more specific query if needed, but clock button has text "Schedule"
        expect(screen.getByText(/Schedule/i)).toBeInTheDocument();
    });

    it('renders OneDrive picker', () => {
        renderWithProviders(<MessageComposer onSend={mockOnSend} />);
        expect(screen.getByTestId('onedrive-picker')).toBeInTheDocument();
    });

    it('updates subject field on input', () => {
        renderWithProviders(<MessageComposer onSend={mockOnSend} />);
        const subjectInput = screen.getByPlaceholderText(/Message Subject/i) as HTMLInputElement;
        fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
        expect(subjectInput.value).toBe('Test Subject');
    });
});
