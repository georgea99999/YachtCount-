export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  box: string;
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
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

export type TabType = 'stock' | 'deckOrder' | 'tasks' | 'damage' | 'reports';

export interface DeckOrderItem {
  id: number;
  productName: string;
  quantity: string;
  colour: string;
  size: string;
  link: string;
}

