import { useMemo, useState } from 'react';
import Attachments from '@/components/Attachments';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Layers,
  Link2,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DeckOrderItem } from '@/types/inventory';

interface DeckOrderListProps {
  items: DeckOrderItem[];
  onAddItem: (item: Omit<DeckOrderItem, 'id'>) => void;
  onUpdateItem: (id: number, updates: Partial<Omit<DeckOrderItem, 'id'>>) => void;
  onDeleteItem: (id: number) => void;
  onClearAll: () => void;
}

type SortOption = 'default' | 'name-asc' | 'name-desc' | 'qty-asc' | 'qty-desc';

const emptyForm = { productName: '', quantity: '', colour: '', size: '', link: '' };

const qtyValue = (quantity: string) => {
  const n = parseInt(quantity, 10);
  return Number.isFinite(n) ? n : 0;
};

const DeckOrderList = ({ items, onAddItem, onUpdateItem, onDeleteItem, onClearAll }: DeckOrderListProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [dialog, setDialog] = useState<{ kind: 'closed' } | { kind: 'add' } | { kind: 'edit'; item: DeckOrderItem }>({ kind: 'closed' });
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setForm(emptyForm);
    setDialog({ kind: 'add' });
  };

  const openEdit = (item: DeckOrderItem) => {
    setForm({
      productName: item.productName,
      quantity: item.quantity,
      colour: item.colour,
      size: item.size,
      link: item.link,
    });
    setDialog({ kind: 'edit', item });
  };

  const closeDialog = () => {
    setDialog({ kind: 'closed' });
    setForm(emptyForm);
  };

  const handleConfirm = () => {
    const productName = form.productName.trim();
    if (!productName) return;
    const payload = {
      productName,
      quantity: form.quantity.trim() || '1',
      colour: form.colour.trim(),
      size: form.size.trim(),
      link: form.link.trim(),
    };
    if (dialog.kind === 'edit') onUpdateItem(dialog.item.id, payload);
    else onAddItem(payload);
    closeDialog();
  };

  const handleDownloadPDF = () => {
    if (items.length === 0) {
      alert('No items to export');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Deck Order - ${currentDate}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
          h1 { color: #1a365d; margin-bottom: 5px; font-size: 20px; }
          .date { color: #666; margin-bottom: 20px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: fixed; }
          th { background-color: #5f8b9a; color: white; padding: 8px 6px; text-align: left; font-size: 11px; }
          td { padding: 7px 6px; border-bottom: 1px solid #ddd; font-size: 11px; word-wrap: break-word; overflow-wrap: break-word; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          col.col-product { width: 30%; }
          col.col-colour { width: 15%; }
          col.col-size { width: 15%; }
          col.col-qty { width: 10%; }
          col.col-link { width: 30%; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 11px; }
          a { color: #5f8b9a; word-break: break-all; font-size: 10px; }
          .back-btn { 
            position: fixed;
            top: 20px; 
            right: 20px; 
            padding: 10px 20px; 
            background: #5f8b9a; 
            color: white; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
          }
          .back-btn:hover { background: #4a7585; }
          .action-btns {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
          }
          @media print { 
            .action-btns { display: none; } 
          }
        </style>
      </head>
      <body>
        <div class="action-btns">
          <button class="back-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
          <button class="back-btn" onclick="window.close()">✕ Close</button>
        </div>
        <h1>YachtCount - Deck Order</h1>
        <p class="date">Generated: ${currentDate}</p>
        <table>
          <colgroup>
            <col class="col-product" />
            <col class="col-colour" />
            <col class="col-size" />
            <col class="col-qty" />
            <col class="col-link" />
          </colgroup>
          <thead>
            <tr>
              <th>Product</th>
              <th>Colour</th>
              <th>Size</th>
              <th>Quantity</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.colour || '-'}</td>
                <td>${item.size || '-'}</td>
                <td>${item.quantity}</td>
                <td>${item.link ? `<a href="${item.link}" target="_blank">${item.link}</a>` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Total Items: ${items.length}</p>
          <p>Professional Inventory Systems for Maritime Excellence.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const withLink = items.filter(i => i.link.trim()).length;
  const totalQty = items.reduce((sum, i) => sum + qtyValue(i.quantity), 0);

  const stats = [
    { label: 'Items', value: items.length, icon: ListChecks },
    { label: 'Total qty', value: totalQty, icon: Layers },
    { label: 'With links', value: withLink, icon: Link2 },
  ];

  const visibleItems = useMemo(() => {
    const sorted = [...items];
    switch (sortOption) {
      case 'name-asc':
        sorted.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.productName.localeCompare(a.productName));
        break;
      case 'qty-asc':
        sorted.sort((a, b) => qtyValue(a.quantity) - qtyValue(b.quantity));
        break;
      case 'qty-desc':
        sorted.sort((a, b) => qtyValue(b.quantity) - qtyValue(a.quantity));
        break;
      default:
        break;
    }
    return sorted;
  }, [items, sortOption]);

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
      {/* Page title */}
      <div className="px-4 pt-5 pb-1 hidden md:flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ordering</p>
          <h1 className="text-2xl font-bold text-foreground">Deck Order</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 p-4 pb-2">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="relative overflow-hidden border-border shadow-sm">
            <div className="absolute inset-y-0 left-0 w-1 bg-accent" />
            <CardContent className="p-3 md:p-4 md:pl-5 flex items-center justify-center md:justify-between gap-2">
              <div className="min-w-0 flex-1 text-center md:text-left">
                <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
                <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              </div>
              <div className="hidden md:flex rounded-full p-2 bg-secondary text-primary dark:text-primary-foreground">
                <Icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
            <DropdownMenuItem onClick={() => setSortOption('default')}>Default (added order)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('name-asc')}>Name (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('name-desc')}>Name (Z-A)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('qty-asc')}>Quantity (Low to High)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('qty-desc')}>Quantity (High to Low)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        {items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-destructive" title="Clear all items">
                <XCircle className="h-4 w-4" /><span className="hidden sm:inline">Clear</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear the deck order?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {items.length} items from your deck order. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={handleDownloadPDF} title="Export as PDF">
          <Download className="h-4 w-4" /><span className="hidden sm:inline">PDF</span>
        </Button>
      </div>

      <div className="mx-4 mb-4 flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Table Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b">
          <div className="flex-1 min-w-0">PRODUCT</div>
          <div className="w-12 text-right shrink-0">QTY</div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-auto bg-card">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full bg-secondary p-4 text-primary dark:text-primary-foreground">
                <ListChecks className="h-8 w-8" />
              </div>
              <p className="text-base font-semibold text-foreground">Your deck order is empty</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Add items with the + button, or send stock straight from Stock Take.
              </p>
              <Button size="sm" className="mt-5 gap-1" onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add item
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {visibleItems.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div key={item.id}>
                    <div
                      className="flex items-center gap-2 px-3 py-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-1">
                        <span className={`font-medium text-sm text-foreground ${isExpanded ? 'break-words' : 'truncate'}`}>
                          {item.productName}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-sm font-medium shrink-0 w-12 text-right tabular-nums">{item.quantity}</span>
                    </div>

                    {isExpanded && (
                      <div className="px-4 py-3 bg-muted/30 border-t space-y-2">
                        <p className="text-sm"><span className="text-muted-foreground">Quantity:</span> {item.quantity}</p>
                        {item.colour && (
                          <p className="text-sm"><span className="text-muted-foreground">Colour:</span> {item.colour}</p>
                        )}
                        {item.size && (
                          <p className="text-sm"><span className="text-muted-foreground">Size:</span> {item.size}</p>
                        )}
                        {item.link && (
                          <a
                            href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="break-all">{item.link}</span>
                          </a>
                        )}
                        <div className="flex gap-2 pt-2 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating add button — kept clear of the install badge in the corner */}
      <div className="fixed bottom-24 right-6 z-50">
        <Button onClick={openAdd} className="w-14 h-14 rounded-full shadow-lg btn-add" title="Add item to deck order" aria-label="Add item to deck order">
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialog.kind !== 'closed'} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.kind === 'edit' ? 'Edit Item' : 'Add to Deck Order'}</DialogTitle>
            <DialogDescription>
              {dialog.kind === 'edit'
                ? 'Update the details for this item on your deck order.'
                : 'Add an item to your deck order. Only the name and quantity are needed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="do-product">Product Name</Label>
              <Input
                id="do-product"
                placeholder="e.g. Non-slip deck paint"
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="do-quantity">Quantity</Label>
                <Input
                  id="do-quantity"
                  placeholder="e.g. 10 packs"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="do-colour">Colour</Label>
                <Input
                  id="do-colour"
                  placeholder="Optional"
                  value={form.colour}
                  onChange={(e) => setForm({ ...form, colour: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="do-size">Size</Label>
                <Input
                  id="do-size"
                  placeholder="Optional"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="do-link">Link</Label>
                <Input
                  id="do-link"
                  placeholder="Optional URL"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                />
              </div>
            </div>
            {dialog.kind === 'edit' ? <Attachments parentType="deck_order" parentId={dialog.item.id} /> : <p className="text-xs text-muted-foreground">Add the item first, then tap it to attach photos or documents.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!form.productName.trim()}>
              {dialog.kind === 'edit' ? 'Save' : 'Add to Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeckOrderList;
