import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface BulkRow {
  id: number;
  name: string;
  quantity: number;
  box: string;
}

interface BulkAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingBoxes: string[];
  customBoxes: string[];
  onAddCustomBox: (boxName: string) => void;
  onAddItems: (items: { name: string; quantity: number; box: string }[]) => void;
}

let nextRowId = 1;
const emptyRow = (): BulkRow => ({ id: nextRowId++, name: '', quantity: 1, box: '' });

const BulkAddDialog = ({
  open,
  onOpenChange,
  existingBoxes,
  customBoxes,
  onAddCustomBox,
  onAddItems,
}: BulkAddDialogProps) => {
  const [rows, setRows] = useState<BulkRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [newBoxName, setNewBoxName] = useState('');
  const [pendingRowId, setPendingRowId] = useState<number | null>(null);

  const allBoxOptions = Array.from(new Set([...existingBoxes, ...customBoxes]));

  const updateRow = (id: number, updates: Partial<BulkRow>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeRow = (id: number) => {
    setRows(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : prev));
  };

  const handleBoxChange = (rowId: number, value: string) => {
    if (value === '__create_new__') {
      setPendingRowId(rowId);
      setShowCreateBox(true);
    } else {
      updateRow(rowId, { box: value });
    }
  };

  const handleCreateBox = () => {
    const name = newBoxName.trim();
    if (!name) return;
    onAddCustomBox(name);
    if (pendingRowId !== null) updateRow(pendingRowId, { box: name });
    setNewBoxName('');
    setPendingRowId(null);
    setShowCreateBox(false);
  };

  const validRows = rows.filter(r => r.name.trim() && r.box);

  const handleAddAll = () => {
    if (validRows.length === 0) return;
    onAddItems(validRows.map(r => ({ name: r.name.trim(), quantity: r.quantity, box: r.box })));
    toast.success(`Added ${validRows.length} item${validRows.length === 1 ? '' : 's'} to inventory`);
    setRows([emptyRow(), emptyRow(), emptyRow()]);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Bulk Add Items</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
            {rows.map((row, idx) => (
              <div key={row.id} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                <Input
                  type="text"
                  placeholder="Item name..."
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  className="flex-1 min-w-0"
                />
                <Input
                  type="number"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  min={1}
                  className="w-16 shrink-0"
                />
                <Select value={row.box} onValueChange={(v) => handleBoxChange(row.id, v)}>
                  <SelectTrigger className="w-32 shrink-0">
                    <SelectValue placeholder="Box..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-popover">
                    {allBoxOptions.map(box => (
                      <SelectItem key={box} value={box}>{box}</SelectItem>
                    ))}
                    <Separator className="my-1" />
                    <SelectItem value="__create_new__" className="text-accent font-medium">
                      + Create New Box
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => setRows(prev => [...prev, emptyRow()])}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAll}
              disabled={validRows.length === 0}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Add {validRows.length > 0 ? validRows.length : ''} Item{validRows.length === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Box Dialog */}
      <Dialog open={showCreateBox} onOpenChange={setShowCreateBox}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Box</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="Enter box name..."
              value={newBoxName}
              onChange={(e) => setNewBoxName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBox()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBox(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBox} disabled={!newBoxName.trim()}>
              Create Box
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkAddDialog;
