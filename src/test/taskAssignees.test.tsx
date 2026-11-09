import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TaskList from '@/components/tasks/TaskList';

const mock = vi.hoisted(() => ({
  members: ['Alice Smith', 'Bob Jones'],
  addTask: vi.fn(),
}));

vi.mock('@/hooks/useCrew', () => ({
  useCrew: () => ({ members: mock.members }),
}));

vi.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: [{ id: 1, text: 'Legacy task', completed: false, assignees: ['Former Crew'] }],
    deletedTasks: [],
    addTask: mock.addTask,
    toggleTask: vi.fn(),
    toggleStar: vi.fn(),
    updateTaskFields: vi.fn(),
    setTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
    restoreTask: vi.fn(),
    clearDeletedTasks: vi.fn(),
  }),
}));

vi.mock('@/components/Attachments', () => ({ default: () => null }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const openNewTask = () => {
  render(<TaskList />);
  fireEvent.click(screen.getByRole('button', { name: 'Add task' }));
  return screen.getByLabelText(/Assign to/);
};

describe('task crew assignment', () => {
  it('offers only active crew registered to the current vessel', () => {
    const dropdown = openNewTask();
    const options = Array.from(dropdown.querySelectorAll('option')).map(option => option.textContent);
    expect(options).toEqual(['Select crew member', 'Alice Smith', 'Bob Jones']);
    expect(screen.queryByRole('option', { name: 'Former Crew' })).not.toBeInTheDocument();
  });

  it('does not show historical unregistered assignees as filter tabs', () => {
    render(<TaskList />);
    expect(screen.queryByRole('button', { name: /Former Crew/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Alice Smith/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bob Jones/ })).toBeInTheDocument();
  });

  it('assigns multiple registered crew members to a task', async () => {
    mock.addTask.mockResolvedValue(true);
    const dropdown = openNewTask();
    fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Wash down decks' } });
    fireEvent.change(dropdown, { target: { value: 'Alice Smith' } });
    fireEvent.change(dropdown, { target: { value: 'Bob Jones' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }));

    await waitFor(() => expect(mock.addTask).toHaveBeenCalledWith('Wash down decks', {
      notes: '',
      starred: false,
      assignees: ['Alice Smith', 'Bob Jones'],
    }));
  });
});
