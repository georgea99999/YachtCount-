import { describe, expect, it } from 'vitest';
import { stockMatchesSearch, stockProductLabel } from '@/lib/stockProduct';
import { parseInventoryCsv } from '@/lib/inventoryImport';

describe('stock brand and size', () => {
  const item = { name: 'Stainless Polish', brand: 'Flitz', size: '500ml' };
  it('searches brand and size alongside the name, requiring every word', () => {
    expect(stockMatchesSearch(item, 'flitz 500ml')).toBe(true);
    expect(stockMatchesSearch(item, 'flitz 1L')).toBe(false);
  });
  it('retains optional brand and size from CSV', () => {
    expect(parseInventoryCsv('Product,Box,Quantity,Brand,Size\nStainless Polish,Locker,3,Flitz,500ml')[0]).toEqual({ ...item, box: 'Locker', quantity: 3 });
  });
  it('keeps product identification in count records', () => {
    expect(stockProductLabel(item)).toBe('Stainless Polish · Flitz (500ml)');
    expect(stockProductLabel({ name: 'Brush' })).toBe('Brush');
  });
});