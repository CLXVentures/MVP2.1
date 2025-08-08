import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';

interface UseTimerReturn {
  startTimer: (taskId: string) => void;
  pauseTimer: (taskId: string) => void;
  resumeTimer: (taskId: string) => void;
  finishTimer: (taskId: string) => void;
  addTime: (taskId: string, seconds: number) => void;
  undoLastTime: (taskId: string) => void;
  getTimerState: (task: Task) => 'idle' | 'running' | 'paused' | 'finished';
  liveRemaining: (task: Task) => number;
  activeTimerId: string | null;
}

export const useTimer = (
  tasks: Task[],
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
): UseTimerReturn => {
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);

  // Single interval that ticks only the active task
  useEffect(() => {
    const runningTask = tasks.find(t => t.isRunning && !t.isCompleted);
    if (!runningTask) {
      setActiveTimerId(null);
      return;
    }

    setActiveTimerId(runningTask.id);

    const interval = setInterval(() => {
      // Force re-render by updating a dummy state to trigger component updates
      // This ensures the liveRemaining calculation updates the display
      onTaskUpdate(runningTask.id, {});
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks, onTaskUpdate]);

  const pauseAllOtherTasks = useCallback((exceptTaskId: string) => {
    tasks.forEach(task => {
      if (task.id !== exceptTaskId && task.isRunning && !task.isCompleted) {
        // Apply time delta before pausing
        if (task.startedAt) {
          const deltaSeconds = Math.floor((Date.now() - task.startedAt) / 1000);
          onTaskUpdate(task.id, {
            usedTime: task.usedTime + deltaSeconds,
            isRunning: false,
            isPaused: true,
            startedAt: undefined
          });
        } else {
          onTaskUpdate(task.id, {
            isRunning: false,
            isPaused: true
          });
        }
      }
    });
  }, [tasks, onTaskUpdate]);
  const startTimer = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.isCompleted || !task.title?.trim() || task.allocatedTime <= 0) {
      return;
    }

    // Pause all other tasks first
    pauseAllOtherTasks(taskId);

    setActiveTimerId(taskId);

    onTaskUpdate(taskId, {
      isRunning: true,
      isPaused: false,
      startedAt: Date.now()
    });
  }, [tasks, onTaskUpdate, pauseAllOtherTasks]);

  const pauseTimer = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Only pause if task is actually running
    if (!task.isRunning) return;

    // Apply time delta if task was running
    let updates: Partial<Task> = {
      isRunning: false,
      isPaused: true,
      startedAt: undefined
    };

    if (task.startedAt) {
      const deltaSeconds = Math.floor((Date.now() - task.startedAt) / 1000);
      updates.usedTime = task.usedTime + deltaSeconds;
    }

    onTaskUpdate(taskId, updates);
    setActiveTimerId(null);
  }, [tasks, onTaskUpdate]);

  const resumeTimer = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.isCompleted || !task.title?.trim()) {
      return;
    }

    // Pause all other tasks first
    pauseAllOtherTasks(taskId);

    setActiveTimerId(taskId);
    onTaskUpdate(taskId, {
      isRunning: true,
      isPaused: false,
      startedAt: Date.now()
    });
  }, [tasks, onTaskUpdate, pauseAllOtherTasks]);

  const finishTimer = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let updates: Partial<Task> = {
      isRunning: false,
      isPaused: false,
      isCompleted: true,
      completedAt: new Date(),
      startedAt: undefined
    };

    // Apply time delta if task was running
    if (task.isRunning && task.startedAt) {
      const deltaSeconds = Math.floor((Date.now() - task.startedAt) / 1000);
      updates.usedTime = task.usedTime + deltaSeconds;
    }

    setActiveTimerId(null);
    onTaskUpdate(taskId, updates);
  }, [tasks, onTaskUpdate]);

  const addTime = useCallback((taskId: string, seconds: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.isCompleted) {
      const newTimeHistory = [...(task.timeHistory || []), seconds];
      onTaskUpdate(taskId, {
        allocatedTime: task.allocatedTime + seconds,
        timeHistory: newTimeHistory
      });
    }
  }, [tasks, onTaskUpdate]);

  const undoLastTime = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.timeHistory && task.timeHistory.length > 0) {
      const lastAddedTime = task.timeHistory[task.timeHistory.length - 1];
      const newTimeHistory = task.timeHistory.slice(0, -1);
      onTaskUpdate(taskId, {
        allocatedTime: Math.max(0, task.allocatedTime - lastAddedTime),
        timeHistory: newTimeHistory
      });
    }
  }, [tasks, onTaskUpdate]);

  const getTimerState = useCallback((task: Task): 'idle' | 'running' | 'paused' | 'finished' => {
    if (task.isCompleted) return 'finished';
    if (task.isRunning) return 'running';
    if (task.isPaused) return 'paused';
    return 'idle';
  }, []);

  const liveRemaining = useCallback((task: Task): number => {
    if (task.isRunning && task.startedAt) {
      const deltaSeconds = Math.floor((Date.now() - task.startedAt) / 1000);
      return Math.max(0, task.allocatedTime - task.usedTime - deltaSeconds);
    }
    return Math.max(0, task.allocatedTime - task.usedTime);
  }, []);

  return {
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    addTime,
    undoLastTime,
    getTimerState,
    liveRemaining,
    activeTimerId
  };
};