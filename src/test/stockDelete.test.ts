import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useInventory } from '@/hooks/useInventory';

type TestStockItem = {
  id: string;
  name: string;
  quantity: number;
  box: string;
  min_quantity: number | null;
  sort_order: number;
  user_id?: string;
};

const state = vi.hoisted(() => ({
  owner: false,
  items: [] as TestStockItem[],
  insertCount: 0,
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: {
    getUser: async () => ({ data: { user: { id: 'user-1' } } }),
  },
  from: (table: string) => {
    let operation: 'select' | 'insert' | 'delete' = 'select';
    let payload: Partial<TestStockItem> | undefined;
    let idFilter: string | undefined;
    let single = false;

    const execute = () => {
      if (table !== 'stock_items') return { data: [], error: null };

      if (operation === 'insert') {
        state.insertCount += 1;
        if (payload?.id && state.items.some(item => item.id === payload.id)) {
          return { data: null, error: { code: '23505', message: 'Duplicate id' } };
        }
        const inserted: TestStockItem = {
          id: payload?.id ?? `restored-${state.insertCount}`,
          name: payload?.name ?? '',
          quantity: payload?.quantity ?? 0,
          box: payload?.box ?? '',
          min_quantity: payload?.min_quantity ?? null,
          sort_order: payload?.sort_order ?? 0,
          user_id: payload?.user_id,
        };
        state.items.push(inserted);
        return { data: single ? inserted : [inserted], error: null };
      }

      if (operation === 'delete') {
        if (!state.owner) return { data: [], error: null };
        const removed = state.items.filter(item => item.id === idFilter);
        state.items = state.items.filter(item => item.id !== idFilter);
        return { data: removed.map(item => ({ id: item.id })), error: null };
      }

      const selected = state.items.filter(item => !idFilter || item.id === idFilter);
      return { data: single ? selected[0] ?? null : selected, error: null };
    };

    const builder = {
      select: () => builder,
      order: () => builder,
      eq: (field: string, value: string) => {
        if (field === 'id') idFilter = value;
        return builder;
      },
      insert: (value: Partial<TestStockItem>) => {
        operation = 'insert';
        payload = value;
        return builder;
      },
      delete: () => {
        operation = 'delete';
        return builder;
      },
      single: () => {
        single = true;
        return builder;
      },
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(execute()).then(resolve),
    };
    return builder;
  },
  channel: () => {
    const channel = { on: () => channel, subscribe: () => channel };
    return channel;
  },
  removeChannel: vi.fn(),
} }));

const initialItem = (): TestStockItem => ({
  id: 'item-1',
  name: 'Mooring line',
  quantity: 4,
  box: 'Deck locker',
  min_quantity: 2,
  sort_order: 0,
});

beforeEach(() => {
  state.owner = true;
  state.items = [initialItem()];
  state.insertCount = 0;
  localStorage.clear();
});

it('keeps stock and creates no deletion notification when crew deletion is denied', async () => {
  state.owner = false;
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
  const { result } = renderHook(() => useInventory('vessel-1'));
  await waitFor(() => expect(result.current.stockItems).toHaveLength(1));
  await act(async () => { await result.current.deleteStockItem('item-1'); });
  expect(result.current.stockItems).toHaveLength(0);
  expect(result.current.deletedItems[0].item).toMatchObject({ name: 'Mooring line', quantity: 4 });
  expect(result.current.notifications[0]).toMatchObject({
    type: 'deleted',
    deletedItemData: { itemId: 'item-1', minQuantity: 2 },
  });
});

it('restores only once when undo and notification recovery are both used', async () => {
  const { result } = renderHook(() => useInventory('vessel-1'));
  await waitFor(() => expect(result.current.stockItems).toHaveLength(1));
  await act(async () => { await result.current.deleteStockItem('item-1'); });
  const notificationId = result.current.notifications[0].id;

  await act(async () => {
    await Promise.all([
      result.current.undoDelete(),
      result.current.restoreFromNotification(notificationId),
    ]);
  });

  expect(result.current.stockItems).toHaveLength(1);
  expect(result.current.stockItems[0]).toMatchObject({ id: 'item-1', minQuantity: 2 });
  expect(result.current.deletedItems).toHaveLength(0);
  expect(result.current.notifications.some(notification => notification.type === 'deleted')).toBe(false);
  expect(state.insertCount).toBe(1);

  await act(async () => { await result.current.restoreFromNotification(notificationId); });
  expect(result.current.stockItems).toHaveLength(1);
  expect(state.insertCount).toBe(1);
});

it('can delete an item again after either restore path', async () => {
  const { result } = renderHook(() => useInventory('vessel-1'));
  await waitFor(() => expect(result.current.stockItems).toHaveLength(1));
  await act(async () => { await result.current.deleteStockItem('item-1'); });
  await act(async () => { await result.current.undoDelete(); });
  expect(result.current.stockItems[0].id).toBe('item-1');

  await act(async () => { await result.current.deleteStockItem('item-1'); });
  expect(result.current.stockItems).toHaveLength(0);
  const notificationId = result.current.notifications.find(notification => notification.type === 'deleted')?.id;
  expect(notificationId).toBeDefined();

  await act(async () => { await result.current.restoreFromNotification(notificationId!); });
  expect(result.current.stockItems).toHaveLength(1);
  expect(result.current.deletedItems).toHaveLength(0);

  await act(async () => { await result.current.deleteStockItem('item-1'); });
  expect(result.current.stockItems).toHaveLength(0);
  expect(state.items).toHaveLength(0);
});
