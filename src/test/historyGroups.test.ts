import { describe, expect, it } from 'vitest';
import { groupHistoryByMinute } from '@/lib/historyGroups';
const e = (date: string, quantity: number, actorUsername = 'John Smith') => ({ itemName: 'Rope', box: 'A', date, quantity, actorUsername });
describe('groupHistoryByMinute', () => {
  it('combines six removals in one minute into a single change of 6', () => {
    const r = groupHistoryByMinute(Array.from({ length: 6 }, (_, i) => e(`2026-11-13T12:39:0${i}Z`, 1)));
    expect(r).toHaveLength(1); expect(r[0].quantity).toBe(6);
  });
  it('keeps different minutes and different crew separate', () => {
    expect(groupHistoryByMinute([e('2026-11-13T12:39:00Z', 1), e('2026-11-13T12:40:00Z', 1), e('2026-11-13T12:39:10Z', 1, 'Jane Doe')])).toHaveLength(3);
  });
});
