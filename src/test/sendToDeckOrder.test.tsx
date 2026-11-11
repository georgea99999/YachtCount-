import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SendToDeckOrderDialog from '@/components/inventory/SendToDeckOrderDialog';

describe('Stock Take to Deck Order names', () => {
  it('sends the edited name without renaming the stock product', () => {
    const item = { id: 'tape', name: '3M Blue Tape 1 Inch', quantity: 16, box: 'BOX BS1' };
    const onConfirm = vi.fn();
    render(<SendToDeckOrderDialog open onOpenChange={vi.fn()} item={item} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: '3M Blue Tape 1 Inch — 10 pack' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add to Deck Order' }));
    expect(onConfirm).toHaveBeenCalledWith({ productName: '3M Blue Tape 1 Inch — 10 pack', quantity: '1', colour: '', size: '', link: '' });
    expect(item.name).toBe('3M Blue Tape 1 Inch');
  });

  it('uses the original name again when reopening after cancelling', () => {
    const item = { id: 'tape', name: '3M Blue Tape 1 Inch', quantity: 16, box: 'BOX BS1' };
    const props = { onOpenChange: vi.fn(), item, onConfirm: vi.fn() };
    const { rerender } = render(<SendToDeckOrderDialog {...props} open />);
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Cancelled rename' } });
    rerender(<SendToDeckOrderDialog {...props} open={false} />);
    rerender(<SendToDeckOrderDialog {...props} open />);
    fireEvent.click(screen.getByRole('button', { name: 'Add to Deck Order' }));
    expect(props.onConfirm).toHaveBeenCalledWith(expect.objectContaining({ productName: '3M Blue Tape 1 Inch' }));
  });
});