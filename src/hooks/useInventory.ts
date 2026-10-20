import { useState, useEffect, useCallback } from 'react';
import { StockItem, UsageEntry, Notification } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};

export function useInventory(vesselId?: string) {
  const [storageKey, setStorageKey] = useState('yachtCountNotifications:pending');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deletedItems, setDeletedItems] = useState<{ item: StockItem; index: number }[]>([]);
  const [customBoxes, setCustomBoxes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBox, setSelectedBox] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const key = `yachtCountNotifications:${vesselId ?? 'legacy'}`;
      setStorageKey(key);
      
      // Load stock items
      const { data: stockData, error: stockError } = await supabase
        .from('stock_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (stockError) {
        console.error('Error loading stock items:', stockError);
        setStockItems([]);
      } else if (stockData && stockData.length > 0) {
        setStockItems(stockData.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          box: item.box,
        })));
      } else {
        // No data in DB — start with a clean slate
        setStockItems([]);
      }

      // Load usage history
      const { data: usageData, error: usageError } = await supabase
        .from('usage_history')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (!usageError && usageData) {
        setUsageHistory(usageData.map(entry => ({
          date: entry.recorded_at,
          itemName: entry.item_name,
          box: entry.box,
          quantity: entry.quantity,
          actorUsername: entry.actor_username ?? undefined,
        })));
      }

      // Load custom boxes
      const { data: boxesData, error: boxesError } = await supabase
        .from('custom_boxes')
        .select('name');

      if (!boxesError && boxesData) {
        setCustomBoxes(boxesData.map(b => b.name));
      }

      // Load notifications from localStorage (keeping local for now)
      const savedNotifications = localStorage.getItem(key);
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications));
        } catch {
          setNotifications([]);
        }
      }

      setIsLoading(false);
    };

    loadData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('stock-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_items',
        },
        async () => {
          // Reload stock items on any change
          const { data } = await supabase
            .from('stock_items')
            .select('*')
            .order('sort_order', { ascending: true });
          
          if (data) {
            setStockItems(data.map(item => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              box: item.box,
            })));
          }
        }
      )
      .on('postgres_changes', {event:'*',schema:'public',table:'custom_boxes'}, () => {void loadData();})
      .on('postgres_changes', {event:'*',schema:'public',table:'usage_history'}, () => {void loadData();})
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vesselId]);

  // Save notifications to localStorage
  const saveNotifications = useCallback((notifs: Notification[]) => {
    localStorage.setItem(storageKey, JSON.stringify(notifs));
  }, [storageKey]);

  // Add custom box
  const addCustomBox = useCallback(async (boxName: string) => {
    if (customBoxes.includes(boxName)) return;
    
    const userId = await getUserId();
    const { error } = await supabase
      .from('custom_boxes')
      .insert({ name: boxName, user_id: userId });

    if (!error) {
      setCustomBoxes(prev => [...prev, boxName]);
    }
  }, [customBoxes]);

  // Add notification
  const addNotification = useCallback((type: Notification['type'], itemName: string, message: string, deletedItemData?: Notification['deletedItemData']) => {
    const newNotification: Notification = {
      id: Date.now(),
      type,
      itemName,
      message,
      timestamp: new Date().toISOString(),
      deletedItemData,
    };
    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50);
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Add stock item
  const addStockItem = useCallback(async (name: string, quantity: number, box: string) => {
    if (!name.trim()) return;

    // Find the max sort_order for items in the same box
    const boxItems = stockItems.filter(i => i.box === box);
    const maxSortOrder = boxItems.length > 0 
      ? Math.max(...stockItems.map((_, idx) => idx)) + 1 
      : stockItems.length;

    const userId = await getUserId();
    const { data, error } = await supabase
      .from('stock_items')
      .insert({
        name: name.trim(),
        quantity,
        box,
        sort_order: maxSortOrder,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding stock item:', error);
      return;
    }

    if (data) {
      setStockItems(prev => {
        let insertIndex = prev.length;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].box === box) {
            insertIndex = i + 1;
            break;
          }
        }
        const updated = [...prev];
        updated.splice(insertIndex, 0, {
          id: data.id,
          name: data.name,
          quantity: data.quantity,
          box: data.box,
        });
        return updated;
      });
      setDeletedItems([]);
      addNotification('added', name.trim(), `Added "${name.trim()}" (${quantity}) to ${box}`);
    }
  }, [stockItems, addNotification]);

  // Add multiple stock items at once (bulk entry)
  const addStockItems = useCallback(async (items: { name: string; quantity: number; box: string }[]) => {
    const valid = items.filter(i => i.name.trim() && i.box);
    if (valid.length === 0) return false;

    const userId = await getUserId();
    const baseOrder = stockItems.length;
    const { data, error } = await supabase
      .from('stock_items')
      .insert(valid.map((i, idx) => ({
        name: i.name.trim(),
        quantity: i.quantity,
        box: i.box,
        sort_order: baseOrder + idx,
        user_id: userId,
      })))
      .select();

    if (error) {
      console.error('Error bulk adding stock items:', error);
      return false;
    }

    if (data) {
      setStockItems(prev => [
        ...prev,
        ...data.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          box: item.box,
        })),
      ]);
      setDeletedItems([]);
      addNotification('added', valid[0].name.trim(), `Added ${valid.length} items to inventory`);
      return true;
    }
    return false;
  }, [stockItems, addNotification]);

  const applyQuantity = useCallback(async (id: string, delta?: number, absolute?: number) => {
    const { data, error } = await supabase.rpc('adjust_stock', { item_id: id, delta, absolute_quantity: absolute });
    if (error) { console.error('Unable to save quantity:', error); return; }
    setStockItems(prev => prev.map(i => i.id === id ? {...i, quantity: data} : i));
    const {data:history} = await supabase.from('usage_history').select('*').order('recorded_at',{ascending:false});
    if(history) setUsageHistory(history.map(e=>({date:e.recorded_at,itemName:e.item_name,box:e.box,quantity:e.quantity,actorUsername:e.actor_username??undefined})));
  }, []);
  const updateStockQuantity = useCallback((id: string, change: number) => applyQuantity(id, change), [applyQuantity]);
  const updateStockQuantityDirect = useCallback((id: string, value: number) => applyQuantity(id, undefined, value), [applyQuantity]);

  // Edit stock item (name and box)
  const editStockItem = useCallback(async (id: string, updates: { name: string; box: string }) => {
    const { error } = await supabase
      .from('stock_items')
      .update({ name: updates.name, box: updates.box })
      .eq('id', id);

    if (error) {
      console.error('Error editing stock item:', error);
      return;
    }

    setStockItems(prev =>
      prev.map(i => (i.id === id ? { ...i, name: updates.name, box: updates.box } : i))
    );
    addNotification('updated', updates.name, `Updated "${updates.name}" to ${updates.box}`);
  }, [addNotification]);

  // Delete stock item
  const deleteStockItem = useCallback(async (id: string) => {
    const itemIndex = stockItems.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const deletedItem = stockItems[itemIndex];

    const { data: removed, error } = await supabase
      .from('stock_items')
      .delete()
      .eq('id', id)
      .select('id');

    if (error || !removed?.length) {
      console.error('Error deleting stock item:', error);
      return;
    }

    setDeletedItems([{ item: deletedItem, index: itemIndex }]);
    addNotification('deleted', deletedItem.name, `Removed "${deletedItem.name}" from ${deletedItem.box}`, {
      name: deletedItem.name,
      quantity: deletedItem.quantity,
      box: deletedItem.box,
      originalIndex: itemIndex,
    });
    setStockItems(prev => prev.filter(i => i.id !== id));
  }, [stockItems, addNotification]);

  // Undo delete - restore item
  const undoDelete = useCallback(async () => {
    if (deletedItems.length === 0) return;

    const restored = deletedItems[0];

    const userId = await getUserId();
    const { data, error } = await supabase
      .from('stock_items')
      .insert({
        name: restored.item.name,
        quantity: restored.item.quantity,
        box: restored.item.box,
        sort_order: restored.index,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error restoring item:', error);
      return;
    }

    if (data) {
      setStockItems(prev => {
        const updated = [...prev];
        const insertIndex = Math.min(restored.index, updated.length);
        updated.splice(insertIndex, 0, {
          id: data.id,
          name: data.name,
          quantity: data.quantity,
          box: data.box,
        });
        return updated;
      });
      setDeletedItems([]);
    }
  }, [deletedItems]);

  // Filter items - exact word matching
  const filteredItems = stockItems.filter(item => {
    const matchesBox = !selectedBox || selectedBox === 'all' || item.box === selectedBox;

    if (!searchTerm.trim()) {
      return matchesBox;
    }

    const searchWords = searchTerm.toLowerCase().trim().split(/\s+/);
    const itemNameLower = item.name.toLowerCase();
    const matchesSearch = searchWords.every(word => itemNameLower.includes(word));

    return matchesSearch && matchesBox;
  });

  // Stats
  const totalItems = stockItems.length;
  const totalQuantity = stockItems.reduce((sum, item) => sum + item.quantity, 0);

  // Get unique months from usage history
  const availableMonths = Array.from(
    new Set(
      usageHistory.map(entry => {
        const d = new Date(entry.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  ).sort().reverse();

  // Get usage for a specific month
  const getMonthlyUsage = useCallback((monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNum = parseInt(month) - 1;

    const monthly = usageHistory.filter(entry => {
      const d = new Date(entry.date);
      return d.getFullYear() === parseInt(year) && d.getMonth() === monthNum;
    });

    const aggregated: Record<string, { itemName: string; box: string; quantity: number }> = {};
    monthly.forEach(entry => {
      const key = `${entry.itemName}|${entry.box}`;
      if (!aggregated[key]) {
        aggregated[key] = { itemName: entry.itemName, box: entry.box, quantity: 0 };
      }
      aggregated[key].quantity += entry.quantity;
    });

    return Object.values(aggregated).sort((a, b) => b.quantity - a.quantity);
  }, [usageHistory]);

  // Rename a box across all items and tables
  const renameBox = useCallback(async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;

    // Update stock_items
    const { error: stockErr } = await supabase
      .from('stock_items')
      .update({ box: newName })
      .eq('box', oldName);

    if (stockErr) {
      console.error('Error renaming box in stock_items:', stockErr);
      return;
    }

    // Update custom_boxes if it was a custom box
    const userId = await getUserId();
    if (customBoxes.includes(oldName)) {
      await supabase.from('custom_boxes').delete().eq('name', oldName);
      await supabase.from('custom_boxes').insert({ name: newName, user_id: userId });
      setCustomBoxes(prev => prev.map(b => b === oldName ? newName : b));
    }

    // Update local state
    setStockItems(prev => prev.map(i => i.box === oldName ? { ...i, box: newName } : i));
    setUsageHistory(prev => prev.map(e => e.box === oldName ? { ...e, box: newName } : e));
    addNotification('updated', oldName, `Renamed "${oldName}" to "${newName}"`);
  }, [customBoxes, addNotification]);

  // Reorder stock items
  const reorderStockItems = useCallback(async (reorderedItems: StockItem[]) => {
    setStockItems(reorderedItems);
    
    // Update sort_order in DB for all items
    const updates = reorderedItems.map((item, index) => 
      supabase
        .from('stock_items')
        .update({ sort_order: index })
        .eq('id', item.id)
    );
    
    await Promise.all(updates);
  }, []);

  // Restore a deleted item from notification data
  const restoreFromNotification = useCallback(async (notificationId: number) => {
    const notif = notifications.find(n => n.id === notificationId);
    if (!notif?.deletedItemData) return;

    const { name, quantity, box, originalIndex } = notif.deletedItemData;
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('stock_items')
      .insert({
        name,
        quantity,
        box,
        sort_order: originalIndex,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error restoring item:', error);
      return;
    }

    if (data) {
      setStockItems(prev => {
        const updated = [...prev];
        const insertIndex = Math.min(originalIndex, updated.length);
        updated.splice(insertIndex, 0, {
          id: data.id,
          name: data.name,
          quantity: data.quantity,
          box: data.box,
        });
        return updated;
      });

      // Remove the notification
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notificationId);
        saveNotifications(updated);
        return updated;
      });

      addNotification('added', name, `Restored "${name}" to ${box}`);
    }
  }, [notifications, addNotification, saveNotifications]);

  return {
    stockItems,
    filteredItems,
    usageHistory,
    notifications,
    deletedItems,
    customBoxes,
    searchTerm,
    setSearchTerm,
    selectedBox,
    setSelectedBox,
    totalItems,
    totalQuantity,
    availableMonths,
    addStockItem,
    addStockItems,
    updateStockQuantity,
    updateStockQuantityDirect,
    editStockItem,
    deleteStockItem,
    undoDelete,
    getMonthlyUsage,
    clearNotifications,
    addCustomBox,
    reorderStockItems,
    renameBox,
    restoreFromNotification,
    isLoading,
  };
}
