import { useState } from 'react';
import { Minus, Plus, Trash2, NotebookPen, Pencil, History, Check, X } from 'lucide-react';
import { StockItem as StockItemType, UsageEntry } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { isLowStock } from '@/lib/lowStock';
import { toast } from 'sonner';
import MobileSwipeActions from './MobileSwipeActions';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface StockItemProps {
  item: StockItemType;
  onUpdateQuantity: (id: string, change: number) => void;
  onUpdateQuantityDirect: (id: string, value: number) => void;
  onDelete: (id: string) => void;
  canDelete?: boolean;
  onEditItem?: (id: string, updates: { name: string; box: string }) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  usageHistory?: UsageEntry[];
  allBoxNames?: string[];
  showBox?: boolean;
}

const StockItemRow = ({ 
  item, 
  onUpdateQuantity, 
  onUpdateQuantityDirect, 
  onDelete,
  canDelete = false,
  onEditItem,
  isSelected,
  onSelect,
  usageHistory = [],
  allBoxNames = [],
  showBox = false,
}: StockItemProps) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editBox, setEditBox] = useState(item.box);
  const [minOverride, setMinOverride] = useState<number | undefined | null>(null);
  const minQuantity = minOverride === null ? item.minQuantity : minOverride;
  const [minDraft, setMinDraft] = useState<string | null>(null);
  const low = isLowStock({ quantity: item.quantity, minQuantity });
  const saveMin = async () => {
    if (minDraft === null) return;
    const trimmed = minDraft.trim();
    const value = trimmed === '' ? undefined : Math.max(0, parseInt(trimmed) || 0);
    if (value === minQuantity) { setMinDraft(null); return; }
    const { error } = await supabase.from('stock_items').update({ min_quantity: value ?? null }).eq('id', item.id);
    if (error) { setMinDraft(null); toast.error('Could not save minimum stock'); return; }
    setMinOverride(value);
    setMinDraft(null);
  };

  // Get usage history for this specific item
  const itemHistory = usageHistory.filter(
    entry => entry.itemName === item.name && entry.box === item.box
  );

  const handleStartEdit = () => {
    setEditName(item.name);
    setEditBox(item.box);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editName.trim() && onEditItem) {
      onEditItem(item.id, { name: editName.trim(), box: editBox });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(item.name);
    setEditBox(item.box);
  };

  if (isEditing) {
    return (
      <div className="border-b border-border p-3 bg-accent/20 space-y-2">
        <div className="space-y-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Product name"
            autoFocus
          />
          <Select value={editBox} onValueChange={setEditBox}>
            <SelectTrigger className="w-full h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60 bg-popover">
              {allBoxNames.map(box => (
                <SelectItem key={box} value={box}>{box}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleCancelEdit}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSaveEdit} disabled={!editName.trim()}>
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border-b border-border last:border-b-0"
    >
      <MobileSwipeActions
        itemName={item.name}
        canDelete={canDelete}
        onEdit={handleStartEdit}
        onHistory={() => setHistoryOpen(true)}
        onDelete={() => onDelete(item.id)}
        className={cn(
        "inventory-row relative border-l-2 border-l-transparent bg-card",
        (low || item.quantity === 0) && "before:absolute before:-left-0.5 before:top-2 before:bottom-2 before:w-0.5 before:pointer-events-none before:content-['']",
        item.quantity === 0 ? "before:bg-destructive" : low && "before:bg-warning",
        item.quantity === 0 && "opacity-50"
      )}
      >
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Checkbox */}
        <Button variant="ghost" size="icon"
          aria-label={`Send ${item.name} to Deck Order`}
          aria-pressed={!!isSelected}
          onClick={() => onSelect?.(item.id)}
          title="Send to Deck Order"
          className="w-8 h-8 rounded-full bg-muted flex-shrink-0 hover:bg-muted-foreground/20 transition-colors"
        >
          <NotebookPen className="w-4 h-4 text-muted-foreground" />
        </Button>
        
        {/* Name & Box */}
        <div 
          className="flex-1 min-w-0 px-1 -mx-1"
        >
          <div className="flex items-center gap-1 flex-wrap">
            <p className="font-medium text-sm text-foreground break-words line-clamp-2">
              {item.name}
            </p>
            {item.quantity === 0 && (
              <span
                title="Out of stock"
                className="flex-shrink-0 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground"
              >
                OUT
              </span>
            )}
            {showBox && item.box && (
              <span className="flex-shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.box}
              </span>
            )}
          </div>
        </div>
        
        {/* Quantity Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            title="Decrease quantity"
            aria-label={`Decrease ${item.name} quantity`}
            onClick={() => onUpdateQuantity(item.id, -1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdateQuantityDirect(item.id, parseInt(e.target.value) || 0)}
            title={low ? `At or below minimum stock (${minQuantity})` : undefined}
            className="w-12 h-7 text-center px-1 text-sm"
            min={0}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            title="Increase quantity"
            aria-label={`Increase ${item.name} quantity`}
            onClick={() => onUpdateQuantity(item.id, 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <Button title="Stock history and minimum alert" aria-label={`History for ${item.name}`} variant="ghost" size="icon"
          className="hidden md:flex h-7 w-7 text-muted-foreground flex-shrink-0" onClick={() => setHistoryOpen(true)}>
          <History className="h-4 w-4" />
        </Button>

        <Button title="Edit item" aria-label={`Edit ${item.name}`} variant="ghost" size="icon"
          className="hidden md:flex h-7 w-7 text-muted-foreground flex-shrink-0" onClick={handleStartEdit}>
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Delete */}
        {canDelete && <Button
          title="Delete item"
          aria-label={`Delete ${item.name}`}
          variant="ghost"
          size="icon"
          className="hidden md:flex h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>}
      </div>
      
      </MobileSwipeActions>
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-2xl overflow-y-auto rounded-t-lg px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] motion-reduce:transition-none">
          <SheetHeader className="pr-6 text-left">
            <SheetTitle className="break-words">{item.name}</SheetTitle>
            <SheetDescription className="break-words">{item.box} · Stock history</SheetDescription>
          </SheetHeader>
          <div className="mt-5 border-y border-border py-4 flex items-center justify-between gap-3">
            <label htmlFor={`min-${item.id}`} className="text-xs font-medium text-muted-foreground">Minimum stock alert</label>
            <Input
              id={`min-${item.id}`}
              type="number"
              min={0}
              placeholder="Off"
              value={minDraft ?? (minQuantity != null ? String(minQuantity) : '')}
              onFocus={() => setMinDraft(minQuantity != null ? String(minQuantity) : '')}
              onChange={(e) => setMinDraft(e.target.value)}
              onBlur={saveMin}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className="w-16 h-7 text-center px-1 text-sm"
              title="Alert when quantity is at or below this number (leave blank for no alert)"
            />
          </div>
          <div className="pt-5">
            <p className="text-sm font-semibold text-foreground mb-3">Quantity Changes</p>
            {itemHistory.length > 0 ? (
              <div className="divide-y divide-border">
                {itemHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 py-3 text-sm">
                    <span className="min-w-0 break-words text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                      {entry.actorUsername && <span className="ml-2 font-medium">{entry.actorUsername}</span>}
                      {' '}
                      {new Date(entry.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={cn(
                      "flex-shrink-0 font-semibold",
                      entry.quantity > 0 ? "text-destructive" : "text-success"
                    )}>
                      {entry.quantity > 0 ? `-${entry.quantity}` : `+${Math.abs(entry.quantity)}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No changes recorded</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default StockItemRow;
