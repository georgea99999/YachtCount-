import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveResult = void | boolean | Promise<void | boolean>;

/** Serialize writes and drain the latest draft before allowing an editor to close. */
export function useEditAutosave<T>(key: string | number | null, initial: T, draft: T, persist: (value: T) => SaveResult) {
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const saved = useRef(JSON.stringify(initial));
  const latest = useRef(draft);
  const write = useRef(persist);
  const active = useRef(key);
  const pending = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  latest.current = draft;
  write.current = persist;
  const encoded = JSON.stringify(draft);

  useEffect(() => {
    active.current = key;
    saved.current = JSON.stringify(initial);
    setStatus('saved');
    // The initial snapshot belongs to this editing session, not realtime reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const flush = useCallback(async (): Promise<boolean> => {
    clearTimeout(timer.current);
    if (pending.current) return pending.current;
    if (active.current === null) return true;
    const session = active.current;
    const run = async () => {
      try {
        while (active.current === session && JSON.stringify(latest.current) !== saved.current) {
          const value = latest.current;
          const snapshot = JSON.stringify(value);
          setStatus('saving');
          if (await write.current(value) === false) throw new Error('Save failed');
          saved.current = snapshot;
        }
        setStatus('saved');
        return true;
      } catch {
        setStatus('error');
        return false;
      }
    };
    pending.current = run();
    const result = await pending.current;
    pending.current = null;
    return result;
  }, []);

  useEffect(() => {
    if (key !== null && encoded !== saved.current) {
      setStatus('saving');
      timer.current = setTimeout(() => { void flush(); }, 700);
    }
    return () => clearTimeout(timer.current);
  }, [key, encoded, flush]);

  return { status, flush };
}