import { StockItem } from '@/types/inventory';

export type StockDetails = Pick<StockItem, 'brand' | 'size'>;
export type StockEdit = Pick<StockItem, 'name' | 'box' | 'brand' | 'size'>;

export function stockMatchesSearch(item: Pick<StockItem, 'name' | 'brand' | 'size'>, search: string) {
  const text = [item.name, item.brand, item.size].filter(Boolean).join(' ').toLowerCase();
  return search.toLowerCase().trim().split(/\s+/).filter(Boolean).every(word => text.includes(word));
}

export function stockProductLabel(item: Pick<StockItem, 'name' | 'brand' | 'size'>) {
  return `${item.name}${item.brand ? ` · ${item.brand}` : ''}${item.size ? ` (${item.size})` : ''}`;
}