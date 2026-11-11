import { useState } from 'react';
import { Plus, X, Table2, Trash2, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import BulkAddDialog from '@/components/inventory/BulkAddDialog';

interface FloatingAddButtonProps {
  onAddItem: (name: string, quantity: number, box: string) => void;
  onAddItems: (items: { name: string; quantity: number; box: string }[]) => void;
  customBoxes: string[];
  existingBoxes: string[];
  onAddCustomBox: (boxName: string) => void;
  canDeleteBoxes: boolean;
  onDeleteBox: (boxName: string) => Promise<{ error: string | null }>;
  onRenameBox?: (oldName: string, newName: string) => void;
}

const FloatingAddButton = ({ onAddItem, onAddItems, customBoxes, existingBoxes, onAddCustomBox, canDeleteBoxes, onDeleteBox, onRenameBox }: FloatingAddButtonProps) => {
  const [showForm, setShowForm] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemBox, setNewItemBox] = useState('');
  const [showCreateBoxDialog, setShowCreateBoxDialog] = useState(false);
  const [newBoxName, setNewBoxName] = useState('');
  const [showManageBoxes, setShowManageBoxes] = useState(false);
  const [boxToDelete, setBoxToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [boxToRename, setBoxToRename] = useState<string | null>(null);
  const [boxRenameValue, setBoxRenameValue] = useState('');

  const allBoxOptions = Array.from(new Set([...existingBoxes, ...customBoxes])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const handleDeleteBox = async () => {
    if (!boxToDelete || deleting) return;
    setDeleting(true);
    try {
      const result = await onDeleteBox(boxToDelete);
      if (result.error) { toast.error(result.error); return; }
      if (newItemBox === boxToDelete) setNewItemBox('');
      toast.success(`Deleted "${boxToDelete}"`);
      setBoxToDelete(null);
    } catch {
      toast.error('Unable to delete this box. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRenameBox = () => {
    const oldName = boxToRename;
    const next = boxRenameValue.trim();
    if (oldName && next && next !== oldName && onRenameBox) {
      onRenameBox(oldName, next);
      if (newItemBox === oldName) setNewItemBox(next);
      toast.success(`Renamed "${oldName}" to "${next}"`);
    }
    setBoxToRename(null);
  };

  const handleAddItem = () => {
    if (newItemName.trim() && newItemBox) {
      onAddItem(newItemName, newItemQty, newItemBox);
      setNewItemName('');
      setNewItemQty(1);
      setShowForm(false);
    }
  };

  const handleCreateBox = () => {
    if (newBoxName.trim()) {
      onAddCustomBox(newBoxName.trim());
      setNewItemBox(newBoxName.trim());
      setNewBoxName('');
      setShowCreateBoxDialog(false);
    }
  };

  const handleBoxChange = (value: string) => {
    if (value === '__create_new__') {
      setShowCreateBoxDialog(true);
    } else {
      setNewItemBox(value);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowForm(true)}
          className="w-14 h-14 rounded-full shadow-lg btn-add"
          aria-label="Add new stock item"
          title="Add new stock item"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handleAddItem(); }} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-stock-name">Product name</Label>
              <Input
                id="new-stock-name"
                type="text"
                placeholder="Item name..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-stock-quantity">Quantity</Label>
                <Input
                  id="new-stock-quantity"
                  type="number"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="new-stock-box">Box / location</Label>
                <Select value={newItemBox} onValueChange={handleBoxChange}>
                  <SelectTrigger id="new-stock-box" className="w-full [&>span]:truncate">
                    <SelectValue placeholder="Box / location..." />
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
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {canDeleteBoxes && (
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowManageBoxes(true)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Manage boxes
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => { setShowForm(false); setShowBulkDialog(true); }}
              >
                <Table2 className="h-4 w-4 mr-1" />
                Bulk entry sheet
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={!newItemName.trim() || !newItemBox}>Add Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={showManageBoxes} onOpenChange={setShowManageBoxes}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Manage boxes</DialogTitle></DialogHeader>
          <div className="max-h-80 overflow-y-auto divide-y">
            {allBoxOptions.length === 0 && <p className="py-4 text-muted-foreground">No boxes</p>}
            {allBoxOptions.map(box => {
              const hasStock = existingBoxes.includes(box);
              const isRenaming = boxToRename === box;
              return <div key={box} className="flex items-center gap-3 py-3">
                {isRenaming ? (
                  <>
                    <Input
                      value={boxRenameValue}
                      onChange={(e) => setBoxRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameBox();
                        if (e.key === 'Escape') setBoxToRename(null);
                      }}
                      className="h-8 flex-1"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" title="Save box name" aria-label="Save box name" onClick={handleRenameBox} className="shrink-0 text-primary hover:text-primary/80"><Check className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Cancel box rename" aria-label="Cancel box rename" onClick={() => setBoxToRename(null)} className="shrink-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1"><p className="break-words font-medium">{box}</p><p className="text-xs text-muted-foreground">{hasStock ? 'Move items to another box first' : 'Empty box'}</p></div>
                    {onRenameBox && (
                      <Button variant="ghost" size="icon" title={`Rename ${box}`} aria-label={`Rename ${box}`} onClick={() => { setBoxToRename(box); setBoxRenameValue(box); }} className="shrink-0 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></Button>
                    )}
                    <Button variant="ghost" size="icon" disabled={hasStock} title={hasStock ? 'Move items out before deleting' : `Delete ${box}`} aria-label={`Delete ${box}`} onClick={() => setBoxToDelete(box)} className="shrink-0 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>;
            })}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={boxToDelete !== null} onOpenChange={open => { if (!open && !deleting) setBoxToDelete(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete box?</DialogTitle></DialogHeader>
          <p className="break-words text-sm text-muted-foreground">Delete “{boxToDelete}” from the box list? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setBoxToDelete(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDeleteBox()}>{deleting ? 'Deleting…' : 'Delete box'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BulkAddDialog
        open={showBulkDialog}
        onOpenChange={setShowBulkDialog}
        existingBoxes={existingBoxes}
        customBoxes={customBoxes}
        onAddCustomBox={onAddCustomBox}
        onAddItems={onAddItems}
      />

      {/* Create New Box Dialog */}
      <Dialog open={showCreateBoxDialog} onOpenChange={setShowCreateBoxDialog}>
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
            <Button variant="outline" onClick={() => setShowCreateBoxDialog(false)}>
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

export default FloatingAddButton;
