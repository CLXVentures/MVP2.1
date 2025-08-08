import { Board } from '../types';

const STORAGE_KEY = 'task-timer-board';

export const saveBoard = (board: Board): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch (error) {
    console.error('Failed to save board to localStorage:', error);
  }
};

export const loadBoard = (): Board | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const board = JSON.parse(stored);
    // Convert date strings back to Date objects
    board.createdAt = new Date(board.createdAt);
    board.updatedAt = new Date(board.updatedAt);
    
    board.lists.forEach((list: any) => {
      list.createdAt = new Date(list.createdAt);
      list.tasks.forEach((task: any) => {
        task.createdAt = new Date(task.createdAt);
        if (task.completedAt) {
          task.completedAt = new Date(task.completedAt);
        }
      });
    });
    
    return board;
  } catch (error) {
    console.error('Failed to load board from localStorage:', error);
    return null;
  }
};

export const clearBoard = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear board from localStorage:', error);
  }
};