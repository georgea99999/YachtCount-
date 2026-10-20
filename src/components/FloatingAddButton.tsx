import { useState } from 'react';
import { Plus, X, Table2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import BulkAddDialog from '@/components/inventory/BulkAddDialog';

interface FloatingAddButtonProps {
  onAddItem: (name: string, quantity: number, box: string) => void;
  onAddItems: (items: { name: string; quantity: number; box: string }[]) => void;
  customBoxes: string[];
  existingBoxes: string[];
  onAddCustomBox: (boxName: string) => void;
  canDeleteBoxes: boolean;
  onDeleteBox: (boxName: string) => Promise<{ error: string | null }>;
}

const FloatingAddButton = ({ onAddItem, onAddItems, customBoxes, existingBoxes, onAddCustomBox, canDeleteBoxes, onDeleteBox }: FloatingAddButtonProps) => {
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
      {/* Overlay when form is open */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowForm(false)}
        />
      )}

      {/* Floating button or form */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showForm ? (
          <Button 
            onClick={() => setShowForm(true)}
            className="w-14 h-14 rounded-full shadow-lg btn-add"
          >
            <Plus className="h-6 w-6" />
          </Button>
        ) : (
          <div className="bg-card rounded-lg shadow-xl p-4 w-80 animate-fade-in border">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Add New Item</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              <Input
                type="text"
                placeholder="Item name..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                autoFocus
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-20"
                />
                <Select value={newItemBox} onValueChange={handleBoxChange}>
                  <SelectTrigger className="flex-1">
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
              {canDeleteBoxes && (
                <Button variant="ghost" size="sm" className="self-end text-muted-foreground" onClick={() => setShowManageBoxes(true)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Manage boxes
                </Button>
              )}
              <Button onClick={handleAddItem} disabled={!newItemBox} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Add Item
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => { setShowForm(false); setShowBulkDialog(true); }}
              >
                <Table2 className="h-4 w-4 mr-1" />
                Bulk entry sheet
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Add Dialog */}
      <Dialog open={showManageBoxes} onOpenChange={setShowManageBoxes}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Manage boxes</DialogTitle></DialogHeader>
          <div className="max-h-80 overflow-y-auto divide-y">
            {allBoxOptions.length === 0 && <p className="py-4 text-muted-foreground">No boxes</p>}
            {allBoxOptions.map(box => {
              const hasStock = existingBoxes.includes(box);
              return <div key={box} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1"><p className="break-words font-medium">{box}</p><p className="text-xs text-muted-foreground">{hasStock ? 'Move items to another box first' : 'Empty box'}</p></div>
                <Button variant="ghost" size="icon" disabled={hasStock} title={hasStock ? 'Move items out before deleting' : `Delete ${box}`} aria-label={`Delete ${box}`} onClick={() => setBoxToDelete(box)} className="shrink-0 text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
