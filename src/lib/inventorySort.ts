import { StockItem } from '@/types/inventory';

export type InventorySort = 'default' | 'name-asc' | 'name-desc' | 'qty-asc' | 'qty-desc';

export function sortInventoryItems(items: StockItem[], sort: InventorySort = 'default', manual = false) {
  if (manual) return [...items];
  const compareName = (a: StockItem, b: StockItem) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true });
  return [...items].sort((a, b) => {
    if (sort === 'name-desc') return compareName(b, a);
    if (sort === 'qty-asc') return a.quantity - b.quantity || compareName(a, b);
    if (sort === 'qty-desc') return b.quantity - a.quantity || compareName(a, b);
    return compareName(a, b);
  });
}