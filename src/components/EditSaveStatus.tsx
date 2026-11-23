import { Check, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EditSaveStatus({ status, onRetry }: { status: 'saved' | 'saving' | 'error'; onRetry: () => void }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex min-h-5 items-center gap-1 text-xs font-normal text-muted-foreground">
      {status === 'error' ? <>
        <span className="text-destructive">Not saved</span>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label="Retry saving" title="Retry saving" onClick={onRetry}><RotateCcw className="h-3 w-3" /></Button>
      </> : status === 'saving' ? <><Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" />Saving…</> : <><Check className="h-3 w-3" />Saved</>}
    </span>
  );
}