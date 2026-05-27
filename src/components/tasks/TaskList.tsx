import { useState, useMemo, useEffect } from 'react';
import { Circle, CheckCircle2, Star, Plus, ChevronRight, ChevronDown, Trash2, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/inventory';
import { cn } from '@/lib/utils';

type DialogMode =
  | { kind: 'closed' }
  | { kind: 'add' }
  | { kind: 'edit'; task: Task };

const TaskList = () => {
  const { tasks, addTask, toggleTask, toggleStar, updateTaskFields, deleteTask } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);
  const [assignFilter, setAssignFilter] = useState<string>('all');
  const [dialog, setDialog] = useState<DialogMode>({ kind: 'closed' });

  const assignees = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => t.assignees?.forEach(a => set.add(a)));
    return Array.from(set).sort();
  }, [tasks]);

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

  const filterTabs = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'unassigned', label: 'Unassigned', count: tasks.filter(t => !t.assignees || t.assignees.length === 0).length },
    ...assignees.map(a => ({ id: a, label: a, count: tasks.filter(t => t.assignees?.includes(a)).length })),
  ];

  return (
    <div className="h-full flex flex-col bg-primary text-primary-foreground">
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-4xl font-bold tracking-tight">To Do</h1>
      </div>

      <div className="px-4 pb-3 overflow-x-auto">
        <div className="flex gap-2 min-w-fit">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setAssignFilter(tab.id)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border",
                assignFilter === tab.id
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-primary-foreground/5 text-primary-foreground/70 border-primary-foreground/10 hover:bg-primary-foreground/10"
              )}
            >
              {tab.id !== 'all' && tab.id !== 'unassigned' && <User className="h-3 w-3" />}
              {tab.label}
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                assignFilter === tab.id ? "bg-accent-foreground/15" : "bg-primary-foreground/10"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
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
              onDelete={() => deleteTask(task.id)}
            />
          ))}
          {active.length === 0 && (
            <p className="text-center text-primary-foreground/50 py-8 text-sm">No tasks here.</p>
          )}
        </div>

        {completed.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowCompleted(s => !s)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold text-primary-foreground/90 hover:bg-primary-foreground/10 transition-colors"
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
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={() => setDialog({ kind: 'add' })}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg btn-add"
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TaskDialog
        mode={dialog}
        suggestions={assignees}
        onClose={() => setDialog({ kind: 'closed' })}
        onAdd={(payload) => {
          addTask(payload.text, { notes: payload.notes, starred: payload.starred, assignees: payload.assignees });
          setDialog({ kind: 'closed' });
        }}
        onSave={(id, payload) => {
          updateTaskFields(id, payload);
          setDialog({ kind: 'closed' });
        }}
        onDelete={(id) => {
          deleteTask(id);
          setDialog({ kind: 'closed' });
        }}
      />
    </div>
  );
};

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onStar: () => void;
  onOpen: () => void;
  onDelete: () => void;
}

const TaskRow = ({ task, onToggle, onStar, onOpen, onDelete }: TaskRowProps) => {
  const assignees = task.assignees ?? [];
  const visible = assignees.slice(0, 2);
  const overflow = assignees.length - visible.length;

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm overflow-hidden">
      <div className="group flex items-center gap-3 px-4 py-3.5">
        <button onClick={onToggle} className="shrink-0" aria-label="Toggle complete">
          {task.completed ? (
            <CheckCircle2 className="h-6 w-6 text-accent" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground/60 hover:text-accent transition-colors" />
          )}
        </button>

        <button onClick={onOpen} className="flex-1 min-w-0 text-left">
          <div
            className={cn(
              "text-sm font-medium break-words",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.text}
          </div>
          {(assignees.length > 0 || task.notes) && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {visible.map(a => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent/10 text-accent"
                >
                  <User className="h-2.5 w-2.5" />
                  {a}
                </span>
              ))}
              {overflow > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent/10 text-accent">
                  +{overflow}
                </span>
              )}
              {task.notes && (
                <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                  · {task.notes}
                </span>
              )}
            </div>
          )}
        </button>

        <button
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <button onClick={onStar} className="shrink-0" aria-label="Star task">
          <Star
            className={cn(
              "h-5 w-5 transition-colors",
              task.starred ? "fill-accent text-accent" : "text-muted-foreground/50 hover:text-accent"
            )}
          />
        </button>
      </div>
    </div>
  );
};

interface TaskPayload {
  text: string;
  notes: string;
  starred: boolean;
  assignees: string[];
}

interface TaskDialogProps {
  mode: DialogMode;
  suggestions: string[];
  onClose: () => void;
  onAdd: (payload: TaskPayload) => void;
  onSave: (id: number, payload: TaskPayload) => void;
  onDelete: (id: number) => void;
}

const TaskDialog = ({ mode, suggestions, onClose, onAdd, onSave, onDelete }: TaskDialogProps) => {
  const open = mode.kind !== 'closed';
  const editing = mode.kind === 'edit' ? mode.task : null;

  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [starred, setStarred] = useState(false);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [assigneeInput, setAssigneeInput] = useState('');

  // Seed state whenever dialog opens / target changes
  useMemo(() => {
    if (mode.kind === 'edit') {
      setText(mode.task.text);
      setNotes(mode.task.notes ?? '');
      setStarred(!!mode.task.starred);
      setAssignees(mode.task.assignees ?? []);
      setAssigneeInput('');
    } else if (mode.kind === 'add') {
      setText('');
      setNotes('');
      setStarred(false);
      setAssignees([]);
      setAssigneeInput('');
    }
  }, [mode]);

  const addAssignee = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    setAssignees(prev => {
      if (prev.some(a => a.toLowerCase() === v.toLowerCase())) return prev;
      return [...prev, v];
    });
    setAssigneeInput('');
  };

  const removeAssignee = (a: string) => {
    setAssignees(prev => prev.filter(x => x !== a));
  };

  const submit = () => {
    if (!text.trim()) return;
    // commit any pending assignee in the input
    const finalAssignees = assigneeInput.trim()
      ? (() => {
          const v = assigneeInput.trim();
          return assignees.some(a => a.toLowerCase() === v.toLowerCase()) ? assignees : [...assignees, v];
        })()
      : assignees;
    const payload: TaskPayload = { text, notes, starred, assignees: finalAssignees };
    if (editing) onSave(editing.id, payload);
    else onAdd(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">{editing ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogDescription>
            Star to pin, assign to one or more crew, or add notes for context.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Task</label>
            <Input
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
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Assign to <span className="normal-case text-muted-foreground/70">(optional, multiple)</span>
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
            <Input
              type="text"
              placeholder="Type a name and press Enter"
              value={assigneeInput}
              onChange={(e) => setAssigneeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addAssignee(assigneeInput);
                } else if (e.key === 'Backspace' && !assigneeInput && assignees.length) {
                  setAssignees(prev => prev.slice(0, -1));
                }
              }}
              onBlur={() => assigneeInput.trim() && addAssignee(assigneeInput)}
              list="assignee-suggestions"
            />
            <datalist id="assignee-suggestions">
              {suggestions.map(a => <option key={a} value={a} />)}
            </datalist>
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

          <button
            type="button"
            onClick={() => setStarred(s => !s)}
            className={cn(
              "flex items-center gap-2 text-sm font-medium rounded-md px-3 py-2 border transition-colors w-fit",
              starred
                ? "bg-accent/10 border-accent/40 text-accent"
                : "border-border text-muted-foreground hover:text-accent hover:border-accent/40"
            )}
          >
            <Star className={cn("h-4 w-4", starred && "fill-accent text-accent")} />
            {starred ? 'Starred' : 'Mark as starred'}
          </button>

          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              {editing && (
                <Button
                  variant="ghost"
                  onClick={() => onDelete(editing.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                onClick={submit}
                disabled={!text.trim()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {editing ? 'Save' : 'Add Task'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskList;
