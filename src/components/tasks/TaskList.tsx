import { useState, useMemo } from 'react';
import { Circle, CheckCircle2, Star, Plus, ChevronRight, ChevronDown, Trash2, StickyNote, UserPlus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

const TaskList = () => {
  const { tasks, addTask, toggleTask, toggleStar, updateTask, updateTaskNotes, updateTaskAssignee, deleteTask } = useTasks();
  const [newTask, setNewTask] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newStarred, setNewStarred] = useState(false);
  const [newAssignee, setNewAssignee] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<number | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [assignFilter, setAssignFilter] = useState<string>('all');

  const assignees = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => { if (t.assignee) set.add(t.assignee); });
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (assignFilter === 'all') return tasks;
    if (assignFilter === 'unassigned') return tasks.filter(t => !t.assignee);
    return tasks.filter(t => t.assignee === assignFilter);
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

  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (newTask.trim()) {
      addTask(newTask, { notes: newNotes, starred: newStarred, assignee: newAssignee });
      setNewTask('');
      setNewNotes('');
      setNewStarred(false);
      setNewAssignee('');
      setShowForm(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setNewTask('');
    setNewNotes('');
    setNewStarred(false);
    setNewAssignee('');
  };

  const filterTabs = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'unassigned', label: 'Unassigned', count: tasks.filter(t => !t.assignee).length },
    ...assignees.map(a => ({ id: a, label: a, count: tasks.filter(t => t.assignee === a).length })),
  ];

  return (
    <div className="h-full flex flex-col bg-primary text-primary-foreground">
      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-4xl font-bold tracking-tight">To Do</h1>
      </div>

      {/* Assign filter tabs */}
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

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="space-y-2.5">
          {active.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              editing={editingId === task.id}
              notesExpanded={expandedNotesId === task.id}
              assigning={assigningId === task.id}
              onToggle={() => toggleTask(task.id)}
              onStar={() => toggleStar(task.id)}
              onEdit={() => setEditingId(task.id)}
              onSave={(text) => { updateTask(task.id, text); setEditingId(null); }}
              onDelete={() => deleteTask(task.id)}
              onToggleNotes={() => setExpandedNotesId(prev => prev === task.id ? null : task.id)}
              onUpdateNotes={(notes) => updateTaskNotes(task.id, notes)}
              onToggleAssign={() => setAssigningId(prev => prev === task.id ? null : task.id)}
              onUpdateAssignee={(a) => { updateTaskAssignee(task.id, a); setAssigningId(null); }}
              suggestions={assignees}
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
                    editing={false}
                    notesExpanded={expandedNotesId === task.id}
                    assigning={assigningId === task.id}
                    onToggle={() => toggleTask(task.id)}
                    onStar={() => toggleStar(task.id)}
                    onEdit={() => {}}
                    onSave={() => {}}
                    onDelete={() => deleteTask(task.id)}
                    onToggleNotes={() => setExpandedNotesId(prev => prev === task.id ? null : task.id)}
                    onUpdateNotes={(notes) => updateTaskNotes(task.id, notes)}
                    onToggleAssign={() => setAssigningId(prev => prev === task.id ? null : task.id)}
                    onUpdateAssignee={(a) => { updateTaskAssignee(task.id, a); setAssigningId(null); }}
                    suggestions={assignees}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg btn-add"
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Task Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => (o ? setShowForm(true) : closeForm())}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">New Task</DialogTitle>
            <DialogDescription>
              Add a quick task. Star it to pin, assign to a crew member, or add notes for context.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Task
              </label>
              <Input
                type="text"
                placeholder="What needs doing?"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                autoFocus
                className="text-base"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Assign to <span className="normal-case text-muted-foreground/70">(optional)</span>
              </label>
              <Input
                type="text"
                placeholder="Name or initials"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                list="assignee-suggestions"
              />
              <datalist id="assignee-suggestions">
                {assignees.map(a => <option key={a} value={a} />)}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes <span className="normal-case text-muted-foreground/70">(optional)</span>
              </label>
              <Textarea
                placeholder="Add details, links, or context..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="min-h-[90px] resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setNewStarred(s => !s)}
              className={cn(
                "flex items-center gap-2 text-sm font-medium rounded-md px-3 py-2 border transition-colors w-fit",
                newStarred
                  ? "bg-accent/10 border-accent/40 text-accent"
                  : "border-border text-muted-foreground hover:text-accent hover:border-accent/40"
              )}
            >
              <Star className={cn("h-4 w-4", newStarred && "fill-accent text-accent")} />
              {newStarred ? 'Starred' : 'Mark as starred'}
            </button>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={closeForm}>Cancel</Button>
              <Button
                onClick={handleAdd}
                disabled={!newTask.trim()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface TaskRowProps {
  task: { id: number; text: string; completed: boolean; starred?: boolean; notes?: string; assignee?: string };
  editing: boolean;
  notesExpanded: boolean;
  assigning: boolean;
  onToggle: () => void;
  onStar: () => void;
  onEdit: () => void;
  onSave: (text: string) => void;
  onDelete: () => void;
  onToggleNotes: () => void;
  onUpdateNotes: (notes: string) => void;
  onToggleAssign: () => void;
  onUpdateAssignee: (assignee: string) => void;
  suggestions: string[];
}

const TaskRow = ({ task, editing, notesExpanded, assigning, onToggle, onStar, onEdit, onSave, onDelete, onToggleNotes, onUpdateNotes, onToggleAssign, onUpdateAssignee, suggestions }: TaskRowProps) => {
  const [text, setText] = useState(task.text);
  const [notes, setNotes] = useState(task.notes || '');
  const [assignee, setAssignee] = useState(task.assignee || '');

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm overflow-hidden">
      <div className="group flex items-center gap-3 px-4 py-3.5">
        <button onClick={onToggle} className="shrink-0">
          {task.completed ? (
            <CheckCircle2 className="h-6 w-6 text-accent" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground/60 hover:text-accent transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => onSave(text)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave(text);
                if (e.key === 'Escape') onSave(task.text);
              }}
              className="w-full bg-transparent outline-none text-sm font-medium"
            />
          ) : (
            <button
              onClick={onEdit}
              className={cn(
                "w-full text-left text-sm font-medium break-words",
                task.completed && "line-through text-muted-foreground"
              )}
            >
              {task.text}
            </button>
          )}
          {task.assignee && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
              <User className="h-3 w-3" />
              {task.assignee}
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <button
          onClick={onToggleAssign}
          className={cn(
            "shrink-0 transition-colors",
            task.assignee ? "text-accent" : "text-muted-foreground/50 hover:text-accent",
            assigning && "text-accent"
          )}
          aria-label="Assign task"
        >
          <UserPlus className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleNotes}
          className={cn(
            "shrink-0 transition-colors",
            task.notes ? "text-accent" : "text-muted-foreground/50 hover:text-accent",
            notesExpanded && "text-accent"
          )}
          aria-label="Toggle notes"
        >
          <StickyNote className="h-5 w-5" />
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

      {assigning && (
        <div className="px-4 pb-3.5 flex items-center gap-2">
          <Input
            autoFocus
            placeholder="Assign to..."
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onUpdateAssignee(assignee);
              if (e.key === 'Escape') onToggleAssign();
            }}
            list={`assignee-row-${task.id}`}
            className="h-9 text-sm"
          />
          <datalist id={`assignee-row-${task.id}`}>
            {suggestions.map(a => <option key={a} value={a} />)}
          </datalist>
          <Button
            size="sm"
            onClick={() => onUpdateAssignee(assignee)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground h-9"
          >
            Save
          </Button>
        </div>
      )}

      {notesExpanded && (
        <div className="px-4 pb-3.5">
          <Textarea
            placeholder="Add notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => onUpdateNotes(notes)}
            className="min-h-[80px] bg-muted/50 border-muted text-sm resize-none"
          />
        </div>
      )}
    </div>
  );
};

export default TaskList;
