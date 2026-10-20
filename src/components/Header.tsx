import { useState } from 'react';
import { Search, Bell, Menu, Trash2, LogOut, RotateCcw } from 'lucide-react';
import yachtcountLogo from '@/assets/yachtcount-logo.png';
import ThemeToggle from './ThemeToggle';
import { CrewPanel } from './CrewPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Notification } from '@/types/inventory';
interface HeaderProps {
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
      <div className="flex items-center justify-between px-4 py-3 md:pr-6">
        {/* Left: Menu & Logo */}
        <div className="flex items-center gap-3">
          <Button title="Open menu" aria-label="Open menu" variant="ghost" size="icon" className="text-primary-foreground hover:bg-sidebar-accent md:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            {/* Logo lives in the sidebar rail on larger screens; mobile keeps it here */}
            <img src={yachtcountLogo} alt="YachtCount Logo" className="w-10 h-10 object-contain rounded md:hidden" />
            <span className="font-bold tracking-tight text-2xl font-sans">YachtCount</span>
          </div>
        </div>

        {/* Right: Theme, Search & Notifications */}
        <div className="flex items-center gap-1">
          <CrewPanel />
          {/* Theme Toggle */}
          <ThemeToggle />
          {/* Search Popover */}
          <Popover open={showSearch} onOpenChange={setShowSearch}>
            <PopoverTrigger asChild>
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

      <div className="px-4 pb-2 md:pr-6 text-xs text-primary-foreground/80 flex flex-wrap gap-x-3"><span>{vesselName}</span><span>{crewName}</span></div>
      {/* Slogan */}
      <div className="px-4 pb-3 md:pr-6">
        <p className="text-sm text-primary-foreground/80 italic">
          Professional Inventory Systems for Maritime Excellence.
        </p>
      </div>
    </header>;
};
export default Header;