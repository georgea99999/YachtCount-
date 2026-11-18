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
  it('imports all requested fields with mandatory locker and qty', () => {
    expect(parseInventoryCsv('Product,Brand,Size/unit,Locker,Min stock,Qty\nTeak Cleaner,Semco,500ml,Bosun Locker 1,2,5')).toEqual([
      { name: 'Teak Cleaner', brand: 'Semco', size: '500ml', box: 'Bosun Locker 1', minQuantity: 2, quantity: 5 },
    ]);
  });
  it('rejects a missing box column', () => {
    expect(() => parseInventoryCsv('Product,Brand,Size/unit,Min stock,Qty\nCleaner,Semco,500ml,2,5')).toThrow('Product, Box and Quantity');
  });
  it('rejects an empty locker on any row', () => {
    expect(() => parseInventoryCsv('Product,Locker,Qty\nCleaner,Locker,5\nBrush,,3')).toThrow('Row 3');
  });
  it('keeps a zero minimum and leaves blank minimum stock unset', () => {
    expect(parseInventoryCsv('Product,Box,Qty,Min stock\nCleaner,Locker,5,0\nBrush,Locker,3,')).toEqual([
      { name: 'Cleaner', box: 'Locker', quantity: 5, minQuantity: 0 },
      { name: 'Brush', box: 'Locker', quantity: 3 },
    ]);
  });
  it.each(['-1', 'abc', 'Infinity'])('rejects invalid minimum stock %s before saving', value => {
    expect(() => parseInventoryCsv(`Product,Box,Qty,Min stock\nCleaner,Locker,5,2\nBrush,Locker,3,${value}`)).toThrow('Row 3');
  });
  it.each(['Min stock alert', 'Minimum stock', 'Min qty'])('accepts the %s minimum header', header => {
    expect(parseInventoryCsv(`Product,Box,Qty,${header}\nCleaner,Locker,5,2`)[0].minQuantity).toBe(2);
  });
});

describe('alphabetical products within boxes', () => {
  it('defaults to case-insensitive alphabetical names including new items', () => {
    const items = ['Zinc', 'brush', 'Anchor'].map((name, i) => ({ id: String(i), name, box: 'Test Locker', quantity: i }));
    expect(sortInventoryItems(items).map(i => i.name)).toEqual(['Anchor', 'brush', 'Zinc']);
    expect(items[0].name).toBe('Zinc');
  });
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
});