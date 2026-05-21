'use client';

import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        return 'bg-error/10 text-error border-error/30';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'low':
        return 'bg-success/10 text-success border-success/30';
      default:
        return 'bg-background-secondary text-foreground-muted border-border';
    }
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return null;

    switch (category.toLowerCase()) {
      case 'work':
        return 'bg-accent-primary/10 text-accent-primary';
      case 'personal':
        return 'bg-accent-secondary/10 text-accent-secondary';
      case 'urgent':
        return 'bg-error/10 text-error';
      case 'follow-up':
        return 'bg-warning/10 text-warning';
      case 'idea':
        return 'bg-accent-secondary/10 text-accent-secondary';
      case 'research':
        return 'bg-accent-primary/10 text-accent-primary';
      case 'meeting':
        return 'bg-success/10 text-success';
      case 'bug':
        return 'bg-error/10 text-error';
      case 'feature':
        return 'bg-success/10 text-success';
      default:
        return 'bg-background-secondary text-foreground-secondary';
    }
  };

  const completedCount = completedTasks.size;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-accent-primary mb-2">Summary</h3>
        <p className="text-sm text-foreground-secondary leading-relaxed">{summary}</p>
      </div>

      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Tasks ({completedCount}/{tasks.length})
          </h3>
          <span className="text-xs font-semibold text-accent-primary uppercase tracking-wide">
            {completionPercentage}% complete
          </span>
        </div>
        <div className="h-2 bg-background-secondary rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500 ease-out"
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
            className={cn(
              "bg-background-tertiary/50 border rounded-xl p-5 cursor-pointer transition-default hover:shadow-md",
              completedTasks.has(index) ? "border-border opacity-70" : "border-border hover:border-accent-primary/40"
            )}
          >
            <div className="flex items-start gap-4">
              {/* Checkbox */}
              <div className="mt-0.5">
                {completedTasks.has(index) ? (
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-foreground-muted flex-shrink-0 hover:text-accent-primary transition-colors" />
                )}
              </div>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {/* Priority Badge */}
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border",
                      getPriorityColor(task.priority)
                    )}
                  >
                    {task.priority}
                  </span>

                  {/* Category Badge */}
                  {task.category && (
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded",
                        getCategoryColor(task.category)
                      )}
                    >
                      {task.category}
                    </span>
                  )}

                  {/* Time Estimate */}
                  {task.time_estimate && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-foreground-muted px-2 py-0.5 bg-background-secondary rounded border border-border">
                      {task.time_estimate}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p
                  className={cn(
                    "text-sm font-semibold mb-2 leading-relaxed transition-colors",
                    completedTasks.has(index)
                      ? "line-through text-foreground-muted"
                      : "text-foreground"
                  )}
                >
                  {task.description}
                </p>

                {/* Notes */}
                {task.notes && (
                  <p className="text-xs text-foreground-secondary italic leading-relaxed">{task.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-foreground-muted border border-dashed border-border rounded-xl bg-background/30">
          <p className="text-sm">No tasks extracted from the transcript.</p>
        </div>
      )}
    </div>
  );
}
