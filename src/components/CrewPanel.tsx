import { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCrew } from '@/hooks/useCrew';
import { normalizeCrewName } from '@/lib/crew';
export function CrewPanel({ setup = false, onReady }: {setup?:boolean;onReady?:()=>void}) {
  const {crew,members,refresh}=useCrew();
  const [open,setOpen]=useState(setup);
  const [vesselName,setVesselName]=useState('');
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const submit=async (event:React.FormEvent)=>{
    event.preventDefault();
    try { normalizeCrewName(username); } catch { toast.error('Enter a valid full name'); return; }
    setBusy(true);
    const {data,error}=await supabase.functions.invoke('crew-access',{body:{action:setup?'setup':'add',username,password,vesselName:setup?vesselName:undefined}});
    setBusy(false);
    let message=data?.error;
    if(error && 'context' in error) {try {message=(await error.context.json()).error;} catch { /* use generic error */ }}
    if(error || message) {toast.error(message || 'Unable to save crew details');return;}
    setPassword('');setUsername('');await refresh();
    toast.success(setup?'Vessel ready':'Crew member added');
    if(setup) onReady?.();
  };
  return <>
    {!setup && <Button variant="ghost" size="icon" aria-label="Crew" title="Crew" className="text-primary-foreground" onClick={()=>setOpen(true)}><Users /></Button>}
    <Dialog open={open} onOpenChange={value=>{if(!setup)setOpen(value);}}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{setup?'Admin vessel setup':crew?.vesselName || 'Crew'}</DialogTitle></DialogHeader>
        {!setup && <><p className="text-sm text-muted-foreground">{crew?.owner ? 'Vessel admin' : 'Crew member'} · {crew?.username}</p><ul className="divide-y divide-border">{members.map(name=><li className="py-3 text-sm break-words" key={name}>{name}</li>)}</ul></>}
        {(setup || crew?.owner) && <form className="space-y-4" onSubmit={submit}>
          {setup && <div className="space-y-2"><Label htmlFor="vessel-name">Vessel name</Label><Input id="vessel-name" value={vesselName} onChange={e=>setVesselName(e.target.value)} required maxLength={100}/></div>}
          <div className="space-y-2"><Label htmlFor="crew-name">{setup?'Admin full name':'Crew member full name'}</Label><Input id="crew-name" value={username} onChange={e=>setUsername(e.target.value)} required minLength={3} maxLength={100} placeholder="e.g. George Atkinson" autoCapitalize="words" autoComplete="name"/></div>
          <div className="space-y-2"><Label htmlFor="vessel-password">{setup?'Choose vessel password':'Vessel password'}</Label><Input id="vessel-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete="new-password"/></div>
          <p className="text-sm text-muted-foreground">{setup ? 'You will be the vessel admin. Sign in with your full name and this password. Existing stock stays with your vessel.' : 'Give this crew member the vessel password. They sign in using their full name and the same password.'}</p>
          {setup && <p className="text-xs text-muted-foreground">Email password recovery is not available for name-based logins.</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy?'Saving…':setup?'Create vessel':'Add crew member'}</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </>;
}
