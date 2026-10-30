export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  box: string;
  /** Minimum stock alert threshold; undefined = no alert */
  minQuantity?: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  status?: TaskStatus;
  starred?: boolean;
  completedAt?: string;
  createdBy?: string;
  completedBy?: string;
  deletedAt?: string;
  notes?: string;
  assignees?: string[];
  /** @deprecated use assignees */
  assignee?: string;
}

export interface UsageEntry {
  actorUsername?: string;
  date: string;
  itemName: string;
  box: string;
  quantity: number;
}

export interface Notification {
  id: number;
  type: 'deleted' | 'added' | 'updated';
  message: string;
  itemName: string;
  timestamp: string;
  deletedItemData?: {
    name: string;
    quantity: number;
    box: string;
    originalIndex: number;
  };
}

export type TabType = 'stock' | 'deckOrder' | 'tasks' | 'reports';

export interface DeckOrderItem {
  id: number;
  productName: string;
  quantity: string;
  colour: string;
  size: string;
  link: string;
}

