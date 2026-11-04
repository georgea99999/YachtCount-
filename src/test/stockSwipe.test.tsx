import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MobileSwipeActions from '@/components/inventory/MobileSwipeActions';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => true }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function setup(canDelete = true) {
  class Pointer extends MouseEvent {
    readonly isPrimary = true;
    readonly pointerId = 1;
  }
  vi.stubGlobal('PointerEvent', Pointer);
  const edit = vi.fn();
  const remove = vi.fn();
  const open = vi.fn();
  render(<MobileSwipeActions itemName="Deck brush" canDelete={canDelete} onEdit={edit} onDelete={remove}>
    <div onClick={open}>Deck brush</div>
  </MobileSwipeActions>);
  const title = screen.getByText('Deck brush');
  const surface = title.parentElement;
  if (!surface) throw new Error('Swipe surface missing');
  surface.setPointerCapture = vi.fn();
  surface.hasPointerCapture = () => false;
  const swipe = (x: number, y = 0) => {
    fireEvent.pointerDown(title, { clientX: 200, clientY: 50, button: 0 });
    fireEvent.pointerMove(surface, { clientX: 200 + x, clientY: 50 + y });
    fireEvent.pointerUp(surface);
  };
  return { title, edit, remove, open, swipe };
}

describe('mobile stock swipe actions', () => {
  it('reveals edit without opening details and reuses the edit callback', () => {
    const { title, swipe, edit, open } = setup();
    swipe(-100);
    fireEvent.click(title); // Browser-generated click after a touch release.
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Deck brush' }));
    expect(edit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Edit Deck brush' })).not.toBeInTheDocument();
  });

  it('only permits the existing delete action for members with deletion permission', () => {
    const { swipe, remove } = setup();
    swipe(-100);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Deck brush' }));
    expect(remove).toHaveBeenCalledTimes(1);
    cleanup();
    const crew = setup(false);
    crew.swipe(-60);
    expect(screen.queryByRole('button', { name: 'Delete Deck brush' })).not.toBeInTheDocument();
    expect(crew.remove).not.toHaveBeenCalled();
  });

  it('does not open swipe actions while scrolling vertically', () => {
    const { swipe } = setup();
    swipe(-10, 80);
    expect(screen.queryByRole('button', { name: 'Edit Deck brush' })).not.toBeInTheDocument();
  });
});