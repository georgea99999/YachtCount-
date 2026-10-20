import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { InventoryImportItem, parseInventoryCsv } from '@/lib/inventoryImport';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: InventoryImportItem[]) => Promise<boolean>;
}

export default function ImportInventoryDialog({ open, onOpenChange, onImport }: Props) {
  const [items, setItems] = useState<InventoryImportItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);

  const selectFile = async (file?: File) => {
    setItems([]);
    setError('');
    if (!file) return;
    setReading(true);
    try {
      setItems(parseInventoryCsv(await file.text()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to read this CSV.');
    } finally {
      setReading(false);
    }
  };

  const importItems = async () => {
    setBusy(true);
    try {
      const saved = await onImport(items);
      if (!saved) {
        setError('Import was not saved. Please try again.');
        return;
      }
      toast.success(`Imported ${items.length} items`);
      onOpenChange(false);
    } catch {
      setError('Import was not saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader><DialogTitle>Import Inventory from CSV</DialogTitle></DialogHeader>
        <Input aria-label="CSV file" type="file" accept=".csv,text/csv" disabled={busy || reading} onChange={e => void selectFile(e.target.files?.[0])} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {items.length > 0 && <>
          <p className="text-sm text-muted-foreground">{items.length} items · {new Set(items.map(i => i.box)).size} boxes</p>
          <div className="overflow-auto border rounded-md">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted text-muted-foreground"><tr><th className="p-2 text-left w-1/2">Product</th><th className="p-2 text-left">Box</th><th className="p-2 text-right w-16">Qty</th></tr></thead>
              <tbody>{items.slice(0, 50).map((item, i) => <tr key={i} className="border-t"><td className="p-2 break-words">{item.name}</td><td className="p-2 break-words">{item.box}</td><td className="p-2 text-right">{item.quantity}</td></tr>)}</tbody>
            </table>
          </div>
        </>}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!items.length || busy || reading} onClick={() => void importItems()}><Upload className="h-4 w-4 mr-2" />{busy ? 'Importing…' : reading ? 'Reading…' : `Import${items.length ? ` ${items.length} Items` : ''}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}