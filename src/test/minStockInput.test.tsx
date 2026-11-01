import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StockItemRow from '@/components/inventory/StockItem';

const { update, eq } = vi.hoisted(() => ({ update: vi.fn(), eq: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ update }) },
}));
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn() }),
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

function openItem(minQuantity?: number) {
  update.mockReturnValue({ eq });
  eq.mockResolvedValue({ error: null });
  render(<StockItemRow
    item={{ id: 'stock-1', name: 'Deck brush', box: 'Locker', quantity: 5, minQuantity }}
    onUpdateQuantity={vi.fn()} onUpdateQuantityDirect={vi.fn()} onDelete={vi.fn()}
  />);
  fireEvent.click(screen.getByText('Deck brush'));
  return screen.getByLabelText('Minimum stock alert');
}

describe('minimum stock input', () => {
  it('loads the saved threshold before focus and after reopening details', () => {
    expect(openItem(3)).toHaveValue(3);
    fireEvent.click(screen.getByText('Deck brush'));
    fireEvent.click(screen.getByText('Deck brush'));
    expect(screen.getByLabelText('Minimum stock alert')).toHaveValue(3);
    expect(update).not.toHaveBeenCalled();
  });

  it('keeps a newly saved threshold visible after blur', async () => {
    const input = openItem(3);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '4' } });
    fireEvent.blur(input);
    await waitFor(() => expect(update).toHaveBeenCalledWith({ min_quantity: 4 }));
    expect(input).toHaveValue(4);
  });

  it('allows clearing the threshold without restoring the previous value', async () => {
    const input = openItem(3);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    await waitFor(() => expect(update).toHaveBeenCalledWith({ min_quantity: null }));
    expect(input).toHaveValue(null);
  });
});