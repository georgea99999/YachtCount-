import { describe, expect, it } from 'vitest';
import { parseInventoryCsv } from '@/lib/inventoryImport';
import { sortInventoryItems, sortBoxNames } from '@/lib/inventorySort';

describe('inventory CSV import', () => {
  it('reads Product, Box and Quantity with quoted names and zero stock', () => {
    expect(parseInventoryCsv('\uFEFFProduct,Box,Quantity\r\n"Brush, soft",Test Locker,0\r\nLine,Foredeck,12')).toEqual([
      { name: 'Brush, soft', box: 'Test Locker', quantity: 0 },
      { name: 'Line', box: 'Foredeck', quantity: 12 },
    ]);
  });
  it('rejects invalid quantities before importing', () => {
    expect(() => parseInventoryCsv('Product,Box,Quantity\nLine,Locker,-1')).toThrow('Row 2');
  });
  it('requires all three columns', () => {
    expect(() => parseInventoryCsv('Product,Quantity\nLine,4')).toThrow('Product, Box and Quantity');
  });
});

describe('alphabetical products within boxes', () => {
  it('defaults to case-insensitive alphabetical names including new items', () => {
    const items = ['Zinc', 'brush', 'Anchor'].map((name, i) => ({ id: String(i), name, box: 'Test Locker', quantity: i }));
    expect(sortInventoryItems(items).map(i => i.name)).toEqual(['Anchor', 'brush', 'Zinc']);
    expect(items[0].name).toBe('Zinc');
});

describe('alphabetical boxes', () => {
  it('lists box names A-Z regardless of the order items were added', () => {
    expect(sortBoxNames(['stern Locker', 'Foredeck', 'bosun locker 1', 'Lazarette'])).toEqual([
      'bosun locker 1',
      'Foredeck',
      'Lazarette',
      'stern Locker',
    ]);
  });

  it('keeps the crew order while dragging whole boxes', () => {
    const boxes = ['Lazarette', 'Foredeck', 'Bosun locker 1'];
    expect(sortBoxNames(boxes, true)).toEqual(boxes);
  });
});