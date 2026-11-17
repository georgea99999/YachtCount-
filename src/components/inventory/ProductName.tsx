import { StockItem } from '@/types/inventory';

export default function ProductName({ item }: { item: Pick<StockItem, 'name' | 'brand' | 'size'> }) {
  return <span className="break-words text-sm text-foreground [overflow-wrap:anywhere]">
    <span className="font-bold">{item.name}</span>
    {(item.brand || item.size) && <span className="font-normal text-muted-foreground">{item.brand ? ` · ${item.brand}` : ''}{item.size ? ` (${item.size})` : ''}</span>}
  </span>;
}