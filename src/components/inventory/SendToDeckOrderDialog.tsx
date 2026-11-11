import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StockItem, DeckOrderItem } from '@/types/inventory';

interface SendToDeckOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StockItem | null;
  onConfirm: (orderItem: Omit<DeckOrderItem, 'id'>) => void;
}

const SendToDeckOrderDialog = ({ open, onOpenChange, item, onConfirm }: SendToDeckOrderDialogProps) => {
  const [productName, setProductName] = useState(item?.name ?? '');
  const [quantity, setQuantity] = useState('1');
  const [colour, setColour] = useState('');
  const [size, setSize] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    if (open) setProductName(item?.name ?? '');
  }, [open, item?.id, item?.name]);

  const handleConfirm = () => {
    if (item && productName.trim()) {
      onConfirm({
        productName: productName.trim(),
        quantity: quantity || '1',
        colour,
        size,
        link,
      });
      // Reset form
      setQuantity('1');
      setColour('');
      setSize('');
      setLink('');
      onOpenChange(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form on close
      setQuantity('1');
      setColour('');
      setSize('');
      setLink('');
    }
    onOpenChange(isOpen);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Deck Order</DialogTitle>
          <DialogDescription>
            Add "{item.name}" to your deck order. Adjust the details below before sending.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="product-name">Product Name</Label>
            <Input
              id="product-name"
              value={productName}
              onChange={e => setProductName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                placeholder="e.g. 10 packs"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="colour">Colour</Label>
              <Input
                id="colour"
                placeholder="Optional"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                placeholder="Optional"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                placeholder="Optional URL"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!productName.trim()}>
            Add to Deck Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendToDeckOrderDialog;
