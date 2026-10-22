import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, FileText, Loader2, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Row { id: string; path: string; file_name: string; mime_type: string; uploaded_by_username: string | null; created_at: string; url?: string }

const MAX = 20 * 1024 * 1024;

export default function Attachments({ parentType, parentId }: { parentType: 'task' | 'deck_order'; parentId: string | number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Row | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pid = String(parentId);

  const load = useCallback(async () => {
    const { data } = await supabase.from('attachments').select('id,path,file_name,mime_type,uploaded_by_username,created_at')
      .eq('parent_type', parentType).eq('parent_id', pid).order('created_at');
    const list = data ?? [];
    if (list.length) {
      const { data: signed } = await supabase.storage.from('attachments').createSignedUrls(list.map(r => r.path), 3600);
      setRows(list.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl })));
    } else setRows([]);
  }, [parentType, pid]);

  useEffect(() => { void load(); }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const { data: vid } = await supabase.rpc('current_vessel');
    if (!vid) { toast.error('Not signed in to a vessel'); setBusy(false); return; }
    for (const file of Array.from(files)) {
      if (file.size > MAX) { toast.error(`${file.name} is over 20 MB`); continue; }
      const safe = file.name.replace(/[^\w.-]+/g, '_');
      const path = `${vid}/${parentType}/${pid}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from('attachments').upload(path, file, { contentType: file.type });
      if (error) { toast.error(`Could not upload ${file.name}`); continue; }
      const { error: e2 } = await supabase.from('attachments').insert({ parent_type: parentType, parent_id: pid, path, file_name: file.name, mime_type: file.type || '' });
      if (e2) { await supabase.storage.from('attachments').remove([path]); toast.error(`Could not save ${file.name}`); }
    }
    setBusy(false);
    void load();
  };

  const remove = async (r: Row) => {
    if (!confirm(`Remove ${r.file_name}?`)) return;
    await supabase.storage.from('attachments').remove([r.path]);
    await supabase.from('attachments').delete().eq('id', r.id);
    void load();
  };

  const isImage = (r: Row) => r.mime_type.startsWith('image/');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Photos & documents</span>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {rows.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {rows.map(r => (
            <div key={r.id} className="relative aspect-square rounded-md border border-border overflow-hidden bg-muted">
              {isImage(r) && r.url ? (
                <button type="button" className="w-full h-full" onClick={() => setPreview(r)} title={`${r.file_name}${r.uploaded_by_username ? ' · ' + r.uploaded_by_username : ''}`}>
                  <img src={r.url} alt={r.file_name} className="w-full h-full object-cover" />
                </button>
              ) : (
                <a href={r.url} target="_blank" rel="noreferrer" className="w-full h-full flex flex-col items-center justify-center p-1 text-center" title={r.file_name}>
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="text-[9px] leading-tight line-clamp-2 break-all mt-1">{r.file_name}</span>
                </a>
              )}
              <button type="button" onClick={() => remove(r)} aria-label={`Remove ${r.file_name}`} title="Remove"
                className="absolute top-0.5 right-0.5 rounded-full bg-background/90 p-0.5 text-destructive">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1 flex-1" disabled={busy} onClick={() => photoRef.current?.click()}>
          <Camera className="h-4 w-4" />Photo
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1 flex-1" disabled={busy} onClick={() => fileRef.current?.click()}>
          <FileText className="h-4 w-4" />Document
        </Button>
      </div>
      <input ref={photoRef} type="file" accept="image/*" multiple hidden onChange={e => { void upload(e.target.files); e.target.value = ''; }} />
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*" multiple hidden onChange={e => { void upload(e.target.files); e.target.value = ''; }} />
      {preview?.url && (
        <div className="fixed inset-0 z-[100] bg-foreground/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview.url} alt={preview.file_name} className="max-w-full max-h-full rounded-md" />
        </div>
      )}
    </div>
  );
}
