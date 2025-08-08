import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { TaskList as TaskListType, Task } from '../types';
import { TaskCard } from './TaskCard';
import { formatTimeCompact, calculatePerformance } from '../utils/timeFormat';

interface TaskListProps {
  list: TaskListType;
  onUpdate: (updates: Partial<TaskListType>) => void;
  onDelete: () => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskMove: (taskId: string, targetListId: string) => void;
  onTaskStart: (taskId: string) => void;
  onTaskPause: (taskId: string) => void;
  onTaskResume: (taskId: string) => void;
  onTaskFinish: (taskId: string) => void;
  onTaskAddTime: (taskId: string, seconds: number) => void;
  onTaskUndoTime: (taskId: string) => void;
  getTimerState: (task: Task) => 'idle' | 'running' | 'paused' | 'finished';
  liveRemaining: (task: Task) => number;
  activeTimerId: string | null;
  onDragStart: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  list,
  onUpdate,
  onDelete,
  onTaskUpdate,
  onTaskDelete,
  onTaskMove,
  onTaskStart,
  onTaskPause,
  onTaskResume,
  onTaskFinish,
  onTaskAddTime,
  onTaskUndoTime,
  getTimerState,
  liveRemaining,
 activeTimerId,
  onDragStart
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(list.title);

  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item: { id: string; sourceListId: string }) => {
      if (item.sourceListId !== list.id) {
        onTaskMove(item.id, list.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const activeTasks = list.tasks.filter(task => !task.isCompleted);
  const completedTasks = list.tasks.filter(task => task.isCompleted);

  const handleTitleSave = () => {
    if (tempTitle.trim()) {
      onUpdate({ title: tempTitle.trim() });
      setIsEditingTitle(false);
    } else {
      setTempTitle(list.title);
      setIsEditingTitle(false);
    }
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: uuidv4(),
      title: '',
      allocatedTime: 0,
      usedTime: 0,
      isCompleted: false,
      isRunning: false,
      isPaused: false,
      timeHistory: [],
      createdAt: new Date()
    };

    onUpdate({
      tasks: [...list.tasks, newTask]
    });
  };

  return (
    <div
      ref={drop}
      className={`min-w-[85%] xs:min-w-[18rem] sm:min-w-[20rem] md:min-w-[22rem] max-w-[24rem] snap-start rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl dark:shadow-2xl p-3 sm:p-4 md:p-6 min-h-[160px] sm:min-h-[200px] transition-all duration-300 ease-out hover:shadow-2xl dark:hover:shadow-3xl ${
        isOver ? 'bg-blue-50/80 dark:bg-blue-900/30 ring-2 ring-blue-400/70 dark:ring-blue-500/50 scale-105' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') {
                setTempTitle(list.title);
                setIsEditingTitle(false);
              }
            }}
            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-blue-300 dark:border-blue-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200"
            autoFocus
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex-1 transition-colors duration-200"
          >
            {list.title}
          </h2>
        )}
        
        <button
          onClick={onDelete}
          className="p-1.5 sm:p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 rounded-lg sm:rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 ml-1 sm:ml-2 transition-all duration-200 hover:scale-110 touch-manipulation"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {activeTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            sourceListId={list.id}
            onUpdate={(updates) => onTaskUpdate(task.id, updates)}
            onDelete={() => onTaskDelete(task.id)}
            onStart={() => onTaskStart(task.id)}
            onPause={() => onTaskPause(task.id)}
            onResume={() => onTaskResume(task.id)}
            onFinish={() => onTaskFinish(task.id)}
            onAddTime={(seconds) => onTaskAddTime(task.id, seconds)}
            onUndoTime={() => onTaskUndoTime(task.id)}
            timerState={getTimerState(task)}
            liveRemaining={liveRemaining}
            isActiveTimer={activeTimerId === task.id}
            onDragStart={onDragStart}
          />
        ))}

        <button
          onClick={handleAddTask}
          className="w-full p-2.5 sm:p-3 border-2 border-dashed border-slate-300/60 dark:border-slate-600/60 rounded-lg sm:rounded-xl text-slate-600 dark:text-slate-400 hover:border-blue-400/80 dark:hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group touch-manipulation"
        >
          <div className="p-0.5 sm:p-1 rounded-md sm:rounded-lg bg-slate-200/60 dark:bg-slate-700/60 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-all duration-300">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-sm sm:text-base">Add Task</span>
        </button>

        {completedTasks.length > 0 && (
          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3">
            <div className="border-t border-slate-200/60 dark:border-slate-600/60 pt-2 sm:pt-3">
              <h3 className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 sm:mb-3 font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Completed
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {completedTasks.map((task) => {
                  const performance = calculatePerformance(task.allocatedTime, task.usedTime);
                  return (
                    <div
                      key={task.id}
                      className="bg-slate-50/80 dark:bg-slate-800/60 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-all duration-200"
                    >
                      <div className="space-y-1">
                        {/* Title and flag emoji */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm">🏁</span>
                          <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                            {task.title}
                          </span>
                        </div>
                        
                        {/* Allocated time */}
                        <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          Allocated: {formatTimeCompact(task.allocatedTime)}
                        </div>
                        
                        {/* Performance */}
                        <div className={`text-[10px] sm:text-xs font-semibold ${
                          performance.isOvertime 
                            ? 'text-red-500 dark:text-red-400' 
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          Performance: {performance.isOvertime ? '-' : '+'}{formatTimeCompact(performance.difference)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};