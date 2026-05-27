import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/inventory';

const STORAGE_KEY = 'yachtCountTasks';

function dedupeAssignees(list: string[] | undefined): string[] | undefined {
  if (!list) return undefined;
  const seen = new Map<string, string>();
  list.forEach(raw => {
    const v = raw.trim();
    if (!v) return;
    const key = v.toLowerCase();
    if (!seen.has(key)) seen.set(key, v);
  });
  const out = Array.from(seen.values());
  return out.length ? out : undefined;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed: Task[] = JSON.parse(saved);
      // Migrate legacy single-assignee tasks
      let mutated = false;
      const migrated = parsed.map(t => {
        if (t.assignee && (!t.assignees || t.assignees.length === 0)) {
          mutated = true;
          return { ...t, assignees: [t.assignee], assignee: undefined };
        }
        return t;
      });
      setTasks(migrated);
      if (mutated) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    } catch {
      setTasks([]);
    }
  }, []);

  const save = useCallback((items: Task[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addTask = useCallback((text: string, opts?: { notes?: string; starred?: boolean; assignees?: string[] }) => {
    if (!text.trim()) return;
    setTasks(prev => {
      const updated = [...prev, {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        starred: opts?.starred ?? false,
        notes: opts?.notes?.trim() || undefined,
        assignees: dedupeAssignees(opts?.assignees),
      }];
      save(updated);
      return updated;
    });
  }, [save]);

  const toggleTask = useCallback((id: number) => {
    setTasks(prev => {
      const updated = prev.map(t =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
          : t
      );
      save(updated);
      return updated;
    });
  }, [save]);

  const toggleStar = useCallback((id: number) => {
    setTasks(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, starred: !t.starred } : t));
      save(updated);
      return updated;
    });
  }, [save]);

  const updateTaskFields = useCallback((id: number, patch: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id !== id) return t;
        const merged: Task = { ...t, ...patch };
        if (patch.text !== undefined) merged.text = patch.text.trim();
        if (patch.notes !== undefined) merged.notes = patch.notes.trim() || undefined;
        if (patch.assignees !== undefined) merged.assignees = dedupeAssignees(patch.assignees);
        return merged;
      });
      save(updated);
      return updated;
    });
  }, [save]);

  const deleteTask = useCallback((id: number) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      save(updated);
      return updated;
    });
  }, [save]);

  return { tasks, addTask, toggleTask, toggleStar, updateTaskFields, deleteTask };
}
