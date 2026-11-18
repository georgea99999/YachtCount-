import Papa from 'papaparse';

export interface InventoryImportItem {
  name: string;
  brand?: string;
  size?: string;
  box: string;
  quantity: number;
  minQuantity?: number;
}

export function parseInventoryCsv(csv: string): InventoryImportItem[] {
  const result = Papa.parse<string[]>(csv.replace(/^\uFEFF/, ''), { skipEmptyLines: 'greedy' });
  if (result.errors.length) throw new Error('The CSV could not be read. Check quotes and separators.');
  const [headers, ...rows] = result.data;
  if (!headers) throw new Error('The CSV is empty.');
  const normalized = headers.map(h => h.trim().toLowerCase());
  const nameIndex = normalized.findIndex(h => ['product', 'name', 'item', 'product name', 'item name'].includes(h));
  const boxIndex = normalized.findIndex(h => ['box', 'locker', 'box / locker', 'box/locker', 'location', 'storage location'].includes(h));
  const brandIndex = normalized.indexOf('brand');
  const sizeIndex = normalized.findIndex(h => ['size', 'size/unit', 'size / unit', 'unit'].includes(h));
  const minIndex = normalized.findIndex(h => ['min stock', 'min stock alert', 'minimum stock', 'min qty'].includes(h));
  const qtyIndex = normalized.findIndex(h => ['quantity', 'qty'].includes(h));
  if ([nameIndex, boxIndex, qtyIndex].some(i => i < 0)) {
    throw new Error('The CSV needs Product, Box and Quantity columns.');
  }
  if (!rows.length) throw new Error('The CSV has no inventory items.');
  return rows.map((row, index) => {
    const name = row[nameIndex]?.trim() ?? '';
    const box = row[boxIndex]?.trim() ?? '';
    const rawQty = row[qtyIndex]?.trim() ?? '';
    const quantity = Number(rawQty);
    if (row.length !== headers.length || !name || !box || !rawQty || !Number.isFinite(quantity) || quantity < 0) {
      throw new Error(`Row ${index + 2}: enter a product, box and a valid quantity of zero or more.`);
    }
    const rawMin = minIndex >= 0 ? row[minIndex]?.trim() ?? '' : '';
    const minQuantity = rawMin ? Number(rawMin) : undefined;
    if (minQuantity !== undefined && (!Number.isFinite(minQuantity) || minQuantity < 0)) {
      throw new Error(`Row ${index + 2}: enter a valid minimum stock of zero or more, or leave it blank.`);
    }
    return { name, box, quantity, ...(brandIndex >= 0 ? { brand: row[brandIndex]?.trim() ?? '' } : {}), ...(sizeIndex >= 0 ? { size: row[sizeIndex]?.trim() ?? '' } : {}), ...(minQuantity !== undefined ? { minQuantity } : {}) };
  });
}