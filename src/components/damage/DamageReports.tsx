import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, FileText, Loader2, Plus, ShieldAlert, Sparkles, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Urgency = 'low' | 'medium' | 'high' | 'critical';
interface Report { id: string; title: string; location: string; notes: string; report: string; urgency: Urgency; photo_paths: string[]; resolved: boolean; created_by_username: string | null; created_at: string }

const URGENCY: Record<Urgency, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'bg-destructive text-destructive-foreground' },
  high: { label: 'High', cls: 'bg-destructive/15 text-destructive' },
  medium: { label: 'Medium', cls: 'bg-accent/20 text-foreground' },
  low: { label: 'Low', cls: 'bg-muted text-muted-foreground' },
};
const ORDER: Urgency[] = ['critical', 'high', 'medium', 'low'];
const fmt = (s: string) => new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

async function signed(paths: string[]) {
  if (!paths.length) return {} as Record<string, string>;
  const { data } = await supabase.storage.from('attachments').createSignedUrls(paths, 3600);
  return Object.fromEntries((data ?? []).filter(d => d.signedUrl).map(d => [d.path!, d.signedUrl]));
}

const UrgencyBadge = ({ u }: { u: Urgency }) => (
  <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', URGENCY[u].cls)}>{URGENCY[u].label}</span>
);

export default function DamageReports({ vesselName }: { vesselName?: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewing, setViewing] = useState<Report | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('damage_reports').select('*').order('created_at', { ascending: false });
    const list = (data ?? []) as Report[];
    setReports(list);
    setUrls(await signed(list.flatMap(r => r.photo_paths)));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const open = reports.filter(r => !r.resolved).sort((a, b) => ORDER.indexOf(a.urgency) - ORDER.indexOf(b.urgency));
  const resolved = reports.filter(r => r.resolved);

  const toggleResolved = async (r: Report) => {
    await supabase.from('damage_reports').update({ resolved: !r.resolved }).eq('id', r.id);
    setViewing(null); void load();
  };
  const remove = async (r: Report) => {
    if (!confirm('Delete this damage report and its photos?')) return;
    if (r.photo_paths.length) await supabase.storage.from('attachments').remove(r.photo_paths);
    await supabase.from('damage_reports').delete().eq('id', r.id);
    setViewing(null); void load();
  };
  const pdf = (r: Report) => {
    const w = window.open('', '_blank'); if (!w) return;
    const photos = r.photo_paths.map(p => urls[p] ? `<img src="${urls[p]}">` : '').join('');
    w.document.write(`<!DOCTYPE html><html><head><title>${esc(r.title)}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#152238}h1{margin:0 0 4px}.m{color:#666;margin-bottom:16px}.u{display:inline-block;padding:3px 8px;border-radius:4px;background:#5f8b9a;color:#fff;font-weight:bold;text-transform:uppercase;font-size:12px}pre{white-space:pre-wrap;font-family:inherit;line-height:1.5}img{max-width:48%;margin:4px;border-radius:4px}button{padding:8px 18px;background:#5f8b9a;color:#fff;border:none;border-radius:6px;margin-bottom:16px}@media print{button{display:none}}</style></head><body><button onclick="print()">Print / Save PDF</button><h1>${esc(r.title)}</h1><p class="m">${esc(vesselName ?? '')} · ${esc(r.location || 'Location not given')} · ${fmt(r.created_at)}${r.created_by_username ? ' · Reported by ' + esc(r.created_by_username) : ''}</p><span class="u">Urgency: ${r.urgency}</span>${r.resolved ? ' <span class="u">Resolved</span>' : ''}<pre>${esc(r.report)}</pre>${r.notes ? `<h3>Crew notes</h3><pre>${esc(r.notes)}</pre>` : ''}<div>${photos}</div></body></html>`);
    w.document.close();
  };

  const Card = ({ r }: { r: Report }) => (
    <button type="button" onClick={() => setViewing(r)} className="w-full text-left flex gap-3 p-3 border-b border-border last:border-b-0 hover:bg-muted/50">
      {r.photo_paths[0] && urls[r.photo_paths[0]]
        ? <img src={urls[r.photo_paths[0]]} alt="" className="h-14 w-14 rounded-md object-cover flex-shrink-0" />
        : <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center flex-shrink-0"><ShieldAlert className="h-5 w-5 text-muted-foreground" /></div>}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap"><UrgencyBadge u={r.urgency} /><p className="font-medium text-sm break-words">{r.title}</p></div>
        <p className="text-xs text-muted-foreground mt-1">{r.location || 'No location'} · {r.created_by_username ?? 'Unknown'} · {fmt(r.created_at)}</p>
      </div>
    </button>
  );

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4 pb-32">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Maintenance</p>
          <h1 className="text-2xl font-bold text-foreground">Damage Reports</h1>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['Open', open.length], ['Urgent', open.filter(r => r.urgency === 'critical' || r.urgency === 'high').length], ['Resolved', resolved.length]].map(([l, n]) => (
            <div key={l} className="rounded-xl border border-border bg-card p-3 border-l-4 border-l-primary">
              <p className="text-2xl font-bold">{n}</p><p className="text-xs uppercase text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {open.length === 0
            ? <p className="p-8 text-center text-sm text-muted-foreground">No open damage. Tap + to report something with photos and notes.</p>
            : open.map(r => <Card key={r.id} r={r} />)}
        </div>
        {resolved.length > 0 && (
          <div>
            <Button variant="ghost" size="sm" onClick={() => setShowResolved(s => !s)}>{showResolved ? 'Hide' : 'Show'} resolved ({resolved.length})</Button>
            {showResolved && <div className="rounded-xl border border-border bg-card overflow-hidden mt-2 opacity-80">{resolved.map(r => <Card key={r.id} r={r} />)}</div>}
          </div>
        )}
      </div>

      <div className="fixed bottom-24 right-6 z-50">
        <Button onClick={() => setEditorOpen(true)} className="w-14 h-14 rounded-full shadow-lg btn-add" title="Report damage" aria-label="Report damage"><Plus className="h-6 w-6" /></Button>
      </div>

      {editorOpen && <NewReport onClose={() => setEditorOpen(false)} onSaved={() => { setEditorOpen(false); void load(); }} />}

      <Dialog open={!!viewing} onOpenChange={o => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
          {viewing && <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap"><UrgencyBadge u={viewing.urgency} />{viewing.title}</DialogTitle>
              <DialogDescription>{viewing.location || 'No location'} · {viewing.created_by_username ?? 'Unknown'} · {fmt(viewing.created_at)}</DialogDescription>
            </DialogHeader>
            {viewing.photo_paths.length > 0 && <div className="grid grid-cols-3 gap-2">{viewing.photo_paths.map(p => urls[p] && <a key={p} href={urls[p]} target="_blank" rel="noreferrer"><img src={urls[p]} alt="Damage" className="aspect-square w-full object-cover rounded-md" /></a>)}</div>}
            <p className="text-sm whitespace-pre-wrap">{viewing.report}</p>
            {viewing.notes && <div className="rounded-md bg-muted/50 p-2 text-xs"><p className="font-medium mb-1">Crew notes</p><p className="whitespace-pre-wrap">{viewing.notes}</p></div>}
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="ghost" className="text-destructive" onClick={() => remove(viewing)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
              <Button variant="outline" onClick={() => pdf(viewing)}><FileText className="h-4 w-4 mr-1" />PDF</Button>
              <Button onClick={() => toggleResolved(viewing)}><CheckCircle2 className="h-4 w-4 mr-1" />{viewing.resolved ? 'Reopen' : 'Mark resolved'}</Button>
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewReport({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<{ path: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<{ title: string; urgency: Urgency; report: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftId] = useState(() => crypto.randomUUID());
  const savedRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos); photosRef.current = photos;

  // Discard uploaded photos if the report is abandoned.
  useEffect(() => () => {
    if (!savedRef.current && photosRef.current.length) void supabase.storage.from('attachments').remove(photosRef.current.map(p => p.path));
  }, []);

  const addPhotos = async (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (!files.length) return;
    setUploading(true);
    const { data: vid } = await supabase.rpc('current_vessel');
    for (const f of files.slice(0, 8 - photos.length)) {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name} is not a photo`); continue; }
      if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} is over 20 MB`); continue; }
      const path = `${vid}/damage/${draftId}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]+/g, '_')}`;
      const { error } = await supabase.storage.from('attachments').upload(path, f, { contentType: f.type });
      if (error) { toast.error(`Could not upload ${f.name}`); continue; }
      setPhotos(p => [...p, { path, url: URL.createObjectURL(f) }]);
    }
    setUploading(false);
  };

  const removePhoto = async (path: string) => {
    await supabase.storage.from('attachments').remove([path]);
    setPhotos(p => p.filter(x => x.path !== path));
  };

  const runDraft = async () => {
    setDrafting(true);
    const { data, error } = await supabase.functions.invoke('damage-report', { body: { location, notes, photoPaths: photos.map(p => p.path) } });
    setDrafting(false);
    if (error || !data || data.error) {
      let msg = data?.error;
      try { msg = msg ?? (await (error as { context?: Response })?.context?.json())?.error; } catch { /* ignore */ }
      toast.error(msg ?? 'Could not draft the report');
      return;
    }
    setDraft(data);
  };

  const save = async () => {
    if (!draft?.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('damage_reports').insert({ title: draft.title.trim(), urgency: draft.urgency, report: draft.report, location, notes, photo_paths: photos.map(p => p.path) });
    setSaving(false);
    if (error) { toast.error('Could not save the report'); return; }
    savedRef.current = true;
    toast.success('Damage report saved');
    onSaved();
  };

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Damage</DialogTitle>
          <DialogDescription>Add photos and notes, then let AI draft a clear report with a suggested urgency. You can edit it before saving.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5"><Label htmlFor="dm-loc">Location</Label><Input id="dm-loc" placeholder="e.g. Port side aft cleat" value={location} onChange={e => setLocation(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label htmlFor="dm-notes">What happened / what you see</Label><Textarea id="dm-notes" rows={4} placeholder="e.g. Gelcoat cracked around the cleat base after docking, slight movement when loaded" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <div className="space-y-2">
            {photos.length > 0 && <div className="grid grid-cols-4 gap-2">{photos.map(p => (
              <div key={p.path} className="relative aspect-square rounded-md overflow-hidden border border-border">
                <img src={p.url} alt="Damage" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(p.path)} aria-label="Remove photo" className="absolute top-0.5 right-0.5 rounded-full bg-background/90 p-0.5 text-destructive"><X className="h-3 w-3" /></button>
              </div>))}</div>}
            <Button type="button" variant="outline" size="sm" className="w-full gap-1" disabled={uploading || photos.length >= 8} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}Add photos ({photos.length}/8)
            </Button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => { void addPhotos(e.target.files); e.target.value = ''; }} />
          </div>
          <Button type="button" className="w-full gap-1" disabled={drafting || uploading || (!notes.trim() && photos.length === 0)} onClick={runDraft}>
            {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{draft ? 'Redraft with AI' : 'Draft report with AI'}
          </Button>

          {draft && <div className="space-y-3 rounded-md border border-border p-3 bg-muted/30">
            <div className="grid gap-1.5"><Label htmlFor="dm-title">Title</Label><Input id="dm-title" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Suggested urgency</Label>
              <Select value={draft.urgency} onValueChange={v => setDraft({ ...draft, urgency: v as Urgency })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ORDER.map(u => <SelectItem key={u} value={u}>{URGENCY[u].label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label htmlFor="dm-report">Report</Label><Textarea id="dm-report" rows={10} value={draft.report} onChange={e => setDraft({ ...draft, report: e.target.value })} /></div>
          </div>}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={!draft || saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save report</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
