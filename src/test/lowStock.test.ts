import { describe, it, expect } from 'vitest';
import { isLowStock } from '@/lib/lowStock';
describe('isLowStock', () => {
  it('flags items at or below minimum', () => {
    expect(isLowStock({ quantity: 3, minQuantity: 3 })).toBe(true);
    expect(isLowStock({ quantity: 2, minQuantity: 3 })).toBe(true);
  });
  it('ignores items above minimum or without one', () => {
    expect(isLowStock({ quantity: 4, minQuantity: 3 })).toBe(false);
    expect(isLowStock({ quantity: 1 })).toBe(false);
  });
  it('leaves zero stock to out of stock', () => {
    expect(isLowStock({ quantity: 0, minQuantity: 3 })).toBe(false);
  });
});
