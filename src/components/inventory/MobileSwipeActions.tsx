import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileSwipeActionsProps {
  children: ReactNode;
  className?: string;
  itemName: string;
  disabled?: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MobileSwipeActions({ children, className, itemName, disabled, canDelete, onEdit, onDelete }: MobileSwipeActionsProps) {
  const mobile = useIsMobile();
  const enabled = mobile && !disabled;
  const width = canDelete ? 144 : 72;
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; offset: number; horizontal: boolean | null } | null>(null);
  const moved = useRef(false);
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const updateOffset = (value: number) => { offsetRef.current = value; setOffset(value); };
  const close = () => { updateOffset(0); setDragging(false); gesture.current = null; };

  useEffect(() => {
    if (!enabled) close();
  }, [enabled]);

  useEffect(() => {
    if (offset === 0 || dragging) return;
    const outside = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) close();
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [offset, dragging]);

  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || !event.isPrimary || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button, input, [role="checkbox"]')) return;
    moved.current = false;
    gesture.current = { x: event.clientX, y: event.clientY, offset: offsetRef.current, horizontal: null };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (current.horizontal === null) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      current.horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
      if (current.horizontal) event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!current.horizontal) return;
    moved.current = true;
    setDragging(true);
    updateOffset(Math.max(-width, Math.min(0, current.offset + dx)));
  };
  const finish = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const current = gesture.current;
    gesture.current = null;
    setDragging(false);
    if (current?.horizontal) updateOffset(cancelled ? current.offset : offsetRef.current < -width / 3 ? -width : 0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div ref={root} className="relative overflow-hidden" onKeyDown={(event) => { if (event.key === 'Escape') close(); }}>
      {enabled && (
        <div className={cn('absolute inset-y-0 right-0 flex', offset === 0 && 'invisible')} aria-hidden={offset === 0}>
          <Button variant="ghost" tabIndex={offset === 0 ? -1 : 0} aria-label={`Edit ${itemName}`} title="Edit item"
            className="h-full w-[72px] flex-col gap-1 rounded-none bg-muted text-foreground hover:bg-muted/80"
            onClick={() => { close(); onEdit(); }}>
            <Pencil className="h-5 w-5" /><span className="text-xs">Edit</span>
          </Button>
          {canDelete && <Button variant="destructive" tabIndex={offset === 0 ? -1 : 0} aria-label={`Delete ${itemName}`} title="Delete item"
            className="h-full w-[72px] flex-col gap-1 rounded-none"
            onClick={() => { close(); onDelete(); }}>
            <Trash2 className="h-5 w-5" /><span className="text-xs">Delete</span>
          </Button>}
        </div>
      )}
      <div className={cn(className, enabled && 'touch-pan-y', !dragging && 'transition-transform duration-200 motion-reduce:transition-none')}
        style={enabled ? { transform: `translateX(${offset}px)` } : undefined}
        onPointerDown={start} onPointerMove={move} onPointerUp={(event) => finish(event)} onPointerCancel={(event) => finish(event, true)}
        onClickCapture={(event) => {
          if (moved.current || offset !== 0) {
            event.preventDefault(); event.stopPropagation(); moved.current = false; close();
          }
        }}>
        {children}
      </div>
    </div>
  );
}