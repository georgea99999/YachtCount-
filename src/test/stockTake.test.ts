import { describe, it, expect } from 'vitest';
import { stockTakeDifferences } from '@/lib/stockTakeReport';

describe('stock take differences', () => {
  it('lists only items whose count differs from expected', () => {
    const d = stockTakeDifferences([
      { name: 'Rope', box: 'A', expected: 5, counted: 5 },
      { name: 'Gloves', box: 'A', expected: 4, counted: 2 },
    ]);
    expect(d.map(x => x.name)).toEqual(['Gloves']);
  });
});
