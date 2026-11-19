import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StockTakeMode from '@/components/inventory/StockTakeMode';

const { rpc, insert } = vi.hoisted(() => ({ rpc: vi.fn(), insert: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc, from: () => ({ insert }) } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const items = [
  { id: 'a', name: 'Rope', box: 'A locker', quantity: 5 },
  { id: 'b', name: 'Gloves', box: 'B locker', quantity: 4 },
];

describe('locker status and targeted counting', () => {
  it('jumps to the selected box without losing previously entered counts', async () => {
    rpc.mockResolvedValue({ data: [
      { box: 'A locker', finished_at: null, counted_by_username: null },
      { box: 'B locker', finished_at: '2026-11-19T06:25:00Z', counted_by_username: 'John Smith' },
    ] });
    render(<StockTakeMode open onOpenChange={vi.fn()} items={items} onSetQuantity={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Counted Rope'), { target: { value: '3' } });
    fireEvent.click(screen.getByLabelText('Confirm Rope count'));
    fireEvent.click(screen.getByRole('button', { name: 'Locker status' }));
    await screen.findByText('By John Smith');
    expect(rpc).toHaveBeenCalledWith('locker_count_status');
    fireEvent.click(screen.getAllByRole('button', { name: 'Count this box' })[1]);
    expect(screen.getByLabelText('Counted Gloves')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous box' }));
    expect(screen.getByLabelText('Counted Rope')).toHaveValue(3);
  });

  it('saves counted item IDs for server validation and does not include uncounted items', async () => {
    insert.mockImplementation(payload => ({ select: () => ({ single: async () => ({ data: {
      id: 'take', started_at: payload.started_at, finished_at: payload.finished_at,
      counted_by_username: 'John Smith', lines: payload.lines,
    } }) }) }));
    render(<StockTakeMode open onOpenChange={vi.fn()} items={items} onSetQuantity={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Confirm Rope count'));
    fireEvent.click(screen.getByRole('button', { name: 'Finish now' }));
    await waitFor(() => expect(insert).toHaveBeenCalled());
    expect(insert.mock.calls[0][0].lines).toEqual([{ itemId: 'a', name: 'Rope', box: 'A locker', expected: 5, counted: 5 }]);
  });

  it('can retry a failed status request instead of presenting unchecked boxes', async () => {
    rpc.mockResolvedValueOnce({ error: { message: 'Unavailable' } }).mockResolvedValueOnce({ data: [] });
    render(<StockTakeMode open onOpenChange={vi.fn()} items={items} onSetQuantity={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Locker status' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    await screen.findByText('No boxes added yet.');
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});