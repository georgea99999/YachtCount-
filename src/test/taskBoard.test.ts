import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTasks } from '@/hooks/useTasks';

const mock = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[], calls: [] as unknown[][] }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => {
    const query = {
      select: () => query,
      order: async () => ({ data: mock.rows, error: null }),
      update: (payload: unknown) => { mock.calls.push(['update', payload]); return query; },
      delete: () => { mock.calls.push(['delete']); return query; },
      eq: (...args: unknown[]) => { mock.calls.push(['eq', ...args]); return query; },
      is: async (...args: unknown[]) => { mock.calls.push(['is', ...args]); return { error: null }; },
      not: async (...args: unknown[]) => { mock.calls.push(['not', ...args]); return { error: null }; },
    };
    return query;
  },
  channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
  removeChannel: vi.fn(),
} }));

describe('task board status', () => {
  beforeEach(() => { mock.calls = []; mock.rows = [
    { id: 1, text: 'Wash down decks', completed: false, status: 'todo', deleted_at: null },
    { id: 2, text: 'Service winches', completed: false, status: 'in_progress', deleted_at: null },
    { id: 3, text: 'Polish stainless', completed: true, status: 'completed', deleted_at: null },
  ]; });

  it('loads each task with its board status', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.tasks).toHaveLength(3));
    expect(result.current.tasks.map(t => t.status)).toEqual(['todo', 'in_progress', 'completed']);
  });

  it('moves a task to in progress', async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.setTaskStatus(1, 'in_progress'); });
    expect(mock.calls).toContainEqual(['update', { status: 'in_progress' }]);
    expect(mock.calls).toContainEqual(['eq', 'id', 1]);
  });

  it('moves a task to completed', async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.setTaskStatus(2, 'completed'); });
    expect(mock.calls).toContainEqual(['update', { status: 'completed' }]);
    expect(mock.calls).toContainEqual(['eq', 'id', 2]);
  });

  it('ticking a task completes it via status, and unticking returns it to to do', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.tasks).toHaveLength(3));
    await act(async () => { await result.current.toggleTask(1); });
    expect(mock.calls).toContainEqual(['update', { status: 'completed' }]);
    mock.calls = [];
    await act(async () => { await result.current.toggleTask(3); });
    expect(mock.calls).toContainEqual(['update', { status: 'todo' }]);
  });
});
