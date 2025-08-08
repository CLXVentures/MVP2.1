import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Board as BoardType, TaskList, Task, BoardStats as BoardStatsType } from '../types';
import { TaskList as TaskListComponent } from './TaskList';
import { BoardStats } from './BoardStats';
import { ThemeToggle } from './ThemeToggle';
import { useTimer } from '../hooks/useTimer';
import { saveBoard, loadBoard } from '../utils/storage';
import { calculatePerformance } from '../utils/timeFormat';

export const Board: React.FC = () => {
  const [board, setBoard] = useState<BoardType>(() => {
    const saved = loadBoard();
    if (saved) return saved;
    
    return {
      id: uuidv4(),
      title: 'Task Timer Board',
      lists: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  const [boardStats, setBoardStats] = useState<BoardStatsType>({
    currentTasks: 0,
    totalTasks: 0,
    totalAllocatedTime: 0,
    totalRemainingTime: 0,
    pointsWon: 0,
    pointsLost: 0,
    finishEfficiency: 0
  });

  // Flatten all tasks for timer hook
  const allTasks = board.lists.flatMap(list => list.tasks);

  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(list => ({
        ...list,
        tasks: list.tasks.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      })),
      updatedAt: new Date()
    }));
  }, []);

  const {
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    addTime,
    undoLastTime,
    getTimerState,
    liveRemaining,
    activeTimerId
  } = useTimer(allTasks, handleTaskUpdate);

  // Global auto-pause on outside interaction
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!activeTimerId) return;
      
      const target = event.target as Element;
      const taskCard = target.closest('[data-task-id]');
      
      if (!taskCard || taskCard.getAttribute('data-task-id') !== activeTimerId) {
        pauseTimer(activeTimerId);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [activeTimerId, pauseTimer]);

  // Auto-pause when starting a drag
  const handleDragStart = useCallback(() => {
    if (activeTimerId) {
      pauseTimer(activeTimerId);
    }
  }, [activeTimerId, pauseTimer]);

  // Calculate board statistics
  useEffect(() => {
    const stats: BoardStatsType = {
      currentTasks: 0,
      totalTasks: 0,
      totalAllocatedTime: 0,
      totalRemainingTime: 0,
      pointsWon: 0,
      pointsLost: 0,
      finishEfficiency: 0
    };

    let completedTasksCount = 0;
    let tasksFinishedUnderTime = 0;

    board.lists.forEach(list => {
      list.tasks.forEach(task => {
        stats.totalTasks++;
        stats.totalAllocatedTime += task.allocatedTime;

        if (!task.isCompleted) {
          stats.currentTasks++;
          stats.totalRemainingTime += Math.max(0, task.allocatedTime - task.usedTime);
        } else {
          completedTasksCount++;
          const performance = calculatePerformance(task.allocatedTime, task.usedTime);
          
          if (performance.isOvertime) {
            stats.pointsLost += performance.difference;
          } else {
            stats.pointsWon += performance.difference;
            tasksFinishedUnderTime++;
          }
        }
      });
    });

    stats.finishEfficiency = completedTasksCount > 0 
      ? (tasksFinishedUnderTime / completedTasksCount) * 100 
      : 0;

    setBoardStats(stats);
  }, [board]);

  // Save to localStorage whenever board changes
  useEffect(() => {
    saveBoard(board);
  }, [board]);

  const handleAddList = () => {
    const newList: TaskList = {
      id: uuidv4(),
      title: 'New List',
      tasks: [],
      createdAt: new Date()
    };

    setBoard(prev => ({
      ...prev,
      lists: [...prev.lists, newList],
      updatedAt: new Date()
    }));
  };

  const handleListUpdate = (listId: string, updates: Partial<TaskList>) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(list =>
        list.id === listId ? { ...list, ...updates } : list
      ),
      updatedAt: new Date()
    }));
  };

  const handleListDelete = (listId: string) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.filter(list => list.id !== listId),
      updatedAt: new Date()
    }));
  };

  const handleTaskDelete = (listId: string, taskId: string) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(list =>
        list.id === listId
          ? { ...list, tasks: list.tasks.filter(task => task.id !== taskId) }
          : list
      ),
      updatedAt: new Date()
    }));
  };

  const handleTaskMove = (taskId: string, targetListId: string) => {
    setBoard(prev => {
      let taskToMove: Task | null = null;
      
      // Find and remove task from source list
      const listsAfterRemoval = prev.lists.map(list => ({
        ...list,
        tasks: list.tasks.filter(task => {
          if (task.id === taskId) {
            taskToMove = task;
            return false;
          }
          return true;
        })
      }));

      // Add task to target list
      if (taskToMove) {
        const finalLists = listsAfterRemoval.map(list =>
          list.id === targetListId
            ? { ...list, tasks: [...list.tasks, taskToMove!] }
            : list
        );

        return {
          ...prev,
          lists: finalLists,
          updatedAt: new Date()
        };
      }

      return prev;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-2 py-3 sm:px-4 md:px-6 transition-colors duration-500">
        <div className="max-w-7xl mx-auto">
          <header className="mb-4 sm:mb-6 md:mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BoardTitle 
                    title={board.title}
                    onUpdate={(title) => setBoard(prev => ({ ...prev, title, updatedAt: new Date() }))}
                  />
                </div>
                <ThemeToggle />
              </div>
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
                <BoardStats stats={boardStats} />
              </div>
            </div>
          </header>

          <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-x-auto pb-4 sm:pb-5 -mx-2 px-2 sm:-mx-3 sm:px-3 snap-x snap-mandatory scrollbar-hide">
            {board.lists.map((list) => (
              <TaskListComponent
                key={list.id}
                list={list}
                onUpdate={(updates) => handleListUpdate(list.id, updates)}
                onDelete={() => handleListDelete(list.id)}
                onTaskUpdate={(taskId, updates) => handleTaskUpdate(taskId, updates)}
                onTaskDelete={(taskId) => handleTaskDelete(list.id, taskId)}
                onTaskMove={handleTaskMove}
                onTaskStart={startTimer}
                onTaskPause={pauseTimer}
                onTaskResume={resumeTimer}
                onTaskFinish={finishTimer}
                onTaskAddTime={addTime}
                onTaskUndoTime={undoLastTime}
                getTimerState={getTimerState}
                liveRemaining={liveRemaining}
                activeTimerId={activeTimerId}
                onDragStart={handleDragStart}
              />
            ))}

            <div className="min-w-[85%] xs:min-w-[18rem] sm:min-w-[20rem] md:min-w-[22rem] max-w-[24rem] snap-start bg-slate-100/60 dark:bg-slate-800/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-dashed border-slate-300/60 dark:border-slate-600/40 hover:border-blue-400/60 dark:hover:border-blue-500/40 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-all duration-300 backdrop-blur-sm">
              <button
                onClick={handleAddList}
                className="w-full h-full min-h-[160px] sm:min-h-[200px] flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 group"
              >
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-200/60 dark:bg-slate-700/60 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-all duration-300 mb-2 sm:mb-3 group-hover:scale-110">
                  <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <span className="text-base sm:text-lg font-semibold">Add List</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

interface BoardTitleProps {
  title: string;
  onUpdate: (title: string) => void;
}

const BoardTitle: React.FC<BoardTitleProps> = ({ title, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const handleSave = () => {
    if (tempTitle.trim()) {
      onUpdate(tempTitle.trim());
      setIsEditing(false);
    } else {
      setTempTitle(title);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={tempTitle}
        onChange={(e) => setTempTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') {
            setTempTitle(title);
            setIsEditing(false);
          }
        }}
        className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 bg-transparent border-0 border-b-2 border-blue-500 dark:border-blue-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-300 pb-1 transition-colors duration-200 w-full"
        autoFocus
      />
    );
  }

  return (
    <h1
      onClick={() => setIsEditing(true)}
      className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
    >
      {title}
    </h1>
  );
};