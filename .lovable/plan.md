## Goal

1. Tapping a task in the To Do list reopens the same dialog used for adding a task, prefilled with that task's fields, so the user can edit everything (text, notes, starred, assignees) in one place.
2. Tasks can be assigned to multiple people instead of just one.

## Changes

### Types (`src/types/inventory.ts`)
- Change `assignee?: string` to `assignees?: string[]` on the `Task` interface.

### Hook (`src/hooks/useTasks.ts`)
- `addTask` opts: replace `assignee?: string` with `assignees?: string[]`.
- Replace `updateTaskAssignee(id, string)` with `updateTaskAssignees(id, string[])`.
- Add a single `updateTaskFields(id, Partial<Task>)` helper so the edit dialog can save text + notes + starred + assignees in one call (cleaner than calling 4 setters).
- Lightweight migration on load: if a stored task has legacy `assignee` string, map it into `assignees: [assignee]`.

### TaskList (`src/components/tasks/TaskList.tsx`)
Unify add and edit into one dialog:
- Single `TaskDialog` component with mode `add | edit`. On submit:
  - add → `addTask(...)`
  - edit → `updateTaskFields(id, {...})`
- Dialog title: "New Task" / "Edit Task". Edit mode shows a Delete button on the left of the footer.
- Tapping a task row (the label area) opens the dialog in edit mode prefilled with that task. The circle checkbox, star, and delete icons keep their current behavior and do not open the dialog.
- Remove the inline rename input, inline notes textarea, inline assign input, and the per-row StickyNote / UserPlus buttons — all of that lives in the dialog now. Row becomes: checkbox · text + assignee chips · star · delete (on hover).

Multi-assignee UI inside the dialog:
- "Assign to" section becomes a chip editor: existing assignees render as removable pills; an input with the existing `datalist` suggestions adds a new one on Enter or comma. Empty list = unassigned.
- Row display: show up to 2 assignee chips inline with a "+N" overflow chip.
- Filter tabs at the top: "All", "Unassigned", and one tab per unique person across all tasks' `assignees` arrays. A task matches a person-tab if that person is in its `assignees`.

### Out of scope
- No backend/storage schema beyond the localStorage shape already used by `useTasks`.
- No changes to other tabs, sidebar, or PDF export.

## Technical notes
- Legacy migration runs once in `useEffect` load: `tasks.map(t => t.assignee && !t.assignees ? { ...t, assignees: [t.assignee], assignee: undefined } : t)` then `save`.
- `updateTaskFields` merges: `prev.map(t => t.id === id ? { ...t, ...patch } : t)`; trims strings, drops empty assignees, dedupes case-insensitively while preserving original casing of first occurrence.
- Dialog state seeded from the task when opening edit mode; closing resets state. Reuse the existing `Dialog` shadcn component.
