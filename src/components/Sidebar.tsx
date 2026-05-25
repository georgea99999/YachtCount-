import { Home, BarChart3, ClipboardList, ListTodo, LogOut } from 'lucide-react';
import { TabType } from '@/types/inventory';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

const tabs = [
  { id: 'stock' as TabType, label: 'Stock Take', icon: Home },
  { id: 'deckOrder' as TabType, label: 'Deck Order', icon: ClipboardList },
  { id: 'tasks' as TabType, label: 'To Do', icon: ListTodo },
  { id: 'reports' as TabType, label: 'Monthly Report', icon: BarChart3 },
];

const Sidebar = ({ activeTab, onTabChange, isOpen = true, onClose, onLogout }: SidebarProps) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full w-16 bg-primary z-50 flex flex-col pt-20 transition-transform duration-300",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                onClose?.();
              }}
              className={cn(
                "relative flex flex-col items-center py-4 transition-all duration-200 group",
                isActive && "bg-accent"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-full" />
              )}
              
              {/* Icon */}
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isActive ? "bg-accent text-accent-foreground" : "text-primary-foreground/70 group-hover:text-primary-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              
              {/* Vertical text label */}
              <span 
                className={cn(
                  "vertical-text text-xs font-medium mt-2 tracking-wide",
                  isActive ? "text-accent-foreground" : "text-primary-foreground/70 group-hover:text-primary-foreground"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
        
        {/* Logout button at bottom */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-auto mb-6 flex flex-col items-center py-4 transition-all duration-200 group"
          >
            <div className="p-2 rounded-lg transition-colors text-primary-foreground/70 group-hover:text-primary-foreground">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="vertical-text text-xs font-medium mt-2 tracking-wide text-primary-foreground/70 group-hover:text-primary-foreground">
              Logout
            </span>
          </button>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
