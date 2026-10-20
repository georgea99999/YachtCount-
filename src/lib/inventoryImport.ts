import Papa from 'papaparse';

export interface InventoryImportItem {
  name: string;
  box: string;
  quantity: number;
}

export function parseInventoryCsv(csv: string): InventoryImportItem[] {
  const result = Papa.parse<string[]>(csv.replace(/^\uFEFF/, ''), { skipEmptyLines: 'greedy' });
  if (result.errors.length) throw new Error('The CSV could not be read. Check quotes and separators.');
  const [headers, ...rows] = result.data;
  if (!headers) throw new Error('The CSV is empty.');
  const normalized = headers.map(h => h.trim().toLowerCase());
  const nameIndex = normalized.findIndex(h => ['product', 'name', 'item', 'product name', 'item name'].includes(h));
  const boxIndex = normalized.findIndex(h => ['box', 'location', 'storage location'].includes(h));
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
    return { name, box, quantity };
  });
}