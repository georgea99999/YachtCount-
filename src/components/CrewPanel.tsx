import { useState } from 'react';
import { Users, Pencil, UserX, KeyRound, X, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCrew } from '@/hooks/useCrew';
import { normalizeCrewName } from '@/lib/crew';
export function CrewPanel({ setup = false, onReady }: {setup?:boolean;onReady?:()=>void}) {
  const {crew,accounts,refresh}=useCrew();
  const [open,setOpen]=useState(setup);
  const [vesselName,setVesselName]=useState('');
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [editing,setEditing]=useState<{id:string;username:string}|null>(null);
  const [deactivating,setDeactivating]=useState<{id:string;username:string}|null>(null);
  const [removing,setRemoving]=useState<{id:string;username:string}|null>(null);
  const [editName,setEditName]=useState('');
  const [resetting,setResetting]=useState(false);
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const cancelAction=()=>{setEditing(null);setDeactivating(null);setRemoving(null);setResetting(false);setCurrentPassword('');setNewPassword('');setConfirmPassword('');};
  const manage=async(body:Record<string,string|boolean|null>,success:string)=>{
    setBusy(true);
    try {
      const {data,error}=await supabase.functions.invoke('crew-access',{body});
      let message=data?.error;
      if(error && 'context' in error) {try {message=(await error.context.json()).error;} catch { /* use generic error */ }}
      if(error || message) {toast.error(message || 'Unable to update crew access');return;}
      cancelAction();setPassword('');await refresh();toast.success(success);
    } catch {toast.error('Unable to update crew access');} finally {setBusy(false);}
  };
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
    <Dialog open={open} onOpenChange={value=>{if(!setup && !busy){setOpen(value);cancelAction();setPassword('');} if(value)void refresh();}}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{setup?'Admin vessel setup':crew?.vesselName || 'Crew'}</DialogTitle></DialogHeader>
        {!setup && <><p className="text-sm text-muted-foreground">{crew?.owner ? 'Admin' : crew?.canDeleteItems ? 'Junior admin' : 'Crew member'} · {crew?.username}</p><ul className="divide-y divide-border">{accounts.filter(person=>crew?.owner || person.active).map(person=><li className="flex items-center gap-2 py-3 text-sm" key={person.id}>
          <div className="min-w-0 flex-1"><span className="break-words">{person.username}</span>{person.role && person.active && <span className="block text-xs text-accent">{person.role==='owner'?'Admin':'Junior admin'}</span>}{!person.active && <span className="block text-xs text-muted-foreground">Inactive</span>}</div>
          {crew?.owner && <><Button variant="ghost" size="icon" disabled={busy} title={`Edit ${person.username}`} aria-label={`Edit ${person.username}`} onClick={()=>{cancelAction();setEditing(person);setEditName(person.username);}}><Pencil className="h-4 w-4"/></Button>{person.active && person.username!==crew.username && <>{(['owner','junior'] as const).map(level=>{const on=person.role===level;const label=level==='owner'?'Admin':'Junior admin';return <Button key={level} variant="ghost" size="icon" disabled={busy} className={on?'text-accent bg-accent/10':'text-muted-foreground'} title={on?`Remove ${label} from ${person.username}`:`Make ${person.username} ${label}`} aria-label={on?`Remove ${label} from ${person.username}`:`Make ${person.username} ${label}`} aria-pressed={on} onClick={()=>void manage({action:'set-admin',userId:person.id,role:on?null:level},on?`${person.username} is no longer ${label}`:`${person.username} is now ${label}`)}>{level==='owner'?<span className="relative inline-flex"><Shield className="h-4 w-4"/><span className="absolute inset-0 flex items-center justify-center text-[8px] leading-none">★</span></span>:<Shield className="h-4 w-4"/>}</Button>;})}</>}{!person.active && <Button variant="ghost" size="icon" disabled={busy} className="text-destructive" title={`Remove ${person.username}`} aria-label={`Remove ${person.username}`} onClick={()=>{cancelAction();setRemoving(person);}}><Trash2 className="h-4 w-4"/></Button>}{person.active && person.username!==crew.username && <Button variant="ghost" size="icon" disabled={busy} className="text-destructive" title={`Deactivate ${person.username}`} aria-label={`Deactivate ${person.username}`} onClick={()=>{cancelAction();setDeactivating(person);}}><UserX className="h-4 w-4"/></Button>}</>}
        </li>)}</ul></>}
        {crew?.owner && !setup && (editing || deactivating || removing || resetting) && <section className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-2"><h3 className="font-medium">{editing?'Edit crew name':deactivating?'Deactivate crew member':removing?'Remove crew member':'Reset vessel password'}</h3><Button variant="ghost" size="icon" disabled={busy} aria-label="Cancel account change" title="Cancel" onClick={cancelAction}><X className="h-4 w-4"/></Button></div>
          {editing && <form className="space-y-4" onSubmit={event=>{event.preventDefault();try {normalizeCrewName(editName);} catch {toast.error('Enter a valid full name');return;}void manage({action:'rename',userId:editing.id,username:editName},'Crew name updated');}}>
            <div className="space-y-2"><Label htmlFor="edit-crew-name">Full name</Label><Input id="edit-crew-name" value={editName} onChange={event=>setEditName(event.target.value)} minLength={3} maxLength={100} autoCapitalize="words" required disabled={busy}/></div>
            <p className="text-sm text-muted-foreground">They will sign in with the new name. Previous activity keeps its original name.</p><Button type="submit" disabled={busy} className="w-full">{busy?'Saving…':'Save name'}</Button>
          </form>}
          {deactivating && <><p className="text-sm text-muted-foreground">Remove {deactivating.username}’s vessel access? Their previous stock changes and tasks will be kept.</p><Button variant="destructive" disabled={busy} className="w-full" onClick={()=>void manage({action:'deactivate',userId:deactivating.id},'Crew member deactivated')}>{busy?'Saving…':'Deactivate crew member'}</Button></>}
          {removing && <><p className="text-sm text-muted-foreground">Permanently remove {removing.username}? Their login is deleted and they disappear from the crew list. Past stock changes and tasks keep their name.</p><Button variant="destructive" disabled={busy} className="w-full" onClick={()=>void manage({action:'remove',userId:removing.id},'Crew member removed')}>{busy?'Removing…':'Remove permanently'}</Button></>}
          {resetting && <form className="space-y-4" onSubmit={event=>{event.preventDefault();if(newPassword!==confirmPassword){toast.error('New passwords do not match');return;}void manage({action:'reset-password',password:currentPassword,newPassword},'Vessel password updated for all crew');}}>
            <div className="space-y-2"><Label htmlFor="current-vessel-password">Current vessel password</Label><Input id="current-vessel-password" type="password" autoComplete="current-password" value={currentPassword} onChange={event=>setCurrentPassword(event.target.value)} minLength={8} maxLength={100} required disabled={busy}/></div>
            <div className="space-y-2"><Label htmlFor="new-vessel-password">New vessel password</Label><Input id="new-vessel-password" type="password" autoComplete="new-password" value={newPassword} onChange={event=>setNewPassword(event.target.value)} minLength={8} maxLength={100} required disabled={busy}/></div>
            <div className="space-y-2"><Label htmlFor="confirm-vessel-password">Confirm new password</Label><Input id="confirm-vessel-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} minLength={8} maxLength={100} required disabled={busy}/></div>
            <p className="text-sm text-muted-foreground">All crew will use this password at their next sign-in. Share it with your active crew.</p><Button type="submit" disabled={busy} className="w-full">{busy?'Saving…':'Update vessel password'}</Button>
          </form>}
        </section>}
        {crew?.owner && !setup && !editing && !deactivating && !removing && !resetting && <Button variant="outline" disabled={busy} onClick={()=>{cancelAction();setResetting(true);}}><KeyRound className="mr-2 h-4 w-4"/>Reset vessel password</Button>}
        {(setup || (crew?.owner && !editing && !deactivating && !removing && !resetting)) && <form className="space-y-4" onSubmit={submit}>
          {setup && <div className="space-y-2"><Label htmlFor="vessel-name">Vessel name</Label><Input id="vessel-name" value={vesselName} onChange={e=>setVesselName(e.target.value)} required maxLength={100}/></div>}
          <div className="space-y-2"><Label htmlFor="crew-name">{setup?'Admin full name':'Crew member full name'}</Label><Input id="crew-name" value={username} onChange={e=>setUsername(e.target.value)} required minLength={3} maxLength={100} placeholder="e.g. John Smith" autoCapitalize="words" autoComplete="name"/></div>
          <div className="space-y-2"><Label htmlFor="vessel-password">{setup?'Choose vessel password':'Vessel password'}</Label><Input id="vessel-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete="new-password"/></div>
          <p className="text-sm text-muted-foreground">{setup ? 'You will be the vessel admin. Sign in with your full name and this password. Existing stock stays with your vessel.' : 'Give this crew member the vessel password. They sign in using their full name and the same password.'}</p>
          {setup && <p className="text-xs text-muted-foreground">Email password recovery is not available for name-based logins.</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy?'Saving…':setup?'Create vessel':'Add crew member'}</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </>;
}
