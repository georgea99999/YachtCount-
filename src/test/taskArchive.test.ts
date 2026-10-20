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

describe('deleted task folder', () => {
  beforeEach(() => { mock.calls = []; mock.rows = [
    { id: 1, text: 'Active task', completed: false, deleted_at: null },
    { id: 2, text: 'Deleted task', completed: true, deleted_at: '2026-10-20T11:30:00Z', notes: 'Retained notes', assignees: ['George'] },
  ]; });
  it('retains deleted tasks and their details separately from active tasks', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.deletedTasks).toHaveLength(1));
    expect(result.current.tasks.map(t => t.id)).toEqual([1]);
    expect(result.current.deletedTasks[0]).toMatchObject({ id: 2, notes: 'Retained notes', assignees: ['George'], completed: true });
  });
  it('archives a deleted task instead of permanently deleting it', async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.deleteTask(1); });
    expect(mock.calls).toContainEqual(['update', { deleted_at: expect.any(String) }]);
    expect(mock.calls).toContainEqual(['eq', 'id', 1]);
    expect(mock.calls).not.toContainEqual(['delete']);
  });
  it('clears only archived tasks and preserves active tasks', async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.clearDeletedTasks(); });
    expect(mock.calls).toEqual([['delete'], ['not', 'deleted_at', 'is', null]]);
  });
});