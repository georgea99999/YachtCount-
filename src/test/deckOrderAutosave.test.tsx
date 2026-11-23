import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeckOrderList from '@/components/deckorder/DeckOrderList';

vi.mock('@/components/Attachments', () => ({ default: () => null }));
afterEach(cleanup);
const item = { id: 7, productName: 'Deck paint', quantity: '1', colour: '', size: '', link: '' };
function setup() {
  const update = vi.fn().mockResolvedValue(true);
  const add = vi.fn();
  render(<DeckOrderList items={[item]} onUpdateItem={update} onAddItem={add} onDeleteItem={vi.fn()} onClearAll={vi.fn()} />);
  return { update, add };
}

describe('Deck Order autosave', () => {
  it('saves edited fields when the cross closes the editor', async () => {
    const { update } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Open Deck paint' }));
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10 packs' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith(7, { productName: 'Deck paint', quantity: '10 packs', colour: '', size: '', link: '' }));
  });

  it('keeps a previous product name when blanked while saving colour on blur', async () => {
    const { update } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Open Deck paint' }));
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: '' } });
    const colour = screen.getByLabelText('Colour');
    fireEvent.change(colour, { target: { value: 'White' } });
    fireEvent.blur(colour);
    await waitFor(() => expect(update).toHaveBeenCalledWith(7, { productName: 'Deck paint', quantity: '1', colour: 'White', size: '', link: '' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not create an item until Add to Order is pressed', () => {
    const { add } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Add item to deck order' }));
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Brush' } });
    fireEvent.blur(screen.getByLabelText('Product Name'));
    expect(add).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Add to Order' }));
    expect(add).toHaveBeenCalledWith({ productName: 'Brush', quantity: '1', colour: '', size: '', link: '' });
  });
});