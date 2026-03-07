import { useState } from 'react';
import { Plus, Download, Trash2, ChevronDown, ChevronUp, ExternalLink, XCircle, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DeckOrderItem } from '@/types/inventory';
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

interface DeckOrderListProps {
  items: DeckOrderItem[];
  onAddItem: (item: Omit<DeckOrderItem, 'id'>) => void;
  onUpdateItem: (id: number, updates: Partial<Omit<DeckOrderItem, 'id'>>) => void;
  onDeleteItem: (id: number) => void;
  onClearAll: () => void;
}

const DeckOrderList = ({ items, onAddItem, onUpdateItem, onDeleteItem, onClearAll }: DeckOrderListProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    productName: '',
    quantity: '',
    colour: '',
    size: '',
    link: '',
  });
  const [newItem, setNewItem] = useState({
    productName: '',
    quantity: '',
    colour: '',
    size: '',
    link: '',
  });

  const handleAddItem = () => {
    if (newItem.productName.trim()) {
      onAddItem({
        productName: newItem.productName.trim(),
        quantity: newItem.quantity.trim() || '1',
        colour: newItem.colour.trim(),
        size: newItem.size.trim(),
        link: newItem.link.trim(),
      });
      setNewItem({ productName: '', quantity: '', colour: '', size: '', link: '' });
      setIsAdding(false);
    }
  };

  const handleStartEdit = (item: DeckOrderItem) => {
    setEditingId(item.id);
    setEditForm({
      productName: item.productName,
      quantity: item.quantity,
      colour: item.colour,
      size: item.size,
      link: item.link,
    });
  };

  const handleSaveEdit = () => {
    if (editingId && editForm.productName.trim()) {
      onUpdateItem(editingId, {
        productName: editForm.productName.trim(),
        quantity: editForm.quantity.trim() || '1',
        colour: editForm.colour.trim(),
        size: editForm.size.trim(),
        link: editForm.link.trim(),
      });
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ productName: '', quantity: '', colour: '', size: '', link: '' });
  };

  const handleDownloadPDF = () => {
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
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #1a365d; margin-bottom: 5px; }
          .date { color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #5f8b9a; color: white; padding: 12px 8px; text-align: left; }
          td { padding: 10px 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          a { color: #5f8b9a; }
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

  const isLongName = (name: string) => name.length > 10;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Deck Order</h2>
            <p className="text-sm text-muted-foreground">
              {items.length} items in order
            </p>
          </div>
          <div className="flex gap-2">
            {items.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {items.length} items from your deck order.
                      This action cannot be undone.
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
            <Button
              onClick={() => setIsAdding(true)}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      {/* Add Item Form */}
      {isAdding && (
        <div className="p-4 border-b bg-accent/20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <Input
              placeholder="Product Name *"
              value={newItem.productName}
              onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })}
              autoFocus
            />
            <Input
              placeholder="Colour"
              value={newItem.colour}
              onChange={(e) => setNewItem({ ...newItem, colour: e.target.value })}
            />
            <Input
              placeholder="Size"
              value={newItem.size}
              onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
            />
            <Input
              placeholder="Quantity (e.g. 10 packs)"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            />
            <Input
              placeholder="Link (optional)"
              value={newItem.link}
              onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
              className="md:col-span-2"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddItem} disabled={!newItem.productName.trim()}>
              Add to Order
            </Button>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium">
        <div className="flex-1 min-w-0">Product</div>
        <div className="w-20 text-center flex-shrink-0">Qty</div>
        <div className="w-20 text-center flex-shrink-0">Actions</div>
      </div>

      {/* Items List */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No items in deck order yet.</p>
            <p className="text-sm mt-1">Click "Add Item" to start your order.</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => {
              const hasLongName = isLongName(item.productName);
              const isExpanded = expandedId === item.id;
              const isEditing = editingId === item.id;
              
              if (isEditing) {
                return (
                  <div key={item.id} className="p-4 bg-accent/20">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <Input
                        placeholder="Product Name *"
                        value={editForm.productName}
                        onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                        autoFocus
                      />
                      <Input
                        placeholder="Colour"
                        value={editForm.colour}
                        onChange={(e) => setEditForm({ ...editForm, colour: e.target.value })}
                      />
                      <Input
                        placeholder="Size"
                        value={editForm.size}
                        onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                      />
                      <Input
                        placeholder="Quantity (e.g. 10 packs)"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                      />
                      <Input
                        placeholder="Link (optional)"
                        value={editForm.link}
                        onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
                        className="md:col-span-2"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit} disabled={!editForm.productName.trim()}>
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.id}>
                  <div 
                    className="flex items-center gap-2 px-4 py-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <span className={isExpanded ? "font-medium break-words" : "font-medium truncate"}>{item.productName}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {/* Expanded details panel */}
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
                          onClick={(e) => { e.stopPropagation(); handleStartEdit(item); }}
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
      </ScrollArea>

      {/* Download Button */}
      {items.length > 0 && (
        <div className="p-4 border-t bg-muted/30">
          <Button
            onClick={handleDownloadPDF}
            className="w-full gap-2"
            variant="default"
          >
            <Download className="h-4 w-4" />
            Download as PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default DeckOrderList;
