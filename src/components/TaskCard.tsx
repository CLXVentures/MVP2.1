import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Play, Pause, Square, Undo2, X, Maximize2, Minimize2 } from 'lucide-react';
import { Task } from '../types';
import { formatTime, formatTimeCompact, formatTimeDigital, calculatePerformance } from '../utils/timeFormat';

interface TaskCardProps {
  task: Task;
  sourceListId: string;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onAddTime: (seconds: number) => void;
  onUndoTime: () => void;
  timerState: 'idle' | 'running' | 'paused' | 'finished';
  liveRemaining: (task: Task) => number;
  isActiveTimer: boolean;
  onDragStart: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  sourceListId,
  onUpdate,
  onDelete,
  onStart,
  onPause,
  onResume,
  onFinish,
  onAddTime,
  onUndoTime,
  timerState,
  liveRemaining,
  isActiveTimer,
  onDragStart
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(task.title);
  const [showTimePanel, setShowTimePanel] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: { id: task.id, sourceListId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    if (isDragging) {
      onDragStart();
    }
  }, [isDragging, onDragStart]);

  const handleTitleSave = () => {
    if (tempTitle.trim()) {
      onUpdate({ title: tempTitle.trim() });
      setIsEditingTitle(false);
    } else {
      setTempTitle(task.title);
      setIsEditingTitle(false);
    }
  };

  const handleNotesUpdate = (notes: string) => {
    onUpdate({ notes });
  };

  const handleExpandClick = () => {
    if (task.isRunning) {
      onPause();
    }
    setIsExpanded(true);
  };

  const canStart = task.title.trim() !== '' && task.allocatedTime > 0;
  const canAddTime = task.title.trim() !== '' && !task.isCompleted && timerState !== 'running';
  const canOpenTimePanel = task.title.trim() !== '' && timerState !== 'running';
  const performance = task.isCompleted ? calculatePerformance(task.allocatedTime, task.usedTime) : null;
  
  const remainingTime = liveRemaining(task);

  const cardClasses = `
    bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg transition-all duration-300 ease-out hover:shadow-xl
    ${timerState === 'running' ? 'ring-2 ring-emerald-400/70 dark:ring-emerald-500/50 shadow-emerald-100 dark:shadow-emerald-900/20' : 'border border-slate-200/60 dark:border-slate-700/60'}
    ${isDragging ? 'opacity-50' : ''}
    ${task.isCompleted ? 'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/40' : ''}
    ${showTimePanel ? 'z-[50]' : ''}
  `;

  const TimerDisplay = ({ compact = false }: { compact?: boolean }) => {
    const displayRemaining = remainingTime;
    const isLowTime = displayRemaining <= 60 && timerState === 'running';
    
    // Force re-render when timer is running by using current timestamp
    const [, forceUpdate] = useState({});
    useEffect(() => {
      if (timerState === 'running') {
        const interval = setInterval(() => {
          forceUpdate({});
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [timerState]);
    
    return (
      <div className={`${compact ? 'text-base sm:text-lg md:text-xl' : 'text-xl sm:text-2xl md:text-3xl'} font-mono transition-colors duration-200`}>
        <div className={`
          inline-block px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-mono tabular-nums font-semibold tracking-wide
          ${isLowTime 
            ? 'text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30' 
            : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30'
          }
          transition-all duration-300
        `}>
          {formatTimeDigital(displayRemaining)}
        </div>
      </div>
    );
  };

  const TimeControls = () => (
    <div className="space-y-2 sm:space-y-3">
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <button
          onClick={() => onAddTime(120)}
          disabled={!canAddTime}
          className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md sm:rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation"
        >
          2m
        </button>
        <button
          onClick={() => onAddTime(600)}
          disabled={!canAddTime}
          className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md sm:rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation"
        >
          10m
        </button>
        <button
          onClick={() => onAddTime(1800)}
          disabled={!canAddTime}
          className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md sm:rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation"
        >
          30m
        </button>
        <button
          onClick={onUndoTime}
          disabled={!task.timeHistory || task.timeHistory.length === 0 || task.isCompleted}
          className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md sm:rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 touch-manipulation"
        >
          <Undo2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  const ActionButtons = () => {
    if (timerState === 'idle') {
      return (
        <div className="flex justify-center">
          <button
            onClick={onStart}
            disabled={!canStart}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all duration-200 touch-manipulation min-h-[44px]"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
            Start
          </button>
        </div>
      );
    }
    
    if (timerState === 'running') {
      return (
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              onPause();
            }}
            className="px-2 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-all duration-200 touch-manipulation min-h-[44px]"
          >
            <span className="text-sm sm:text-base">✋</span>
            Pause
          </button>
          <button
            onClick={onFinish}
            className="px-2 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-all duration-200 touch-manipulation min-h-[44px]"
          >
            <span className="text-sm sm:text-base">🏁</span>
            Finish
          </button>
        </div>
      );
    }
    
    if (timerState === 'paused') {
      return (
        <div className="space-y-2 sm:space-y-3">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <button
              onClick={onResume}
              className="px-2 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-all duration-200 touch-manipulation min-h-[44px]"
            >
              <span className="text-sm sm:text-base">🏃</span>
              Resume
            </button>
            <button
              onClick={onFinish}
              className="px-2 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-all duration-200 touch-manipulation min-h-[44px]"
            >
              <span className="text-sm sm:text-base">🏁</span>
              Finish
            </button>
          </div>
          <TimeControls />
        </div>
      );
    }
    
    return null;
  };

  if (isExpanded) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border-2 border-blue-200 dark:border-blue-600 p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 flex-1 min-w-0">
            {task.isCompleted && <span className="text-emerald-500">✓</span>}
            <span className="truncate">{task.title}</span>
          </h3>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 touch-manipulation"
            >
              <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {!task.isCompleted && (
              <button
                onClick={onDelete}
                className="p-1.5 sm:p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 touch-manipulation"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <TimerDisplay />
        </div>

        {timerState === 'finished' && performance && (
          <div className={`p-2.5 sm:p-3 rounded-lg ${performance.isOvertime ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
            <div className="flex items-center gap-2 text-sm">
              <span>⚡ Points:</span>
              <span className={`font-semibold ${performance.isOvertime ? 'text-red-600' : 'text-green-600'}`}>
                {performance.isOvertime ? '-' : '+'}{formatTimeCompact(performance.difference)}
              </span>
            </div>
          </div>
        )}

        {!task.isCompleted && (
          <div className="space-y-2 sm:space-y-3">
            <ActionButtons />
          </div>
        )}

        <div className="space-y-2 sm:space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
          <textarea
            value={task.notes || ''}
            onChange={(e) => handleNotesUpdate(e.target.value)}
            disabled={task.isCompleted}
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
            rows={3}
            placeholder="Add notes about this task..."
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={drag} className={`${cardClasses} group`} data-task-id={task.id}>
      <div className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setTempTitle(task.title);
                  setIsEditingTitle(false);
                }
              }}
              className="text-sm sm:text-base font-medium flex-1 text-slate-800 dark:text-slate-100 bg-transparent border-0 border-b border-blue-300 dark:border-blue-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 pb-1 transition-colors duration-200"
              autoFocus
            />
          ) : (
            <h3
              onClick={() => !task.isCompleted && setIsEditingTitle(true)}
              className={`text-sm sm:text-base font-medium truncate flex items-center gap-2 flex-1 min-w-0 ${task.isCompleted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'} ${!task.isCompleted ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-300' : ''} ${!task.title.trim() ? 'text-slate-400 dark:text-slate-500 italic' : ''} transition-colors duration-200`}
            >
              {task.isCompleted && <span className="text-emerald-500 flex-shrink-0">✓</span>}
              <span className="truncate">{task.title || 'Untitled Task'}</span>
            </h3>
          )}
          
          <div className="flex items-center gap-0.5 sm:gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 ml-2">
            <button
              onClick={handleExpandClick}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-md sm:rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-700/80 cursor-pointer transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 touch-manipulation"
            >
              <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            {!task.isCompleted && (
              <button
                onClick={onDelete}
                className="p-1 sm:p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-md sm:rounded-lg hover:bg-red-50/80 dark:hover:bg-red-900/30 cursor-pointer transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 touch-manipulation"
              >
                <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center py-1 sm:py-2">
          <TimerDisplay compact />
        </div>

        {timerState === 'finished' && performance && (
          <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl backdrop-blur-sm ${performance.isOvertime ? 'bg-red-50/80 dark:bg-red-900/30 border border-red-200/60 dark:border-red-500/40' : 'bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-500/40'}`}>
            <div className="flex items-center gap-2 text-xs">
              <span>⚡ Points:</span>
              <span className={`font-semibold ${performance.isOvertime ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {performance.isOvertime ? '-' : '+'}{formatTimeCompact(performance.difference)}
              </span>
            </div>
          </div>
        )}

        {!task.isCompleted && (
          <div className="space-y-2 sm:space-y-3">
            <ActionButtons />
          </div>
        )}
      </div>
    </div>
  );
};