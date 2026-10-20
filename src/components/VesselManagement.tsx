import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Vessel = { id: string; name: string; created_at: string; active: boolean; crewCount: number; activeCrew: number; admins: string[]; ownVessel: boolean };

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('crew-access', { body });
  let message = data?.error;
  if (error && 'context' in error) { try { message = (await error.context.json()).error; } catch { /* generic */ } }
  return { data, message: error || message ? (message || 'Request failed') : null };
}

/** Platform-owner view of every provisioned yacht. */
export function VesselManagement() {
  const [vessels, setVessels] = useState<Vessel[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, message } = await call({ action: 'list-vessels' });
    if (message) { toast.error(message); setVessels([]); return; }
    setVessels(data.vessels);
  };
  useEffect(() => { void load(); }, []);

  const toggle = async (v: Vessel) => {
    setBusy(true);
    const { message } = await call({ action: 'set-vessel-active', vesselId: v.id, active: !v.active });
    setBusy(false); setConfirming(null);
    if (message) { toast.error(message); return; }
    toast.success(v.active ? `${v.name} deactivated` : `${v.name} reactivated`);
    void load();
  };

  if (!vessels) return <p className="text-sm text-muted-foreground">Loading vessels…</p>;
  if (!vessels.length) return <p className="text-sm text-muted-foreground">No vessels yet.</p>;

  return <ul className="divide-y divide-border">
    {vessels.map(v => <li key={v.id} className="space-y-2 py-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold break-words">{v.name}{v.ownVessel && <span className="ml-2 text-xs font-normal text-accent">Your vessel</span>}</p>
          <p className="text-xs text-muted-foreground">Created {new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p className="text-xs text-muted-foreground">Admin: {v.admins.join(', ') || 'None'}</p>
          <p className="text-xs text-muted-foreground">Crew: {v.activeCrew} active of {v.crewCount}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${v.active ? 'bg-accent/15 text-accent' : 'bg-destructive/15 text-destructive'}`}>{v.active ? 'Active' : 'Deactivated'}</span>
      </div>
      {!v.ownVessel && (confirming === v.id
        ? <div className="flex gap-2"><Button size="sm" variant="destructive" disabled={busy} onClick={() => void toggle(v)}>Confirm deactivate</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirming(null)}>Cancel</Button></div>
        : <Button size="sm" variant={v.active ? 'outline' : 'default'} disabled={busy} onClick={() => v.active ? setConfirming(v.id) : void toggle(v)}>{v.active ? 'Deactivate vessel' : 'Reactivate vessel'}</Button>)}
    </li>)}
  </ul>;
}
