export interface Task {
  id: string;
  title: string;
  notes?: string;
  allocatedTime: number; // in seconds
  usedTime: number; // in seconds
  isCompleted: boolean;
  isRunning: boolean;
  isPaused: boolean;
  timeHistory?: number[]; // track time additions for undo
  startedAt?: number; // ms since epoch, set when starting/resuming
  createdAt: Date;
  completedAt?: Date;
}

export interface TaskList {
  id: string;
  title: string;
  tasks: Task[];
  createdAt: Date;
}

export interface Board {
  id: string;
  title: string;
  lists: TaskList[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardStats {
  currentTasks: number;
  totalTasks: number;
  totalAllocatedTime: number;
  totalRemainingTime: number;
  pointsWon: number;
  pointsLost: number;
  finishEfficiency: number;
}

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';