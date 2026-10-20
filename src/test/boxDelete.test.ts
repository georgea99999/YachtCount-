import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useInventory } from '@/hooks/useInventory';

const state = vi.hoisted(() => ({ error: null as { message: string } | null, rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    const builder = {
      select: () => builder,
      order: () => builder,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null, data: table === 'stock_items'
        ? [{ id: 'stock-1', name: 'Line', quantity: 0, box: 'Occupied locker' }]
        : table === 'custom_boxes' ? [{ name: 'Old locker' }, { name: 'Occupied locker' }] : [] }).then(resolve),
    };
    return builder;
  },
  rpc: (...args: unknown[]) => { state.rpc(...args); return Promise.resolve({ data: !state.error, error: state.error }); },
  channel: () => { const channel = { on: () => channel, subscribe: () => channel }; return channel; },
  removeChannel: vi.fn(),
} }));

beforeEach(() => { state.error = null; state.rpc.mockClear(); localStorage.clear(); });

it('removes an empty old box and clears its selected filter after authorized deletion', async () => {
  const { result } = renderHook(() => useInventory('vessel-1'));
  await waitFor(() => expect(result.current.customBoxes).toContain('Old locker'));
  act(() => result.current.setSelectedBox('Old locker'));
  await act(async () => { expect(await result.current.deleteBox('Old locker')).toEqual({ error: null }); });
  expect(state.rpc).toHaveBeenCalledWith('delete_empty_box', { box_name: 'Old locker' });
  expect(result.current.customBoxes).toEqual(['Occupied locker']);
  expect(result.current.selectedBox).toBe('');
});

it('protects boxes containing stock rows even when their quantity is zero', async () => {
  const { result } = renderHook(() => useInventory('vessel-1'));
  await waitFor(() => expect(result.current.stockItems).toHaveLength(1));
  await act(async () => { expect((await result.current.deleteBox('Occupied locker')).error).toBeTruthy(); });
  expect(state.rpc).not.toHaveBeenCalled();
  expect(result.current.customBoxes).toContain('Occupied locker');
});

it('keeps the box when server authorization denies deletion', async () => {
  state.error = { message: 'Only the vessel admin can delete boxes' };
  const { result } = renderHook(() => useInventory('vessel-1'));
  await waitFor(() => expect(result.current.customBoxes).toContain('Old locker'));
  await act(async () => { expect((await result.current.deleteBox('Old locker')).error).toBe(state.error?.message); });
  expect(result.current.customBoxes).toContain('Old locker');
});