import { useEditAutosave, SaveResult } from '@/hooks/useEditAutosave';
import EditSaveStatus from '@/components/EditSaveStatus';
import { useState, useMemo, useEffect, useRef } from 'react';
import Attachments from '@/components/Attachments';
import { Circle, CheckCircle2, Star, Plus, ChevronRight, ChevronDown, ChevronUp, Trash2, User, X, RotateCcw, StickyNote, ListChecks, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTasks } from '@/hooks/useTasks';
import { Task, ChecklistItem } from '@/types/inventory';
import MobileSwipeActions from '@/components/inventory/MobileSwipeActions';
import { cn } from '@/lib/utils';
import { useCrew } from '@/hooks/useCrew';

type DialogMode =
  | { kind: 'closed' }
  | { kind: 'add' }
  | { kind: 'edit'; task: Task };

const TaskList = () => {
  const {members,crew}=useCrew();
  const { tasks, deletedTasks, addTask, toggleTask, toggleStar, updateTaskFields, toggleChecklistItem, deleteTask, restoreTask, clearDeletedTasks } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [assignFilter, setAssignFilter] = useState<string>('all');
  const [dialog, setDialog] = useState<DialogMode>({ kind: 'closed' });
  const filteredTasks = useMemo(() => {
    if (assignFilter === 'all') return tasks;
    if (assignFilter === 'unassigned') return tasks.filter(t => !t.assignees || t.assignees.length === 0);
    return tasks.filter(t => t.assignees?.includes(assignFilter));
  }, [tasks, assignFilter]);

  const { active, completed } = useMemo(() => {
    const sorted = [...filteredTasks].sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1;
      return b.id - a.id;
    });
    return {
      active: sorted.filter(t => !t.completed),
      completed: sorted.filter(t => t.completed),
    };
  }, [filteredTasks]);

  const outstanding = useMemo(() => tasks.filter(t => !t.completed), [tasks]);

  useEffect(() => {
    if (assignFilter !== 'all' && assignFilter !== 'unassigned' && !members.includes(assignFilter)) {
      setAssignFilter('all');
    }
  }, [assignFilter, members]);

  const filterTabs = [
    { id: 'all', label: 'All', count: outstanding.length },
    { id: 'unassigned', label: 'Unassigned', count: outstanding.filter(t => !t.assignees || t.assignees.length === 0).length },
    ...members.map(member => ({ id: member, label: member, count: outstanding.filter(t => t.assignees?.includes(member)).length })),
  ];

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <div className="px-5 pt-5 pb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tasks</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">To Do</h1>
        </div>
        <p className="hidden md:block text-xs text-muted-foreground">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="px-4 pb-3 flex items-center gap-2">
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-2 min-w-fit">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setAssignFilter(tab.id)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border",
                  assignFilter === tab.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                {tab.id !== 'all' && tab.id !== 'unassigned' && <User className="h-3 w-3" />}
                {tab.label}
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  assignFilter === tab.id ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="space-y-2.5">
          {active.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
              onStar={() => toggleStar(task.id)}
              onOpen={() => setDialog({ kind: 'edit', task })}
              onCheck={(itemId) => toggleChecklistItem(task.id, itemId)}
              onDelete={() => deleteTask(task.id)}
            />
          ))}
          {active.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">No tasks here.</p>
          )}
        </div>

        {completed.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowCompleted(s => !s)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              {showCompleted ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Completed ({completed.length})
            </button>
            {showCompleted && (
              <div className="space-y-2.5 mt-2">
                {completed.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onStar={() => toggleStar(task.id)}
                    onOpen={() => setDialog({ kind: 'edit', task })}
                    onCheck={(itemId) => toggleChecklistItem(task.id, itemId)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <section className="mt-6 border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={() => setShowDeleted(s => !s)} aria-expanded={showDeleted} className="text-muted-foreground hover:bg-muted hover:text-foreground">
            {showDeleted ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Trash2 className="h-3.5 w-3.5" /> Deleted ({deletedTasks.length})
          </Button>
          {showDeleted && <div className="mt-2 space-y-2.5">
            {deletedTasks.length > 0 ? <>
              {crew?.canDeleteItems && <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)} className="text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Trash2 className="h-3.5 w-3.5" /> Clear deleted folder
                </Button>
              </div>}
              {deletedTasks.map(task => <TaskRow key={task.id} task={task} archived onToggle={() => {}} onStar={() => {}} onOpen={() => {}} onDelete={() => {}} onRestore={() => restoreTask(task.id)} />)}
            </> : <p className="px-3 py-4 text-sm text-muted-foreground">No deleted tasks.</p>}
          </div>}
        </section>
      </div>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear deleted folder?</DialogTitle>
            <DialogDescription>All {deletedTasks.length} deleted tasks will be permanently removed for this vessel. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={clearing} onClick={() => setConfirmClear(false)}>Cancel</Button>
            <Button variant="destructive" disabled={clearing} onClick={async () => {
              setClearing(true);
              try { if (await clearDeletedTasks()) setConfirmClear(false); } finally { setClearing(false); }
            }}>{clearing ? 'Clearing…' : 'Clear deleted folder'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        onClick={() => setDialog({ kind: 'add' })}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg btn-add"
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TaskDialog
        mode={dialog}
        crewMembers={members}
        onClose={() => setDialog({ kind: 'closed' })}
        onAdd={async (payload) => {
          if(await addTask(payload.text, { notes: payload.notes, starred: payload.starred, assignees: payload.assignees, checklist: payload.checklist, dueDate: payload.dueDate || undefined })) setDialog({ kind: 'closed' });
        }}
        onSave={(id, payload) => updateTaskFields(id, payload)}
        onDelete={async (id) => {
          if(await deleteTask(id)) setDialog({ kind: 'closed' });
        }}
      />
    </div>
  );
};

interface TaskRowProps {
  task: Task;
  archived?: boolean;
  onToggle: () => void;
  onStar: () => void;
  onOpen: () => void;
  onCheck?: (itemId: string) => void;
  onDelete: () => void;
  onRestore?: () => void;
}

const DueBadge = ({ date, done }: { date?: string; done?: boolean }) => {
  if (!date) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date + 'T00:00:00');
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const tone = done ? 'bg-muted text-muted-foreground' : diff < 0 ? 'bg-destructive/10 text-destructive' : diff <= 2 ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground';
  return <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold", tone)} title={diff < 0 && !done ? 'Overdue' : 'Due date'}><CalendarDays className="h-3 w-3" />{label}</span>;
};

const TaskRow = ({ task, archived = false, onToggle, onStar, onOpen, onCheck, onDelete, onRestore }: TaskRowProps) => {
  const assignees = task.assignees ?? [];
  const visible = assignees.slice(0, 2);
  const overflow = assignees.length - visible.length;

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
      <MobileSwipeActions itemName={task.text} disabled={archived} canDelete={!archived} onDelete={onDelete} swipeFromButtons className="bg-card">
      <div className="group flex items-start gap-3 px-4 py-3.5">
        {!archived && <button onClick={onToggle} className="shrink-0 self-start -mt-0.5" aria-label="Toggle complete">
          {task.completed ? (
            <CheckCircle2 className="h-6 w-6 text-accent" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground/60 hover:text-accent transition-colors" />
          )}
        </button>}

        <div className="flex-1 min-w-0">
          <button onClick={onOpen} disabled={archived} className="grid w-full grid-cols-1 text-left md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-3">
            <div
              className={cn(
                "order-1 min-w-0 text-sm font-medium break-words md:self-center",
                task.completed && "line-through text-muted-foreground"
              )}
            >
              {task.text}
            </div>
            {task.notes && (
              <p className="order-2 mt-1 text-xs text-muted-foreground whitespace-pre-line break-words line-clamp-2 md:order-3 md:col-span-2">
                {task.notes}
              </p>
            )}
            {(assignees.length > 0 || task.dueDate || (task.checklist?.length ?? 0) > 0) && (
              <div className="order-3 mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5 text-muted-foreground/70 md:order-2 md:mt-0 md:max-w-xs md:justify-end md:self-center">
                <DueBadge date={task.dueDate} done={task.completed} />
                <ChecklistBadge items={task.checklist} />
                {visible.map(a => (
                  <span key={a} className="inline-flex min-w-0 items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent/10 text-accent break-words [overflow-wrap:anywhere]">
                    <User className="h-2.5 w-2.5 shrink-0" />
                    {a}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent/10 text-accent">
                    +{overflow}
                  </span>
                )}
              </div>
            )}
          </button>

          {task.completedBy && task.completedAt && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              <span title={`Completed ${new Date(task.completedAt).toLocaleString('en-GB')}`}>
                Completed by {task.completedBy} · {new Date(task.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} {new Date(task.completedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          )}



        </div>

        {archived && onRestore && <button
          onClick={onRestore}
          className="shrink-0 self-start mt-1 text-muted-foreground hover:text-accent transition-colors"
          title="Restore task"
          aria-label="Restore task"
        >
          <RotateCcw className="h-4 w-4" />
        </button>}

        {!archived && <button
          onClick={onDelete}
          className="hidden md:block shrink-0 self-start mt-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>}

        {!archived && <button onClick={onStar} className="shrink-0 self-start mt-0.5" aria-label="Star task">
          <Star
            className={cn(
              "h-5 w-5 transition-colors",
              task.starred ? "fill-accent text-accent" : "text-muted-foreground/50 hover:text-accent"
            )}
          />
        </button>}
      </div>
      </MobileSwipeActions>
    </div>
  );
};

interface TaskPayload {
  text: string;
  notes: string;
  starred: boolean;
  assignees: string[];
  dueDate?: string;
  checklist: ChecklistItem[];
}

interface TaskDialogProps {
  mode: DialogMode;
  crewMembers: string[];
  onClose: () => void;
  onAdd: (payload: TaskPayload) => void;
  onSave: (id: number, payload: TaskPayload) => SaveResult;
  onDelete: (id: number) => void;
}

const TaskDialog = ({ mode, crewMembers, onClose, onAdd, onSave, onDelete }: TaskDialogProps) => {
  const open = mode.kind !== 'closed';
  const editing = mode.kind === 'edit' ? mode.task : null;

  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [starred, setStarred] = useState(false);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [dueDate, setDueDate] = useState('');
  const savedTask = useRef<{ text: string; checklist: ChecklistItem[] }>({ text: '', checklist: [] });

  // Seed state whenever dialog opens / target changes
  useEffect(() => {
    if (mode.kind === 'edit') {
      savedTask.current = { text: mode.task.text, checklist: mode.task.checklist ?? [] };
      setText(mode.task.text);
      setNotes(mode.task.notes ?? '');
      setStarred(!!mode.task.starred);
      setAssignees(mode.task.assignees ?? []);
      setChecklist(mode.task.checklist ?? []);
      setDueDate(mode.task.dueDate ?? '');
      setNewItem('');
    } else if (mode.kind === 'add') {
      setText('');
      setNotes('');
      setStarred(false);
      setAssignees([]);
      setChecklist([]);
      setNewItem('');
      setDueDate('');
    }
  }, [mode]);

  const [closing, setClosing] = useState(false);
  const pendingItemId = useRef(crypto.randomUUID());
  const initialPayload: TaskPayload = { text: editing?.text ?? '', notes: editing?.notes ?? '', starred: !!editing?.starred,
    assignees: editing?.assignees ?? [], checklist: editing?.checklist ?? [], dueDate: editing?.dueDate ?? '' };
  const draftPayload: TaskPayload = { text: text.trim() || savedTask.current.text || editing?.text || '', notes: notes.trim(), starred, assignees, dueDate,
    checklist: [...checklist.map(item => ({ ...item, text: item.text.trim() || savedTask.current.checklist.find(original => original.id === item.id)?.text || '' })),
      ...(newItem.trim() ? [{ id: pendingItemId.current, text: newItem.trim(), done: false }] : [])] };
  const autosave = useEditAutosave(editing?.id ?? null, initialPayload, draftPayload,
    async payload => {
      if (!editing) return;
      const result = await onSave(editing.id, payload);
      if (result !== false) savedTask.current = { text: payload.text, checklist: payload.checklist };
      return result;
    });
  const closeEditor = async () => {
    if (closing) return;
    setClosing(true);
    if (!editing || await autosave.flush()) onClose();
    setClosing(false);
  };
  const blurEditor = () => {
    if (!editing) return;
    if (!text.trim()) setText(savedTask.current.text);
    setChecklist(items => items.map(item => ({ ...item, text: item.text.trim() || savedTask.current.checklist.find(original => original.id === item.id)?.text || item.text })));
    void autosave.flush();
  };
  const appendChecklist = () => {
    const value = newItem.trim();
    if (!value) return;
    setChecklist(items => [...items, { id: pendingItemId.current, text: value, done: false }]);
    pendingItemId.current = crypto.randomUUID();
    setNewItem('');
  };

  const addAssignee = (username: string) => {
    const member = crewMembers.find(name => name.toLowerCase() === username.toLowerCase());
    if (!member) return;
    setAssignees(prev => {
      if (prev.some(a => a.toLowerCase() === member.toLowerCase())) return prev;
      return [...prev, member];
    });
  };

  const availableCrew = crewMembers.filter(member =>
    !assignees.some(assignee => assignee.toLowerCase() === member.toLowerCase())
  );

  const removeAssignee = (a: string) => {
    setAssignees(prev => prev.filter(x => x !== a));
  };

  const submit = () => {
    if (!text.trim()) return;
    const pending = newItem.trim();
    const editedItems = checklist.map(item => ({ ...item, text: item.text.trim() }));
    if (editedItems.some(item => !item.text)) return;
    const items = pending ? [...editedItems, { id: crypto.randomUUID(), text: pending, done: false }] : editedItems;
    const payload: TaskPayload = { text, notes, starred, assignees, checklist: items, dueDate: editing ? dueDate : (dueDate || undefined) };
    if (editing) void autosave.flush();
    else onAdd(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) void closeEditor(); }}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-[900px] max-h-[90dvh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3 pr-6 text-card-foreground">{editing ? 'Edit Task' : 'New Task'}{editing && <EditSaveStatus status={autosave.status} onRetry={() => void autosave.flush()} />}</DialogTitle>
          <DialogDescription>
            Star to pin, assign to one or more crew, or add notes for context.
          </DialogDescription>
        </DialogHeader>

        <div onBlur={blurEditor} className="flex flex-col gap-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="task-title" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Task</label>
            <Input
              id="task-title"
              type="text"
              placeholder="What needs doing?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              autoFocus
              className="text-base"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="task-checklist" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Checklist <span className="normal-case text-muted-foreground/70">(optional)</span>
            </label>
            {checklist.length > 0 && (
              <ul className="space-y-1">
                {checklist.map((item, index) => (
                  <li key={item.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                    <button type="button" onClick={() => setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i))} aria-label={`${item.done ? 'Untick' : 'Tick'} ${item.text}`}>
                      {item.done ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <Input
                      aria-label={`Checklist item ${index + 1}`}
                      value={item.text}
                      onChange={e => setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, text: e.target.value } : i))}
                      className={cn("min-w-0 flex-1 text-sm", item.done && "line-through text-muted-foreground")}
                    />
                    <button type="button" onClick={() => setChecklist(prev => prev.filter(i => i.id !== item.id))} aria-label={`Remove ${item.text}`} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input
                id="task-checklist"
                placeholder="e.g. Check windlass oil"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); appendChecklist(); }
                }}
              />
              <Button type="button" variant="outline" size="icon" aria-label="Add checklist item" disabled={!newItem.trim()} onClick={appendChecklist}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Notes <span className="normal-case text-muted-foreground/70">(optional)</span>
            </label>
            <Textarea
              placeholder="Add details, links, or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[90px] resize-none"
            />
          </div>


          <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-start">
          <div className="space-y-1.5 min-w-0">
            <label htmlFor="task-assignees" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Assign to
            </label>
            {assignees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {assignees.map(a => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent"
                  >
                    <User className="h-3 w-3" />
                    {a}
                    <button
                      type="button"
                      onClick={() => removeAssignee(a)}
                      className="ml-0.5 rounded-full hover:bg-accent/20 p-0.5"
                      aria-label={`Remove ${a}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <select
              id="task-assignees"
              value=""
              disabled={availableCrew.length === 0}
              onChange={(e) => addAssignee(e.target.value)}
              className="flex h-9 w-full sm:w-52 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {crewMembers.length === 0
                  ? 'No active crew registered'
                  : availableCrew.length === 0
                    ? 'All crew assigned'
                    : 'Select crew member'}
              </option>
              {availableCrew.map(member => <option key={member} value={member}>{member}</option>)}
            </select>
          </div>

            <div className="space-y-1.5">
              <label htmlFor="task-due" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due date</label>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input id="task-due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background pl-8 pr-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                {dueDate && <button type="button" onClick={() => setDueDate('')} aria-label="Clear due date" className="p-1 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</span>
          <button
            type="button"
            onClick={() => setStarred(s => !s)}
            className={cn(
              "flex items-center gap-2 text-sm font-medium rounded-md px-3 py-2 border transition-colors w-fit h-9",
              starred
                ? "bg-accent/10 border-accent/40 text-accent"
                : "border-border text-muted-foreground hover:text-accent hover:border-accent/40"
            )}
          >
            <Star className={cn("h-4 w-4", starred && "fill-accent text-accent")} />
            {starred ? 'Starred' : 'Star'}
          </button>

            </div>
            <div className="sm:col-span-3">
            {editing ? <Attachments parentType="task" parentId={editing.id} /> : <p className="text-xs text-muted-foreground">Save the task first to add photos or documents.</p>}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              {editing && (
                <Button
                  variant="ghost"
                  disabled={closing} onClick={async () => { if (await autosave.flush()) onDelete(editing.id); }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!editing && <Button variant="ghost" onClick={onClose}>Cancel</Button>}
              {!editing && <Button
                onClick={submit}
                disabled={!text.trim() || checklist.some(item => !item.text.trim())}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Add Task
              </Button>}
            </div>
          </div>

          {editing && (
            <p className="text-center text-[11px] text-muted-foreground">
              Added by {editing.createdBy || 'Not recorded'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskList;

const ChecklistBadge = ({ items }: { items?: ChecklistItem[] }) => {
  if (!items || items.length === 0) return null;
  const done = items.filter(i => i.done).length;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold", done === items.length ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground")} aria-label={`Checklist ${done} of ${items.length} done`}>
      <ListChecks className="h-3 w-3" />{done}/{items.length}
    </span>
  );
};
