import { useEffect, useState } from 'react';
import { Ship, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizeCrewName } from '@/lib/crew';
import { VesselManagement } from './VesselManagement';

/** Platform-owner-only tool for creating a new paying vessel and its first Admin. */
export function ProvisionVesselPanel() {
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [vesselName, setVesselName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'create'|'vessels'>('vessels');
  const [handover, setHandover] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle();
      setAllowed(Boolean(data));
    })();
  }, []);

  if (!allowed) return null;

  const reset = () => { setVesselName(''); setAdminName(''); setPassword(''); setHandover(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let name: string;
    try { name = normalizeCrewName(adminName); } catch { toast.error('Enter a valid full name'); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('crew-access', { body: { action: 'provision', vesselName, username: name, password } });
    setBusy(false);
    let message = data?.error;
    if (error && 'context' in error) { try { message = (await error.context.json()).error; } catch { /* generic */ } }
    if (error || message) { toast.error(message || 'Unable to create vessel'); return; }
    setHandover(`Welcome to YachtCount — ${vesselName.trim()}\n\nOpen: ${window.location.origin}\nName: ${name}\nVessel password: ${password}\n\nYou are the vessel Admin. Add your crew from the Crew button (top right); they sign in with their full name and the same vessel password.`);
    toast.success('Vessel created');
  };

  return <>
    <Button variant="ghost" size="icon" aria-label="Manage vessels" title="Manage vessels" className="text-primary-foreground" onClick={() => { reset(); setOpen(true); }}><Ship /></Button>
    <Dialog open={open} onOpenChange={v => { if (!busy) setOpen(v); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Vessels</DialogTitle></DialogHeader>
        <div className="flex gap-2">{(['vessels','create'] as const).map(t=><Button key={t} size="sm" variant={tab===t?'default':'outline'} onClick={()=>setTab(t)}>{t==='vessels'?'All vessels':'Create new'}</Button>)}</div>
        {tab==='vessels' ? <VesselManagement /> : <>
        {handover ? <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Send these details to the vessel's Admin:</p>
          <pre className="whitespace-pre-wrap rounded-md border border-border bg-muted p-3 text-sm">{handover}</pre>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => { void navigator.clipboard.writeText(handover); toast.success('Copied'); }}><Copy className="mr-2 h-4 w-4" />Copy</Button>
            <Button variant="outline" className="flex-1" onClick={reset}>Create another</Button>
          </div>
        </div> : <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2"><Label htmlFor="pv-vessel">Vessel name</Label><Input id="pv-vessel" value={vesselName} onChange={e => setVesselName(e.target.value)} required maxLength={100} placeholder="e.g. M/Y Elysium" /></div>
          <div className="space-y-2"><Label htmlFor="pv-admin">Admin full name</Label><Input id="pv-admin" value={adminName} onChange={e => setAdminName(e.target.value)} required minLength={3} maxLength={100} placeholder="e.g. John Smith" autoCapitalize="words" /></div>
          <div className="space-y-2"><Label htmlFor="pv-pass">Vessel password</Label><Input id="pv-pass" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={100} autoComplete="off" /></div>
          <p className="text-xs text-muted-foreground">This creates a separate, empty vessel. Its crew can never see your vessel's data.</p>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Creating…' : 'Create vessel'}</Button>
        </form>}</>}
      </DialogContent>
    </Dialog>
  </>;
}
