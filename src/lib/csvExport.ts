import { StockItem } from '@/types/inventory';
import { downloadBlob } from './download';

const escapeCell = (value: string | number) => {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportInventoryToCsv(items: StockItem[]) {
  const header = 'Product,Box,Quantity';
  const rows = items.map(i => [escapeCell(i.name), escapeCell(i.box), i.quantity].join(','));
  const csv = '﻿' + [header, ...rows].join('\r\n');
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `yachtcount-inventory-${date}.csv`);
}
