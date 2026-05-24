import { useState } from 'react';
import { TabType } from '@/types/inventory';
import { useInventory } from '@/hooks/useInventory';
import { useDeckOrder } from '@/hooks/useDeckOrder';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import StockList from '@/components/inventory/StockList';
import MonthlyReport from '@/components/reports/MonthlyReport';
import DeckOrderList from '@/components/deckorder/DeckOrderList';
import TaskList from '@/components/tasks/TaskList';
import UndoNotification from '@/components/UndoNotification';
import FloatingAddButton from '@/components/FloatingAddButton';
import { toast } from 'sonner';

interface IndexProps {
  onLogout?: () => void;
}

const Index = ({ onLogout }: IndexProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const {
    stockItems,
    filteredItems,
    deletedItems,
    notifications,
    customBoxes,
    searchTerm,
    setSearchTerm,
    selectedBox,
    setSelectedBox,
    totalItems,
    totalQuantity,
    availableMonths,
    usageHistory,
    addStockItem,
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
  } = useInventory();

  const {
    orderItems,
    addOrderItem,
    updateOrderItem,
    deleteOrderItem,
    clearOrderItems,
  } = useDeckOrder();

  const handleBoxChange = (value: string) => {
    setSelectedBox(value === 'all' ? '' : value);
  };

  const handleSendToDeckOrder = (item: Omit<typeof orderItems[0], 'id'>) => {
    addOrderItem(item);
    toast.success(`"${item.productName}" added to Deck Order`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuClick={() => setSidebarOpen(true)}
        notifications={notifications}
        onClearNotifications={clearNotifications}
        onRestoreItem={restoreFromNotification}
        onLogout={onLogout}
      />

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={onLogout}
        />

        {/* Main Content */}
        <main className="flex-1 md:ml-16 flex flex-col overflow-hidden">
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'stock' && (
              <StockList
                items={filteredItems}
                allItems={stockItems}
                searchTerm={searchTerm}
                selectedBox={selectedBox}
                onBoxChange={handleBoxChange}
                onUpdateQuantity={updateStockQuantity}
                onUpdateQuantityDirect={updateStockQuantityDirect}
                onEditItem={editStockItem}
                onDelete={deleteStockItem}
                totalItems={totalItems}
                totalQuantity={totalQuantity}
                onSendToDeckOrder={handleSendToDeckOrder}
                usageHistory={usageHistory}
                onReorderItems={reorderStockItems}
                onRenameBox={renameBox}
              />
            )}

            {activeTab === 'deckOrder' && (
              <DeckOrderList
                items={orderItems}
                onAddItem={addOrderItem}
                onUpdateItem={updateOrderItem}
                onDeleteItem={deleteOrderItem}
                onClearAll={clearOrderItems}
              />
            )}

            {activeTab === 'reports' && (
              <MonthlyReport
                availableMonths={availableMonths}
                getMonthlyUsage={getMonthlyUsage}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Add Button - only show on stock tab */}
      {activeTab === 'stock' && (
        <FloatingAddButton 
          onAddItem={addStockItem} 
          customBoxes={customBoxes}
          onAddCustomBox={addCustomBox}
        />
      )}

      {/* Undo Notification */}
      <UndoNotification
        show={deletedItems.length > 0}
        onUndo={undoDelete}
        onDismiss={() => {}}
      />
    </div>
  );
};

export default Index;
