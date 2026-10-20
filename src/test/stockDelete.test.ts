import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useInventory } from '@/hooks/useInventory';

const state = vi.hoisted(() => ({ owner: false }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    let deleting = false;
    const builder = {
      select: () => builder,
      order: () => builder,
      eq: () => builder,
      delete: () => { deleting = true; return builder; },
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null, data: table === 'stock_items'
        ? deleting ? state.owner ? [{ id: 'item-1' }] : [] : [{ id: 'item-1', name: 'Mooring line', quantity: 4, box: 'Deck locker' }]
        : [] }).then(resolve),
    };
    return builder;
  },
  channel: () => {
    const channel = { on: () => channel, subscribe: () => channel };
    return channel;
  },
  removeChannel: vi.fn(),
} }));

beforeEach(() => { state.owner = false; localStorage.clear(); });

it('keeps stock and creates no deletion notification when crew deletion is denied', async () => {
  const { result } = renderHook(() => useInventory('vessel-1'));
  await waitFor(() => expect(result.current.stockItems).toHaveLength(1));
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  await act(async () => { await result.current.deleteStockItem('item-1'); });
  expect(result.current.stockItems).toHaveLength(1);
  expect(result.current.deletedItems).toHaveLength(0);
  expect(result.current.notifications).toHaveLength(0);
  log.mockRestore();
});

it('removes stock and preserves undo data after an authorized admin deletion', async () => {
  state.owner = true;
  const { result } = renderHook(() => useInventory('vessel-1'));
  await waitFor(() => expect(result.current.stockItems).toHaveLength(1));
  await act(async () => { await result.current.deleteStockItem('item-1'); });
  expect(result.current.stockItems).toHaveLength(0);
  expect(result.current.deletedItems[0].item).toMatchObject({ name: 'Mooring line', quantity: 4 });
  expect(result.current.notifications[0].type).toBe('deleted');
});