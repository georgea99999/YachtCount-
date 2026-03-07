import { useState, useEffect, useCallback } from 'react';
import { DeckOrderItem } from '@/types/inventory';
import { yardOrderItems } from '@/data/yardOrderItems';

const STORAGE_KEY = 'yachtCountDeckOrder';

export function useDeckOrder() {
  const [orderItems, setOrderItems] = useState<DeckOrderItem[]>([]);

  // Load from localStorage on mount, seed with yard order if empty
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setOrderItems(parsed);
          return;
        }
      } catch {
        // fall through to seed
      }
    }
    // Seed with yard order items
    const seeded: DeckOrderItem[] = yardOrderItems.map((item, index) => ({
      ...item,
      id: Date.now() + index,
    }));
    setOrderItems(seeded);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  }, []);

  // Save to localStorage
  const saveOrderItems = useCallback((items: DeckOrderItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  // Add item
  const addOrderItem = useCallback((item: Omit<DeckOrderItem, 'id'>) => {
    setOrderItems(prev => {
      const newItem: DeckOrderItem = {
        ...item,
        id: Date.now(),
        link: item.link || '',
      };
      const updated = [...prev, newItem];
      saveOrderItems(updated);
      return updated;
    });
  }, [saveOrderItems]);

  // Update item
  const updateOrderItem = useCallback((id: number, updates: Partial<Omit<DeckOrderItem, 'id'>>) => {
    setOrderItems(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      saveOrderItems(updated);
      return updated;
    });
  }, [saveOrderItems]);

  // Delete item
  const deleteOrderItem = useCallback((id: number) => {
    setOrderItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveOrderItems(updated);
      return updated;
    });
  }, [saveOrderItems]);

  // Clear all items
  const clearOrderItems = useCallback(() => {
    setOrderItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    orderItems,
    addOrderItem,
    updateOrderItem,
    deleteOrderItem,
    clearOrderItems,
  };
}
