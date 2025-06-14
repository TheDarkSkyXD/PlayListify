// Placeholder for TaskItem.tsx
import React from 'react';

// Define a basic Task type for now, will be expanded based on shared types
interface Task {
  id: string;
  type?: string; // Made optional for now, or we can add a default like 'Download'
  title: string;
  status: string;
  progress?: number;
  thumbnail?: string;
  timestamp?: string;
}

interface TaskItemProps {
  task: Task;
}

import { Progress } from '@/frontend/components/ui/progress'; // Corrected import path based on components.json
import { Button } from '@/frontend/components/ui/button'; // Corrected import path based on components.json
import { XCircle, DownloadCloud, FileText } from 'lucide-react'; // Added icons

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const getIcon = () => {
    // Placeholder logic for task type icon
    if (task.type?.toLowerCase().includes('download')) {
      return <DownloadCloud className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  return (
    <li className="p-3 hover:bg-muted/50">
      <div className="flex items-center space-x-3">
        {task.thumbnail ? (
          <img src={task.thumbnail} alt={task.title} className="h-10 w-10 rounded object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
            {getIcon()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate" title={task.title}>
            {task.title}
          </p>
          <p className="text-xs text-muted-foreground">
            Status: {task.status} {task.timestamp ? `(${new Date(task.timestamp).toLocaleTimeString()})` : ''}
          </p>
        </div>
        {(task.status === 'downloading' || task.status === 'queued' || task.status === 'paused') && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => console.log('Cancel task:', task.id) /* TODO: Implement IPC call */}>
            <XCircle className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
      {(task.status === 'downloading' || task.progress !== undefined) && (
        <div className="mt-1.5">
          <Progress value={task.progress || 0} className="h-1.5" />
        </div>
      )}
    </li>
  );
};

export default TaskItem;