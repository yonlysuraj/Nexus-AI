'use client';

import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface Task {
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  category?: string;
  time_estimate?: string;
  notes?: string;
}

interface TaskListProps {
  tasks: Task[];
  summary: string;
}

export function TaskList({ tasks, summary }: TaskListProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  const toggleTask = (index: number) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedTasks(newCompleted);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      case 'low':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
    }
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return null;

    switch (category.toLowerCase()) {
      case 'work':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'personal':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'follow-up':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'idea':
        return 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200';
      case 'research':
        return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200';
      case 'meeting':
        return 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200';
      case 'bug':
        return 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200';
      case 'feature':
        return 'bg-lime-100 dark:bg-lime-900 text-lime-800 dark:text-lime-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const completedCount = completedTasks.size;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Summary</h3>
        <p className="text-sm text-blue-800 dark:text-blue-300">{summary}</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tasks ({completedCount}/{tasks.length})
          </h3>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {completionPercentage}% complete
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div
            key={index}
            onClick={() => toggleTask(index)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <div className="mt-1">
                {completedTasks.has(index) ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                )}
              </div>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2 flex-wrap">
                  {/* Priority Badge */}
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded border ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>

                  {/* Category Badge */}
                  {task.category && (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${getCategoryColor(
                        task.category
                      )}`}
                    >
                      {task.category}
                    </span>
                  )}

                  {/* Time Estimate */}
                  {task.time_estimate && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {task.time_estimate}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p
                  className={`text-base font-medium mb-2 ${
                    completedTasks.has(index)
                      ? 'line-through text-gray-500 dark:text-gray-500'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {task.description}
                </p>

                {/* Notes */}
                {task.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">{task.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No tasks extracted from the transcript.</p>
        </div>
      )}
    </div>
  );
}
