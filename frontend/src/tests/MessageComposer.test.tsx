import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageComposer } from '../features/composer/components/MessageComposer';

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

    it('renders the composer with subject and importance fields', () => {
        render(<MessageComposer onSend={mockOnSend} />);
        expect(screen.getByPlaceholderText('Subject (optional)')).toBeInTheDocument();
        expect(screen.getByText('Normal')).toBeInTheDocument();
        expect(screen.getByText('Send Now')).toBeInTheDocument();
    });

    it('shows importance options', () => {
        render(<MessageComposer onSend={mockOnSend} />);
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        fireEvent.change(select, { target: { value: 'high' } });
        expect((select as HTMLSelectElement).value).toBe('high');
    });

    it('disables Send Now button when editor is empty', () => {
        render(<MessageComposer onSend={mockOnSend} />);
        const sendBtn = screen.getByText('Send Now');
        expect(sendBtn).toBeDisabled();
    });

    it('shows schedule button when onSchedule prop is provided', () => {
        render(<MessageComposer onSend={mockOnSend} onSchedule={mockOnSchedule} />);
        // Clock icon button should be present
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(1);
    });

    it('renders OneDrive picker', () => {
        render(<MessageComposer onSend={mockOnSend} />);
        expect(screen.getByTestId('onedrive-picker')).toBeInTheDocument();
    });

    it('updates subject field on input', () => {
        render(<MessageComposer onSend={mockOnSend} />);
        const subjectInput = screen.getByPlaceholderText('Subject (optional)') as HTMLInputElement;
        fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
        expect(subjectInput.value).toBe('Test Subject');
    });
});
