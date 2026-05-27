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
  notes?: string;
  assignees?: string[];
  /** @deprecated use assignees */
  assignee?: string;
}

export interface UsageEntry {
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

export const BOX_OPTIONS = [
  "BOX BS1", "BOX BS2", "BOX BS3", "BOX BS4", "BOX BS5 & BS5+", "BOX BS6",
  "BOX BS7", "BOX BS8", "BOX BS9", "BOX BS10", "BOX BS11", "BOX BS12",
  "BOX BS13 LSA", "BOX BS14", "BOX BS15", "BOX BS16", "BOX BS17", "BOX BS18",
  "BOX BS19", "BOX BS20", "BOX BS21", "BOX BS22", "BOX PPE",
  "BOX PS1", "BOX PS2", "BOX PS3", "BOX PS4", "BOX PS5", "BOX PS6",
  "BOX PS7", "BOX PS8", "BOX PS9", "BOX PS10", "BOX PS11",
  "PAINT INVENTORY", "ESTECH INVENTORY"
];
