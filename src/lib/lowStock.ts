import type { StockItem } from '@/types/inventory';

/** In stock but at or below its minimum. Zero stock counts as out of stock, not low. */
export const isLowStock = (item: Pick<StockItem, 'quantity' | 'minQuantity'>) =>
  item.minQuantity != null && item.minQuantity > 0 && item.quantity > 0 && item.quantity <= item.minQuantity;
