import { UserRound, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CrewPanel } from './CrewPanel';
import { ProvisionVesselPanel } from './ProvisionVesselPanel';

interface MobileProfileMenuProps {
  vesselName?: string;
  crewName?: string;
  crewRole?: string;
}

export function MobileProfileMenu({ vesselName, crewName, crewRole }: MobileProfileMenuProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" title="Profile" aria-label="Profile" className="h-9 w-9 text-primary-foreground hover:bg-sidebar-accent md:hidden">
        <UserRound className="h-5 w-5" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-72 max-w-[calc(100vw-2rem)] p-0">
      <div className="border-b border-border bg-muted/50 px-4 py-4">
        <p className="break-words text-sm font-semibold">{vesselName}</p>
        <p className="mt-1 break-words text-sm text-muted-foreground">{crewName}</p>
        {crewRole && <p className="mt-1 text-xs font-medium text-accent">{crewRole}</p>}
      </div>
      <div className="p-1">
        <CrewPanel menuTrigger />
        <ProvisionVesselPanel menuTrigger />
      </div>
      <div className="flex min-h-14 items-center justify-between gap-3 border-t border-border px-4 py-3">
        <label htmlFor="mobile-dark-mode" className="flex items-center gap-3 text-sm font-medium"><Moon className="h-5 w-5" />Dark mode</label>
        <Switch id="mobile-dark-mode" checked={resolvedTheme === 'dark'} onCheckedChange={dark => setTheme(dark ? 'dark' : 'light')} />
      </div>
    </PopoverContent>
  </Popover>;
}