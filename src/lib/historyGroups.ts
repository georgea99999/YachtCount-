import type { UsageEntry } from '@/types/inventory';

/** Merge history entries made by the same crew member within the same calendar minute (net change). */
export function groupHistoryByMinute(entries: UsageEntry[]): UsageEntry[] {
  const groups = new Map<string, UsageEntry>();
  for (const e of entries) {
    const d = new Date(e.date);
    d.setSeconds(0, 0);
    const key = `${d.getTime()}|${e.actorUsername ?? ''}`;
    const g = groups.get(key);
    if (g) g.quantity += e.quantity;
    else groups.set(key, { ...e, date: d.toISOString() });
  }
  return [...groups.values()].filter(g => g.quantity !== 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
