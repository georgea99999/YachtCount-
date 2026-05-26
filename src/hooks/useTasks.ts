import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/inventory';

const STORAGE_KEY = 'yachtCountTasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch {
        setTasks([]);
      }
    }
  }, []);

  const save = useCallback((items: Task[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addTask = useCallback((text: string, opts?: { notes?: string; starred?: boolean; assignee?: string }) => {
    if (!text.trim()) return;
    setTasks(prev => {
      const updated = [...prev, {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        starred: opts?.starred ?? false,
        notes: opts?.notes?.trim() || undefined,
        assignee: opts?.assignee?.trim() || undefined,
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

  const updateTask = useCallback((id: number, text: string) => {
    setTasks(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, text } : t));
      save(updated);
      return updated;
    });
  }, [save]);

  const updateTaskNotes = useCallback((id: number, notes: string) => {
    setTasks(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, notes } : t));
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

  return { tasks, addTask, toggleTask, toggleStar, updateTask, updateTaskNotes, deleteTask };
}
