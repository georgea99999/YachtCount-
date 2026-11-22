import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TaskList from '@/components/tasks/TaskList';

const mock = vi.hoisted(() => ({ save: vi.fn() }));

vi.mock('@/hooks/useCrew', () => ({ useCrew: () => ({ members: ['John Smith'] }) }));
vi.mock('@/components/Attachments', () => ({ default: () => null }));
vi.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: [{
      id: 42, text: 'Anchor Locker Prep', completed: false, starred: false,
      checklist: [
        { id: 'oil', text: 'Check windlass oil', done: true },
        { id: 'pins', text: 'Secure safety pins', done: false },
      ],
    }],
    deletedTasks: [], addTask: vi.fn(), toggleTask: vi.fn(), toggleStar: vi.fn(),
    updateTaskFields: mock.save, setTaskStatus: vi.fn(), toggleChecklistItem: vi.fn(),
    deleteTask: vi.fn(), restoreTask: vi.fn(), clearDeletedTasks: vi.fn(),
  }),
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });

const openTask = () => {
  localStorage.setItem('yc_tasks_view', 'list');
  render(<TaskList />);
  fireEvent.click(screen.getByRole('button', { name: /Anchor Locker Prep/ }));
};

describe('existing task checklist editing', () => {
  it('saves renamed checklist entries while preserving IDs, completion and other entries', async () => {
    mock.save.mockResolvedValue(true);
    openTask();
    fireEvent.change(screen.getByRole('textbox', { name: 'Checklist item 1' }), { target: { value: ' Check windlass oil level ' } });
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }));
    await waitFor(() => expect(mock.save).toHaveBeenCalledWith(42, expect.objectContaining({
      checklist: [
        { id: 'oil', text: 'Check windlass oil level', done: true },
        { id: 'pins', text: 'Secure safety pins', done: false },
      ],
    })));
  });

  it('discards checklist text edits when cancelled', () => {
    openTask();
    fireEvent.change(screen.getByRole('textbox', { name: 'Checklist item 2' }), { target: { value: 'Replace safety pins' } });
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/ }));
    expect(mock.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Anchor Locker Prep/ }));
    expect(screen.getByRole('textbox', { name: 'Checklist item 2' })).toHaveValue('Secure safety pins');
  });

  it('does not save an empty checklist entry', () => {
    openTask();
    fireEvent.change(screen.getByRole('textbox', { name: 'Checklist item 1' }), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }));
    expect(mock.save).not.toHaveBeenCalled();
  });
});