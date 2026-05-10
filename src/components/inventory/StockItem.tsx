import { useState } from 'react';
import { Minus, Plus, Trash2, Package, ChevronDown, ChevronUp, Check, X, GripVertical } from 'lucide-react';
import { StockItem as StockItemType, BOX_OPTIONS, UsageEntry } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StockItemProps {
  item: StockItemType;
  onUpdateQuantity: (id: string, change: number) => void;
  onUpdateQuantityDirect: (id: string, value: number) => void;
  onDelete: (id: string) => void;
  onEditItem?: (id: string, updates: { name: string; box: string }) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  usageHistory?: UsageEntry[];
  isDragEnabled?: boolean;
  allBoxNames?: string[];
}

const StockItemRow = ({ 
  item, 
  onUpdateQuantity, 
  onUpdateQuantityDirect, 
  onDelete,
  onEditItem,
  isSelected,
  onSelect,
  usageHistory = [],
  isDragEnabled = false,
  allBoxNames = [],
}: StockItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editBox, setEditBox] = useState(item.box);
  const isLongName = item.name.length > 20;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !isDragEnabled });

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
              {Array.from(new Set([...BOX_OPTIONS, ...allBoxNames])).map(box => (
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

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.6 : 1,
    position: isDragging ? 'relative' as const : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "inventory-row border-b border-border last:border-b-0 bg-card",
        item.quantity === 0 && !isDragging && "opacity-50",
        isDragging && "shadow-xl ring-2 ring-primary/30 rounded-md"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Drag Handle */}
        {isDragEnabled && (
          <button
            {...attributes}
            {...listeners}
            className="touch-none w-6 h-8 flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        
        {/* Checkbox */}
        <Checkbox 
          checked={isSelected}
          onCheckedChange={() => onSelect?.(item.id)}
          className="border-muted-foreground/50 flex-shrink-0"
        />
        
        {/* Edit Icon */}
        <button
          onClick={handleStartEdit}
          className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-muted-foreground/20 transition-colors"
          title="Edit item"
        >
          <Package className="w-4 h-4 text-muted-foreground" />
        </button>
        
        {/* Name & Box */}
        <div 
          className="flex-1 min-w-0 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-1">
            <p className="font-medium text-sm truncate">
              {item.name}
            </p>
            <Button variant="ghost" size="icon" className="h-4 w-4 flex-shrink-0 p-0">
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Quantity Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => onUpdateQuantity(item.id, -1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdateQuantityDirect(item.id, parseInt(e.target.value) || 0)}
            className="w-12 h-7 text-center px-1 text-sm"
            min={0}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => onUpdateQuantity(item.id, 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-2">
          {isLongName && (
            <div className="bg-muted/50 rounded-md p-2 text-sm">
              <span className="text-muted-foreground text-xs">Full name: </span>
              {item.name}
            </div>
          )}
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Quantity Changes</p>
            {itemHistory.length > 0 ? (
              <div className="space-y-1 max-h-32 overflow-auto">
                {itemHistory.slice(0, 10).map((entry, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                      {' '}
                      {new Date(entry.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={cn(
                      "font-medium",
                      entry.quantity > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
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
        </div>
      )}
    </div>
  );
};

export default StockItemRow;
