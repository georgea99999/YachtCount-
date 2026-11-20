import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StockItemRow from '@/components/inventory/StockItem';

const { update, eq } = vi.hoisted(() => ({ update: vi.fn(), eq: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ update }) } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function setup(canDelete = true) {
  update.mockReturnValue({ eq });
  eq.mockResolvedValue({ error: null });
  const edit = vi.fn();
  const remove = vi.fn();
  render(<StockItemRow item={{ id: 'stock-1', name: 'Deck brush', box: 'Locker', quantity: 5, minQuantity: 3 }}
    onUpdateQuantity={vi.fn()} onUpdateQuantityDirect={vi.fn()} onDelete={remove} onEditItem={edit} canDelete={canDelete} allBoxNames={['Locker']}
    usageHistory={[{ itemName: 'Deck brush', box: 'Locker', quantity: 2, date: '2026-11-12T09:00:00Z', actorUsername: 'John Smith' }]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Manage Deck brush' }));
  return { edit, remove };
}

describe('desktop product details', () => {
  it('saves brand and size separately from the product name', async () => {
    const { edit } = setup();
    fireEvent.change(screen.getByLabelText('Brand'), { target: { value: 'Flitz' } });
    fireEvent.change(screen.getByLabelText('Size / Unit'), { target: { value: '500ml' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(edit).toHaveBeenCalledWith('stock-1', { name: 'Deck brush', box: 'Locker', brand: 'Flitz', size: '500ml' }));
  });
  it('saves edited product details and minimum through the existing paths', async () => {
    const { edit } = setup();
    fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'Soft deck brush' } });
    fireEvent.change(screen.getByLabelText('Minimum stock alert'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(edit).toHaveBeenCalledWith('stock-1', { name: 'Soft deck brush', box: 'Locker' }));
    expect(update).toHaveBeenCalledWith({ min_quantity: 4 });
    expect(eq).toHaveBeenCalledWith('id', 'stock-1');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('discards unsaved edits on cancellation', () => {
    const { edit } = setup();
    fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'Unsaved brush' } });
    fireEvent.change(screen.getByLabelText('Minimum stock alert'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(edit).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Manage Deck brush' }));
    expect(screen.getByLabelText('Product name')).toHaveValue('Deck brush');
    expect(screen.getByLabelText('Minimum stock alert')).toHaveValue(3);
  });

  it('collapses long quantity history behind a chevron toggle', async () => {
    update.mockReturnValue({ eq });
    eq.mockResolvedValue({ error: null });
    const usageHistory = [0, 1, 2, 3, 4].map(i => ({
      itemName: 'Deck brush', box: 'Locker', quantity: 1,
      date: `2026-11-12T09:0${i}:00Z`, actorUsername: 'John Smith',
    }));
    render(<StockItemRow item={{ id: 'stock-1', name: 'Deck brush', box: 'Locker', quantity: 5, minQuantity: 3 }}
      onUpdateQuantity={vi.fn()} onUpdateQuantityDirect={vi.fn()} onDelete={vi.fn()} onEditItem={vi.fn()} canDelete allBoxNames={['Locker']}
      usageHistory={usageHistory} />);
    fireEvent.click(screen.getByRole('button', { name: 'Manage Deck brush' }));
    expect(screen.getAllByText('John Smith')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show all quantity changes (2 more)' }));
    expect(screen.getAllByText('John Smith')).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'Show fewer quantity changes' }));
    expect(screen.getAllByText('John Smith')).toHaveLength(3);
  });

  it('only exposes deletion for crew with existing deletion permission', () => {
    const { remove } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Item' }));
    expect(remove).toHaveBeenCalledWith('stock-1');
    cleanup();
    const crew = setup(false);
    expect(screen.queryByRole('button', { name: 'Delete Item' })).not.toBeInTheDocument();
    expect(crew.remove).not.toHaveBeenCalled();
  });
});