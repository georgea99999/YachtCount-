import ProductName from './ProductName';
import { stockProductLabel } from '@/lib/stockProduct';
import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ClipboardCheck, FileText, History, ListChecks } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { StockItem } from '@/types/inventory';
import { sortBoxNames, sortInventoryItems } from '@/lib/inventorySort';
import { openStockTakePdf, StockTakeLine, StockTakeRecord, stockTakeDifferences } from '@/lib/stockTakeReport';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: StockItem[];
  onSetQuantity: (id: string, value: number) => void;
  vesselName?: string;
}

const StockTakeMode = ({ open, onOpenChange, items, onSetQuantity, vesselName }: Props) => {
  const [view, setView] = useState<'count' | 'summary' | 'history' | 'lockers'>('count');
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [expected, setExpected] = useState<Record<string, number>>({});
  const [counted, setCounted] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [boxIndex, setBoxIndex] = useState(0);
  const [saved, setSaved] = useState<StockTakeRecord | null>(null);
  const [history, setHistory] = useState<StockTakeRecord[]>([]);
  const [lockerStatus, setLockerStatus] = useState<{ box: string; finished_at: string | null; counted_by_username: string | null }[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setView('count'); setBoxIndex(0); setCounted({}); setDrafts({}); setSaved(null);
    setStartedAt(new Date().toISOString());
    setExpected(Object.fromEntries(items.map(i => [i.id, i.quantity])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const boxes = useMemo(() => sortBoxNames(Array.from(new Set(items.map(i => i.box)))), [items]);
  const box = boxes[boxIndex];
  const boxItems = useMemo(() => sortInventoryItems(items.filter(i => i.box === box)), [items, box]);
  const total = items.length;
  const done = Object.keys(counted).length;

  const record = (item: StockItem, value: number) => {
    const v = Math.max(0, Math.floor(value));
    setCounted(c => ({ ...c, [item.id]: v }));
    setDrafts(d => ({ ...d, [item.id]: String(v) }));
    if (v !== item.quantity) onSetQuantity(item.id, v);
  };

  const commitDraft = (item: StockItem) => {
    const raw = drafts[item.id];
    if (raw === undefined || raw.trim() === '') return;
    const n = Number(raw);
    if (Number.isFinite(n)) record(item, n);
  };

  const lines = (): StockTakeLine[] => items.filter(i => counted[i.id] !== undefined).map(i => ({
    itemId: i.id, name: stockProductLabel(i), box: i.box, expected: expected[i.id] ?? i.quantity, counted: counted[i.id],
  }));

  const finish = async () => {
    if (saving) return;
    const l = lines();
    if (l.length === 0) { toast.error('Count at least one item first'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('stock_takes')
      .insert({ started_at: startedAt, finished_at: new Date().toISOString(), lines: l as never })
      .select('id,counted_by_username,started_at,finished_at,lines').single();
    setSaving(false);
    if (error || !data) { toast.error('Could not save the stock take record'); return; }
    setSaved({ id: data.id, countedBy: data.counted_by_username, startedAt: data.started_at, finishedAt: data.finished_at, lines: data.lines as unknown as StockTakeLine[] });
    setView('summary');
  };

  const loadHistory = async () => {
    const { data } = await supabase.from('stock_takes').select('id,counted_by_username,started_at,finished_at,lines').order('finished_at', { ascending: false }).limit(50);
    setHistory((data ?? []).map(r => ({ id: r.id, countedBy: r.counted_by_username, startedAt: r.started_at, finishedAt: r.finished_at, lines: r.lines as unknown as StockTakeLine[] })));
    setView('history');
  };

  const loadLockerStatus = async () => {
    setView('lockers');
    setStatusLoading(true);
    setStatusError(false);
    const { data, error } = await supabase.rpc('locker_count_status');
    if (error) setStatusError(true);
    else setLockerStatus((data ?? []).sort((a, b) => a.box.localeCompare(b.box, undefined, { numeric: true, sensitivity: 'base' })));
    setStatusLoading(false);
  };

  const fmt = (s: string) => new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100vw-1rem)] md:w-[calc(100vw-2rem)] md:max-w-[900px] max-h-[92vh] flex flex-col gap-3 p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />{view === 'lockers' ? 'Locker status' : 'Stock Take Mode'}</DialogTitle>
        </DialogHeader>

        {view === 'count' && (
          total === 0 ? <><p className="text-sm text-muted-foreground py-6 text-center">Add items before starting a stock take.</p><Button variant="ghost" size="sm" onClick={loadLockerStatus} className="gap-1 self-start"><ListChecks className="h-4 w-4" />Locker status</Button></> : <>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground"><span>{done} of {total} items counted</span><span>Box {boxIndex + 1} of {boxes.length}</span></div>
              <Progress value={(done / total) * 100} className="h-2" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10" disabled={boxIndex === 0} onClick={() => setBoxIndex(i => i - 1)} aria-label="Previous box" title="Previous box"><ChevronLeft className="h-5 w-5" /></Button>
              <div className="flex-1 text-center">
                <p className="font-bold uppercase tracking-wide text-sm">{box}</p>
                <p className="text-xs text-muted-foreground">{boxItems.filter(i => counted[i.id] !== undefined).length}/{boxItems.length} counted</p>
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10" disabled={boxIndex >= boxes.length - 1} onClick={() => setBoxIndex(i => i + 1)} aria-label="Next box" title="Next box"><ChevronRight className="h-5 w-5" /></Button>
            </div>
            <div className="flex-1 overflow-auto -mx-1 px-1 divide-y divide-border border rounded-md">
              {boxItems.map(item => {
                const isDone = counted[item.id] !== undefined;
                const exp = expected[item.id] ?? item.quantity;
                return (
                  <div key={item.id} className={cn('flex items-center gap-2 p-2', isDone && 'bg-primary/5')}>
                    <div className="flex-1 min-w-0">
                      <p><ProductName item={item} /></p>
                      <p className="text-xs text-muted-foreground">Expected {exp}{isDone && counted[item.id] !== exp && <span className="ml-1 font-semibold text-destructive">→ {counted[item.id]}</span>}</p>
                    </div>
                    <Input type="number" inputMode="numeric" min={0} placeholder="Count" aria-label={`Counted ${item.name}`}
                      className="w-20 h-10 px-1 text-center" value={drafts[item.id] ?? ''}
                      onChange={e => setDrafts(d => ({ ...d, [item.id]: e.target.value }))}
                      onBlur={() => commitDraft(item)} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
                    <Button variant={isDone ? 'default' : 'outline'} size="icon" className="h-10 w-10 flex-shrink-0"
                      title="Confirm count (blank = expected)" aria-label={`Confirm ${item.name} count`} onClick={() => { const raw = drafts[item.id]; const n = Number(raw); record(item, raw !== undefined && raw.trim() !== '' && Number.isFinite(n) ? n : exp); }}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={loadHistory} className="gap-1"><History className="h-4 w-4" />Past</Button>
              <Button variant="ghost" size="sm" onClick={loadLockerStatus} className="gap-1"><ListChecks className="h-4 w-4" />Locker status</Button>
              <div className="flex-1" />
              {boxIndex < boxes.length - 1
                ? <Button onClick={() => setBoxIndex(i => i + 1)}>Next box</Button>
                : <Button disabled={saving} onClick={finish}>{saving ? 'Saving…' : 'Finish stock take'}</Button>}
            </div>
            {boxIndex < boxes.length - 1 && done > 0 && <Button disabled={saving} variant="link" size="sm" className="self-center h-auto p-0" onClick={finish}>Finish now</Button>}
          </>
        )}

        {view === 'summary' && saved && (() => {
          const diffs = stockTakeDifferences(saved.lines);
          return <>
            <p className="text-sm">Saved {fmt(saved.finishedAt)}{saved.countedBy ? ` by ${saved.countedBy}` : ''}.</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border p-3 text-center"><p className="text-2xl font-bold">{saved.lines.length}</p><p className="text-xs text-muted-foreground">Items counted</p></div>
              <div className="rounded-md border p-3 text-center"><p className={cn('text-2xl font-bold', diffs.length && 'text-destructive')}>{diffs.length}</p><p className="text-xs text-muted-foreground">Differences</p></div>
            </div>
            <div className="flex-1 overflow-auto border rounded-md divide-y">
              {diffs.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Everything matched.</p> : diffs.map((d, i) => (
                <div key={i} className="flex justify-between p-2 text-sm"><span className="min-w-0 break-words">{d.name} <span className="text-xs text-muted-foreground">· {d.box}</span></span><span className="font-semibold whitespace-nowrap ml-2">{d.expected} → {d.counted}</span></div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="gap-1" onClick={() => openStockTakePdf(saved, vesselName)}><FileText className="h-4 w-4" />PDF</Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </>;
        })()}

        {view === 'lockers' && <>
          <div className="flex-1 overflow-auto border rounded-md divide-y divide-border" aria-busy={statusLoading}>
            {statusLoading ? <p className="p-4 text-sm text-muted-foreground">Loading locker status…</p>
              : statusError ? <div className="p-4 space-y-2"><p className="text-sm text-destructive">Could not load locker status.</p><Button variant="outline" size="sm" onClick={loadLockerStatus}>Try again</Button></div>
              : lockerStatus.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No boxes added yet.</p>
              : lockerStatus.map(status => {
                const index = boxes.indexOf(status.box);
                return <div key={status.box} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="flex-1 min-w-[150px]">
                    <p className="font-semibold text-sm break-words">{status.box}</p>
                    <p className="text-xs text-muted-foreground mt-1">{status.finished_at ? <>Last counted: <time dateTime={status.finished_at} title={fmt(status.finished_at)}>{fmt(status.finished_at)}</time><span className="block mt-0.5">By {status.counted_by_username ?? 'Not recorded'}</span></> : 'Not yet counted'}</p>
                  </div>
                  <Button variant="outline" size="sm" disabled={index < 0} onClick={() => { setBoxIndex(index); setView('count'); }} className="gap-1"><ClipboardCheck className="h-4 w-4" />{index < 0 ? 'Empty box' : 'Count this box'}</Button>
                </div>;
              })}
          </div>
          <Button variant="outline" onClick={() => setView('count')} className="self-start gap-1"><ChevronLeft className="h-4 w-4" />Back to count</Button>
        </>}

        {view === 'history' && <>
          <div className="flex-1 overflow-auto border rounded-md divide-y">
            {history.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No stock takes saved yet.</p> : history.map(h => (
              <div key={h.id} className="flex items-center gap-2 p-2">
                <div className="flex-1 min-w-0 text-sm"><p className="font-medium">{fmt(h.finishedAt)}</p><p className="text-xs text-muted-foreground">{h.countedBy ?? 'Unknown'} · {h.lines.length} items · {stockTakeDifferences(h.lines).length} differences</p></div>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openStockTakePdf(h, vesselName)}><FileText className="h-4 w-4" />PDF</Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setView('count')}>Back to counting</Button>
        </>}
      </DialogContent>
    </Dialog>
  );
};

export default StockTakeMode;
