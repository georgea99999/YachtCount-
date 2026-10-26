// @refresh reset
import { useEffect, useState } from 'react';
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
import { useCrew } from '@/hooks/useCrew';
import { CrewPanel } from '@/components/CrewPanel';

interface IndexProps {
  onLogout?: () => void;
}

const Index = ({ onLogout }: IndexProps) => {
  const {crew,loading:crewLoading,refresh:refreshCrew}=useCrew();
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Keep the sidebar rail starting exactly below the sticky header.
  // Re-runs when crewLoading flips because the header only renders once crew resolves.
  useEffect(() => {
    if (crewLoading) return;
    const el = document.getElementById('yc-app-header');
    if (!el) return;
    const update = () => setHeaderHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [crewLoading]);
  
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
    deleteBox,
    restoreFromNotification,
  } = useInventory(crew?.vesselId);

  const {
    orderItems,
    addOrderItem,
    updateOrderItem,
    deleteOrderItem,
    clearOrderItems,
  } = useDeckOrder(crew?.vesselId);

  const handleBoxChange = (value: string) => {
    setSelectedBox(value === 'all' ? '' : value);
  };

  const handleSendToDeckOrder = (item: Omit<typeof orderItems[0], 'id'>) => {
    addOrderItem(item);
    toast.success(`"${item.productName}" added to Deck Order`);
  };

  if(crewLoading) return <div className="p-6 text-muted-foreground">Loading crew…</div>;
  if(!crew) return <div className="min-h-screen bg-background"><CrewPanel setup onReady={()=>{void refreshCrew();}} /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header
        activeTab={activeTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuClick={() => setSidebarOpen(true)}
        notifications={notifications}
        onClearNotifications={clearNotifications}
        onRestoreItem={restoreFromNotification}
        onLogout={onLogout}
        crewName={crew.username}
        vesselName={crew.vesselName}
      />

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={onLogout}
          headerHeight={headerHeight}
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
                canDelete={crew.canDeleteItems}
                totalItems={totalItems}
                totalQuantity={totalQuantity}
                onSendToDeckOrder={handleSendToDeckOrder}
                usageHistory={usageHistory}
                onReorderItems={reorderStockItems}
                onRenameBox={renameBox}
                onImportItems={addStockItems}
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

            {activeTab === 'tasks' && <TaskList crewMembers={[]} />}

            {activeTab === 'reports' && (
              <MonthlyReport
                usageHistory={usageHistory}
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
          onAddItems={addStockItems}
          customBoxes={customBoxes}
          existingBoxes={Array.from(new Set(stockItems.map(i => i.box)))}
          onAddCustomBox={addCustomBox}
          canDeleteBoxes={crew.owner}
          onDeleteBox={deleteBox}
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
