import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEditAutosave } from '@/hooks/useEditAutosave';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('edit autosave safety', () => {
  it('does not write an unchanged editor or a new-entry draft', async () => {
    const save = vi.fn();
    const { result, rerender } = renderHook(({ key, draft }) => useEditAutosave(key, { title: 'Brush', notes: '' }, draft, save),
      { initialProps: { key: '1' as string | null, draft: { notes: '', title: 'Brush' } } });
    await act(async () => { expect(await result.current.flush()).toBe(true); });
    rerender({ key: null, draft: { notes: 'New', title: 'Unsaved new item' } });
    await act(async () => { await result.current.flush(); });
    expect(save).not.toHaveBeenCalled();
  });

  it('saves after a short pause without requiring a close', async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(true);
    const { rerender } = renderHook(({ draft }) => useEditAutosave('1', 'Brush', draft, save), { initialProps: { draft: 'Brush' } });
    rerender({ draft: 'Soft brush' });
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    expect(save).toHaveBeenCalledExactlyOnceWith('Soft brush');
  });

  it('serializes changes made during an in-flight save before close completes', async () => {
    let finish: ((result: boolean) => void) | undefined;
    const save = vi.fn().mockImplementationOnce(() => new Promise<boolean>(resolve => { finish = resolve; })).mockResolvedValue(true);
    const { result, rerender } = renderHook(({ draft }) => useEditAutosave('1', 'Brush', draft, save), { initialProps: { draft: 'Brush' } });
    rerender({ draft: 'Soft brush' });
    let close: Promise<boolean> | undefined;
    act(() => { close = result.current.flush(); });
    rerender({ draft: 'Soft deck brush' });
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => { finish?.(true); expect(await close).toBe(true); });
    expect(save.mock.calls.map(call => call[0])).toEqual(['Soft brush', 'Soft deck brush']);
  });

  it('does not allow close on failure and retries the same draft', async () => {
    const save = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { result, rerender } = renderHook(({ draft }) => useEditAutosave('1', 'Brush', draft, save), { initialProps: { draft: 'Brush' } });
    rerender({ draft: 'Soft brush' });
    await act(async () => { expect(await result.current.flush()).toBe(false); });
    await waitFor(() => expect(result.current.status).toBe('error'));
    await act(async () => { expect(await result.current.flush()).toBe(true); });
    expect(save.mock.calls.map(call => call[0])).toEqual(['Soft brush', 'Soft brush']);
  });
});