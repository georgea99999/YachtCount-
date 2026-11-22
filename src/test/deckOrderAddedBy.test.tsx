import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeckOrderList from '@/components/deckorder/DeckOrderList';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [] }) }) }) }),
    }),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const item = {
  id: 7,
  productName: 'No slip deck paint',
  quantity: '1',
  colour: 'Clear',
  size: '500ml',
  link: '',
  addedBy: 'John Smith',
};

function renderList(overrides: Partial<typeof item> = {}) {
  return render(
    <DeckOrderList
      items={[{ ...item, ...overrides }]}
      onAddItem={vi.fn()}
      onUpdateItem={vi.fn()}
      onDeleteItem={vi.fn()}
      onClearAll={vi.fn()}
    />,
  );
}

function openEditor(overrides: Partial<typeof item> = {}) {
  renderList(overrides);
  fireEvent.click(screen.getByText('No slip deck paint'));
}

describe('deck order added-by attribution', () => {
  it('opens a supplier link separately from the item editor', () => {
    renderList({ link: 'https://example.com/paint' });
    const link = screen.getByRole('link', { name: 'Open supplier link for No slip deck paint' });
    expect(link).toHaveAttribute('href', 'https://example.com/paint');
    expect(link).toHaveAttribute('target', '_blank');
    fireEvent.click(link);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('No slip deck paint'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not expose unsafe supplier links', () => {
    renderList({ link: 'javascript:alert(1)' });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('supports supplier addresses without a protocol', () => {
    renderList({ link: 'example.com/paint' });
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/paint');
  });

  it('names the crew member who added the item when editing', () => {
    openEditor();
    expect(screen.getByText('Added by John Smith')).toBeInTheDocument();
  });

  it('says Not recorded when the item has no stored author', () => {
    openEditor({ addedBy: null });
    expect(screen.getByText('Added by Not recorded')).toBeInTheDocument();
  });

  it('hides the attribution while adding a brand new item', () => {
    render(
      <DeckOrderList
        items={[item]}
        onAddItem={vi.fn()}
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add item to deck order' }));
    expect(screen.queryByText(/Added by/)).not.toBeInTheDocument();
  });
});
