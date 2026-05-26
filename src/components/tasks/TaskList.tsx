import { useState, useMemo } from 'react';
import { Circle, CheckCircle2, Star, Plus, X, ChevronRight, ChevronDown, Trash2, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

const TaskList = () => {
  const { tasks, addTask, toggleTask, toggleStar, updateTask, updateTaskNotes, deleteTask } = useTasks();
  const [newTask, setNewTask] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<number | null>(null);

  const { active, completed } = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1;
      return b.id - a.id;
    });
    return {
      active: sorted.filter(t => !t.completed),
      completed: sorted.filter(t => t.completed),
    };
  }, [tasks]);

  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (newTask.trim()) {
      addTask(newTask);
      setNewTask('');
      setShowForm(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-primary text-primary-foreground">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-4xl font-bold tracking-tight">To Do</h1>
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
              onToggle={() => toggleTask(task.id)}
              onStar={() => toggleStar(task.id)}
              onEdit={() => setEditingId(task.id)}
              onSave={(text) => { updateTask(task.id, text); setEditingId(null); }}
              onDelete={() => deleteTask(task.id)}
              onToggleNotes={() => setExpandedNotesId(prev => prev === task.id ? null : task.id)}
              onUpdateNotes={(notes) => updateTaskNotes(task.id, notes)}
            />
          ))}
          {active.length === 0 && (
            <p className="text-center text-primary-foreground/50 py-8 text-sm">No tasks yet. Add one below.</p>
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
                    onToggle={() => toggleTask(task.id)}
                    onStar={() => toggleStar(task.id)}
                    onEdit={() => {}}
                    onSave={() => {}}
                    onDelete={() => deleteTask(task.id)}
                    onToggleNotes={() => setExpandedNotesId(prev => prev === task.id ? null : task.id)}
                    onUpdateNotes={(notes) => updateTaskNotes(task.id, notes)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="w-14 h-14 rounded-full shadow-lg btn-add"
          >
            <Plus className="h-6 w-6" />
          </Button>
        ) : (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowForm(false)}
            />
            {/* Form */}
            <div className="relative z-50 bg-card rounded-lg shadow-xl p-4 w-80 animate-fade-in border">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-card-foreground">Add New Task</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  placeholder="Task name..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />
                <Button onClick={handleAdd} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Add Task
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface TaskRowProps {
  task: { id: number; text: string; completed: boolean; starred?: boolean; notes?: string };
  editing: boolean;
  notesExpanded: boolean;
  onToggle: () => void;
  onStar: () => void;
  onEdit: () => void;
  onSave: (text: string) => void;
  onDelete: () => void;
  onToggleNotes: () => void;
  onUpdateNotes: (notes: string) => void;
}

const TaskRow = ({ task, editing, notesExpanded, onToggle, onStar, onEdit, onSave, onDelete, onToggleNotes, onUpdateNotes }: TaskRowProps) => {
  const [text, setText] = useState(task.text);
  const [notes, setNotes] = useState(task.notes || '');

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
            className="flex-1 bg-transparent outline-none text-sm font-medium"
          />
        ) : (
          <button
            onClick={onEdit}
            className={cn(
              "flex-1 text-left text-sm font-medium break-words",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.text}
          </button>
        )}

        <button
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
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
