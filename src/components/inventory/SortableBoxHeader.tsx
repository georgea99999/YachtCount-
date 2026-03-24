import { useState } from 'react';
import { GripVertical, Pencil, Check, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface SortableBoxHeaderProps {
  id: string;
  boxName: string;
  itemCount: number;
  onRenameBox?: (oldName: string, newName: string) => void;
}

const SortableBoxHeader = ({ id, boxName, itemCount, onRenameBox }: SortableBoxHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(boxName);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== boxName) {
      onRenameBox?.(boxName, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(boxName);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30",
        isDragging && "shadow-xl ring-2 ring-primary/30 rounded-md bg-card"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none w-6 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="h-7 text-sm"
            autoFocus
          />
          <button onClick={handleSave} className="text-primary hover:text-primary/80">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <span className="font-semibold text-sm">{boxName}</span>
          {onRenameBox && (
            <button
              onClick={() => { setEditValue(boxName); setIsEditing(true); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{itemCount} items</span>
        </>
      )}
    </div>
  );
};

export default SortableBoxHeader;
