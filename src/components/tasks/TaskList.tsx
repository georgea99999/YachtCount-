import { useState, useMemo } from 'react';
import { Circle, CheckCircle2, Star, Plus, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

const TaskList = () => {
  const { tasks, addTask, toggleTask, toggleStar, updateTask, deleteTask } = useTasks();
  const [newTask, setNewTask] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const handleAdd = () => {
    addTask(newTask);
    setNewTask('');
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
              onToggle={() => toggleTask(task.id)}
              onStar={() => toggleStar(task.id)}
              onEdit={() => setEditingId(task.id)}
              onSave={(text) => { updateTask(task.id, text); setEditingId(null); }}
              onDelete={() => deleteTask(task.id)}
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
                    onToggle={() => toggleTask(task.id)}
                    onStar={() => toggleStar(task.id)}
                    onEdit={() => {}}
                    onSave={() => {}}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add task bar */}
      <div className="absolute left-0 right-0 bottom-0 md:left-16 p-4 bg-gradient-to-t from-primary via-primary to-transparent">
        <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15 rounded-xl px-4 py-3.5">
          <Plus className="h-5 w-5 text-primary-foreground/80 shrink-0" />
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add a Task"
            className="flex-1 bg-transparent outline-none text-primary-foreground placeholder:text-primary-foreground/60 text-base"
          />
          {newTask.trim() && (
            <button
              onClick={handleAdd}
              className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface TaskRowProps {
  task: { id: number; text: string; completed: boolean; starred?: boolean };
  editing: boolean;
  onToggle: () => void;
  onStar: () => void;
  onEdit: () => void;
  onSave: (text: string) => void;
  onDelete: () => void;
}

const TaskRow = ({ task, editing, onToggle, onStar, onEdit, onSave, onDelete }: TaskRowProps) => {
  const [text, setText] = useState(task.text);

  return (
    <div className="group flex items-center gap-3 bg-card text-card-foreground rounded-xl px-4 py-3.5 shadow-sm">
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

      <button onClick={onStar} className="shrink-0" aria-label="Star task">
        <Star
          className={cn(
            "h-5 w-5 transition-colors",
            task.starred ? "fill-accent text-accent" : "text-muted-foreground/50 hover:text-accent"
          )}
        />
      </button>
    </div>
  );
};

export default TaskList;
