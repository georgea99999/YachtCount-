import { useState, useMemo, useCallback } from 'react';
import { ArrowUpDown, Download, FileSpreadsheet, Package, GripVertical, Pencil, Check, X, Layers, Boxes, AlertTriangle } from 'lucide-react';
import { StockItem, DeckOrderItem, UsageEntry } from '@/types/inventory';
import { InventoryImportItem } from '@/lib/inventoryImport';
import { InventorySort, sortInventoryItems } from '@/lib/inventorySort';
import ImportInventoryDialog from './ImportInventoryDialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import StockItemRow from './StockItem';
import SendToDeckOrderDialog from './SendToDeckOrderDialog';
import SortableBoxHeader from './SortableBoxHeader';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface StockListProps {
  items: StockItem[];
  allItems: StockItem[];
  searchTerm: string;
  selectedBox: string;
  onBoxChange: (value: string) => void;
  onUpdateQuantity: (id: string, change: number) => void;
  onUpdateQuantityDirect: (id: string, value: number) => void;
  onDelete: (id: string) => void;
  canDelete?: boolean;
  onEditItem?: (id: string, updates: { name: string; box: string }) => void;
  totalItems: number;
  totalQuantity: number;
  onSendToDeckOrder?: (item: Omit<DeckOrderItem, 'id'>) => void;
  usageHistory?: UsageEntry[];
  onReorderItems?: (items: StockItem[]) => void;
  onRenameBox?: (oldName: string, newName: string) => void;
  onImportItems: (items: InventoryImportItem[]) => Promise<boolean>;
}

type SortOption = InventorySort;

const StockList = ({
  items,
  allItems,
  searchTerm,
  selectedBox,
  onBoxChange,
  onUpdateQuantity,
  onUpdateQuantityDirect,
  onDelete,
  canDelete = false,
  onEditItem,
  totalItems,
  totalQuantity,
  onSendToDeckOrder,
  usageHistory = [],
  onReorderItems,
  onRenameBox,
  onImportItems,
}: StockListProps) => {
  const [importOpen, setImportOpen] = useState(false);
  const [selectedItemForOrder, setSelectedItemForOrder] = useState<StockItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderBoxes, setReorderBoxes] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [editingBox, setEditingBox] = useState<string | null>(null);
  const [editBoxValue, setEditBoxValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (reorderBoxes) {
      // Reorder entire box sections
      const boxOrder = sortedBoxEntries.map(([box]) => box);
      const oldIdx = boxOrder.indexOf(String(active.id));
      const newIdx = boxOrder.indexOf(String(over.id));
      if (oldIdx === -1 || newIdx === -1) return;

      const newBoxOrder = [...boxOrder];
      const [moved] = newBoxOrder.splice(oldIdx, 1);
      newBoxOrder.splice(newIdx, 0, moved);

      // Rebuild allItems in new box order
      const reordered: StockItem[] = [];
      newBoxOrder.forEach(box => {
        reordered.push(...allItems.filter(i => i.box === box));
      });
      // Add items from boxes not in the current view
      allItems.forEach(i => {
        if (!reordered.find(r => r.id === i.id)) reordered.push(i);
      });
      onReorderItems?.(reordered);
      return;
    }

    // Item reorder within box
    const activeItem = allItems.find(i => i.id === active.id);
    const overItem = allItems.find(i => i.id === over.id);
    if (!activeItem || !overItem || activeItem.box !== overItem.box) return;

    const reordered = [...allItems];
    const oldIndex = reordered.findIndex(i => i.id === active.id);
    const newIndex = reordered.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const [movedItem] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedItem);
    onReorderItems?.(reordered);
  };

  const activeDragItem = activeDragId ? allItems.find(i => i.id === activeDragId) : null;

  const handleExportPDF = () => {
    if (items.length === 0) {
      alert('No items to export');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Group items by box for the PDF
    const groupedForPDF = items.reduce((acc, item) => {
      if (!acc[item.box]) {
        acc[item.box] = [];
      }
      acc[item.box].push(item);
      return acc;
    }, {} as Record<string, StockItem[]>);

    // Sort boxes alphabetically
    const sortedBoxes = Object.keys(groupedForPDF).sort((a, b) => a.localeCompare(b));

    const tableRows = sortedBoxes.map(box => 
      sortInventoryItems(groupedForPDF[box]).map(item => 
        '<tr><td>' + item.name + '</td><td>' + item.box + '</td><td>' + item.quantity + '</td></tr>'
      ).join('')
    ).join('');

    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stock Take - ${currentDate}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; padding-top: 70px; }
          h1 { color: #1a365d; margin-bottom: 5px; }
          .date { color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 0; }
          th { background-color: #5f8b9a; color: white; padding: 12px 8px; text-align: left; }
          td { padding: 10px 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          .floating-nav {
            position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
            background: #1a365d; color: white; padding: 12px 24px;
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .floating-nav span { font-weight: bold; font-size: 16px; }
          .floating-nav .btn-group { display: flex; gap: 10px; }
          .floating-nav button {
            padding: 8px 20px; border: none; border-radius: 6px;
            font-size: 14px; font-weight: 600; cursor: pointer;
          }
          .btn-print { background: #5f8b9a; color: white; }
          .btn-print:hover { background: #4a7585; }
          .btn-close { background: #e2e8f0; color: #1a365d; }
          .btn-close:hover { background: #cbd5e0; }
          @media print { .floating-nav { display: none; } body { padding-top: 40px; } }
        </style>
      </head>
      <body>
        <div class="floating-nav">
          <span>Stock Take - ${currentDate}</span>
          <div class="btn-group">
            <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
            <button class="btn-close" onclick="window.close()">Close</button>
          </div>
        </div>
        <h1>YachtCount - Stock Take</h1>
        <p class="date">Generated: ${currentDate}</p>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Box</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          <p>Total Items: ${items.length} | Total Quantity: ${totalQty}</p>
          <p>Professional Inventory Systems for Maritime Excellence.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleSelectForOrder = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setSelectedItemForOrder(item);
      setDialogOpen(true);
    }
  };

  const handleConfirmSendToOrder = (orderItem: Omit<DeckOrderItem, 'id'>) => {
    onSendToDeckOrder?.(orderItem);
    setSelectedItemForOrder(null);
  };

  // Sort items based on selected option
  const sortedItems = sortInventoryItems(items, sortOption, isReorderMode);

  // Group items by box
  const groupedItems = sortedItems.reduce((acc, item) => {
    if (!acc[item.box]) {
      acc[item.box] = [];
    }
    acc[item.box].push(item);
    return acc;
  }, {} as Record<string, StockItem[]>);

  // Compute all box names for edit dropdown
  const allBoxNames = useMemo(() => Array.from(new Set(allItems.map(i => i.box))), [allItems]);

  // Sort boxes: preserve the order items appear in the array (respects drag reorder)
  const sortedBoxEntries = useMemo(() => {
    // Build box order from the allItems array to preserve custom ordering
    const boxOrder: string[] = [];
    allItems.forEach(item => {
      if (!boxOrder.includes(item.box)) {
        boxOrder.push(item.box);
      }
    });

    return Object.entries(groupedItems).sort(([boxA], [boxB]) => {
      const indexA = boxOrder.indexOf(boxA);
      const indexB = boxOrder.indexOf(boxB);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [groupedItems, allItems]);

  const outOfStock = allItems.filter(i => i.quantity <= 0).length;
  const stats = [
    { label: 'Items', value: totalItems, icon: Package },
    { label: 'Units', value: totalQuantity, icon: Layers },
    { label: 'Boxes', value: allBoxNames.length, icon: Boxes },
    { label: 'Out of stock', value: outOfStock, icon: AlertTriangle, alert: outOfStock > 0 },
  ];
  const activeBox = selectedBox && selectedBox !== 'all' ? selectedBox : '';

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
      {/* Page title */}
      <div className="px-4 pt-5 pb-1 hidden md:flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inventory</p>
          <h1 className="text-2xl font-bold text-foreground">Stock Take</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 pb-2">
        {stats.map(({ label, value, icon: Icon, alert }) => (
          <Card key={label} className="relative overflow-hidden border-border shadow-sm">
            <div className={`absolute inset-y-0 left-0 w-1 ${alert ? 'bg-destructive' : 'bg-accent'}`} />
            <CardContent className="p-4 pl-5 flex items-center justify-between gap-2">
              <div>
                <p className={`text-2xl font-bold leading-none ${alert ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
                <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              </div>
              <div className={`rounded-full p-2 ${alert ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-primary dark:text-primary-foreground'}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Box chips */}
      {allBoxNames.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
          {['', ...allBoxNames].map(box => {
            const isActive = activeBox === box;
            const count = box ? allItems.filter(i => i.box === box).length : allItems.length;
            return (
              <button
                key={box || 'all'}
                type="button"
                onClick={() => onBoxChange(box || 'all')}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'}`}
              >
                {box || 'All boxes'} <span className="ml-1 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-popover">
            <DropdownMenuItem onClick={() => setSortOption('default')}>
              Default (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('name-asc')}>
              Name (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('name-desc')}>
              Name (Z-A)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('qty-asc')}>
              Quantity (Low to High)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('qty-desc')}>
              Quantity (High to Low)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={isReorderMode ? "default" : "outline"}
          size="sm"
          className="gap-1"
          onClick={() => {
            if (isReorderMode) {
              setIsReorderMode(false);
              setReorderBoxes(false);
            } else {
              setIsReorderMode(true);
            }
          }}
        >
          <GripVertical className="h-4 w-4" />
          {isReorderMode ? 'Done' : 'Reorder'}
        </Button>

        {isReorderMode && (
          <Button
            variant={reorderBoxes ? "default" : "outline"}
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setReorderBoxes(!reorderBoxes)}
          >
            {reorderBoxes ? 'Items' : 'Boxes'}
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={handleExportPDF} title="Export as PDF">
          <Download className="h-4 w-4" /><span className="hidden sm:inline">PDF</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => setImportOpen(true)} title="Import from CSV">
          <FileSpreadsheet className="h-4 w-4" /><span className="hidden sm:inline">Import</span>
        </Button>
      </div>

      <div className="mx-4 mb-4 flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Table Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b">
        <div className="w-4 flex-shrink-0" />
        <div className="w-8 flex-shrink-0" />
        <div className="flex-1 min-w-0">Name</div>
        <div className="w-24 text-center flex-shrink-0">Qty</div>
        {canDelete && <div className="w-7 flex-shrink-0" />}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-auto bg-card">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full bg-secondary p-4 text-primary dark:text-primary-foreground">
                <Package className="h-8 w-8" />
              </div>
              <p className="text-base font-semibold text-foreground">
                {searchTerm || activeBox ? 'No matching items' : 'Your inventory is empty'}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {searchTerm || activeBox ? 'Try a different search or box.' : 'Add your first item with the + button, or import an existing spreadsheet.'}
              </p>
              {!searchTerm && !activeBox && (
                <Button size="sm" className="mt-5 gap-1" onClick={() => setImportOpen(true)}>
                  <FileSpreadsheet className="h-4 w-4" /> Import from CSV
                </Button>
              )}
            </div>
          ) : isReorderMode && reorderBoxes ? (
            // Box reorder mode
            <SortableContext items={sortedBoxEntries.map(([box]) => box)} strategy={verticalListSortingStrategy}>
              {sortedBoxEntries.map(([box, boxItems]) => (
                <SortableBoxHeader key={box} id={box} boxName={box} itemCount={boxItems.length} onRenameBox={onRenameBox} />
              ))}
            </SortableContext>
          ) : isReorderMode ? (
            // Item reorder mode within boxes
            sortedBoxEntries.map(([box, boxItems]) => (
              <div key={box}>
                <div className="px-4 py-2 bg-muted/30 text-sm font-semibold text-muted-foreground sticky top-0 flex items-center gap-2">
                  {box}
                </div>
                <SortableContext items={boxItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {boxItems.map(item => (
                    <StockItemRow
                      key={item.id}
                      item={item}
                      onUpdateQuantity={onUpdateQuantity}
                      onUpdateQuantityDirect={onUpdateQuantityDirect}
                      onDelete={onDelete}
                      canDelete={canDelete}
                      onEditItem={onEditItem}
                      onSelect={handleSelectForOrder}
                      usageHistory={usageHistory}
                      isDragEnabled
                      allBoxNames={allBoxNames}
                    />
                  ))}
                </SortableContext>
              </div>
            ))
          ) : selectedBox && selectedBox !== 'all' ? (
            sortedItems.map(item => (
              <StockItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateQuantityDirect={onUpdateQuantityDirect}
                onDelete={onDelete}
                      canDelete={canDelete}
                onEditItem={onEditItem}
                onSelect={handleSelectForOrder}
                usageHistory={usageHistory}
                allBoxNames={allBoxNames}
              />
            ))
          ) : searchTerm ? (
            sortedItems.map(item => (
              <StockItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateQuantityDirect={onUpdateQuantityDirect}
                onDelete={onDelete}
                      canDelete={canDelete}
                onEditItem={onEditItem}
                onSelect={handleSelectForOrder}
                usageHistory={usageHistory}
                allBoxNames={allBoxNames}
              />
            ))
          ) : (
            sortedBoxEntries.map(([box, boxItems]) => (
              <div key={box}>
                <div className="px-4 py-2 bg-muted/30 text-sm font-semibold text-muted-foreground sticky top-0 flex items-center gap-2">
                  {editingBox === box ? (
                    <>
                      <input
                        value={editBoxValue}
                        onChange={(e) => setEditBoxValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const trimmed = editBoxValue.trim();
                            if (trimmed && trimmed !== box) onRenameBox?.(box, trimmed);
                            setEditingBox(null);
                          }
                          if (e.key === 'Escape') setEditingBox(null);
                        }}
                        className="h-6 px-2 text-sm bg-background border border-input rounded"
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" title="Save box name" aria-label="Save box name" onClick={() => {
                        const trimmed = editBoxValue.trim();
                        if (trimmed && trimmed !== box) onRenameBox?.(box, trimmed);
                        setEditingBox(null);
                      }} className="h-6 w-6 text-primary"><Check className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" title="Cancel box rename" aria-label="Cancel box rename" onClick={() => setEditingBox(null)} className="h-6 w-6 text-muted-foreground"><X className="w-3.5 h-3.5" /></Button>
                    </>
                  ) : (
                    <>
                      {box}
                      {onRenameBox && (
                        <Button variant="ghost" size="icon" title="Rename box" aria-label="Rename box"
                          onClick={() => { setEditBoxValue(box); setEditingBox(box); }}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
                {boxItems.map(item => (
                  <StockItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onUpdateQuantityDirect={onUpdateQuantityDirect}
                    onDelete={onDelete}
                      canDelete={canDelete}
                    onEditItem={onEditItem}
                    onSelect={handleSelectForOrder}
                    usageHistory={usageHistory}
                    allBoxNames={allBoxNames}
                  />
                ))}
              </div>
            ))
          )}

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeDragId && reorderBoxes ? (
              <div className="px-4 py-3 bg-primary text-primary-foreground rounded-md shadow-xl text-sm font-semibold">
                {activeDragId}
              </div>
            ) : activeDragItem ? (
              <div className="bg-card shadow-xl ring-2 ring-primary/30 rounded-md opacity-90 px-3 py-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm text-foreground">{activeDragItem.name}</span>
                  <span className="ml-auto text-sm text-muted-foreground">{activeDragItem.quantity}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      </div>

      {importOpen && <ImportInventoryDialog open={importOpen} onOpenChange={setImportOpen} onImport={onImportItems} />}

      {/* Send to Deck Order Dialog */}
      <SendToDeckOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItemForOrder}
        onConfirm={handleConfirmSendToOrder}
      />
    </div>
  );
};

export default StockList;
