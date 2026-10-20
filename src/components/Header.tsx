import { useState } from 'react';
import { Search, Bell, Menu, Trash2, RotateCcw, Ship, UserRound } from 'lucide-react';
import yachtcountLogo from '@/assets/yachtcount-logo.png';
import ThemeToggle from './ThemeToggle';
import { CrewPanel } from './CrewPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Notification, TabType } from '@/types/inventory';
interface HeaderProps {
  activeTab: TabType;
  crewName?: string;
  vesselName?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onMenuClick?: () => void;
  notifications: Notification[];
  onClearNotifications: () => void;
  onRestoreItem?: (notificationId: number) => void;
  onLogout?: () => void;
}
const Header = ({
  activeTab,
  crewName,
  vesselName,
  searchTerm,
  onSearchChange,
  onMenuClick,
  notifications,
  onClearNotifications,
  onRestoreItem,
  onLogout
}: HeaderProps) => {
  const [showSearch, setShowSearch] = useState(false);
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const unreadCount = notifications.length;
  return <header id="yc-app-header" className="bg-primary text-primary-foreground sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3 md:min-h-[80px] md:gap-6 md:pt-0 md:pb-[10px] md:pl-3 md:pr-6">
        {/* Left: Menu, Logo & Vessel/Crew bubble */}
        <div className="flex min-w-0 items-center gap-3 md:flex-1 md:gap-5">
          <Button title="Open menu" aria-label="Open menu" variant="ghost" size="icon" className="text-primary-foreground hover:bg-sidebar-accent md:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex shrink-0 items-center gap-2 md:gap-6">
            {/* Logo lives in the sidebar rail on larger screens; mobile keeps it here */}
            <img src={yachtcountLogo} alt="YachtCount Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain rounded" />
            <span className="font-bold text-xl md:text-2xl font-sans">YachtCount</span>
          </div>
          {(vesselName || crewName) && <div className="hidden min-w-0 items-center gap-2 rounded-full border border-primary-foreground/20 bg-navy-dark px-3 py-1 md:flex">
              {vesselName && <span className="flex min-w-0 items-center gap-1.5">
                  <Ship className="h-3.5 w-3.5 shrink-0 text-primary-foreground/70" />
                  <span className="truncate text-xs font-medium leading-none">{vesselName}</span>
                </span>}
              {vesselName && crewName && <span className="h-3.5 w-px shrink-0 bg-primary-foreground/20" aria-hidden="true" />}
              {crewName && <span className="flex min-w-0 items-center gap-1.5 text-primary-foreground/85">
                  <UserRound className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-xs leading-none">{crewName}</span>
                </span>}
            </div>}
        </div>


        {/* Right: Theme, Search & Notifications */}
        <div className="hidden md:flex md:max-w-sm md:flex-1 items-center gap-2 rounded-full border border-primary-foreground/15 bg-navy-dark px-4 h-10 focus-within:border-primary-foreground/40">
          <Search className="h-4 w-4 shrink-0 text-primary-foreground/60" />
          <input type="search" aria-label="Search products" placeholder="Search products…" value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="w-full bg-transparent text-sm text-primary-foreground placeholder:text-primary-foreground/50 outline-none" />
        </div>

        <div className="flex items-center gap-1 md:shrink-0">
          <CrewPanel />
          {/* Theme Toggle */}
          <ThemeToggle />
          {/* Search Popover */}
          <Popover open={showSearch} onOpenChange={setShowSearch}>
            <PopoverTrigger asChild className="md:hidden">
              <Button title="Search products" aria-label="Search products" variant="ghost" size="icon" className="text-primary-foreground hover:bg-sidebar-accent">
                <Search className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="end">
              <div className="space-y-2">
                <p className="text-sm font-medium">Search Products</p>
                <Input type="text" placeholder="Search..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} autoFocus />
                {searchTerm && <Button variant="ghost" size="sm" className="w-full" onClick={() => {
                onSearchChange('');
                setShowSearch(false);
              }}>
                    Clear Search
                  </Button>}
              </div>
            </PopoverContent>
          </Popover>

          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button title="Notifications" aria-label="Notifications" variant="ghost" size="icon" className="text-primary-foreground hover:bg-sidebar-accent relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive rounded-full text-xs flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3 border-b flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {notifications.length > 0 && <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClearNotifications}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>}
              </div>
              <ScrollArea className="h-64">
                {notifications.length === 0 ? <div className="p-6 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div> : <div className="divide-y">
                    {notifications.map(notif => <div key={notif.id} className="p-3 hover:bg-muted/50">
                        <p className="text-sm">{notif.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(notif.timestamp)}
                          </p>
                          {notif.type === 'deleted' && notif.deletedItemData && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs gap-1 text-primary hover:text-primary"
                              onClick={() => onRestoreItem?.(notif.id)}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>)}
                  </div>}
              </ScrollArea>
            </PopoverContent>
          </Popover>

        </div>
      </div>

    </header>;
};
export default Header;