import React, { useState, useEffect } from 'react';
import { DownloadItem } from '../../../shared/types'; // Using DownloadItem as Task type
import TaskItem from './TaskItem';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronDown, Trash2, XCircle } from 'lucide-react'; // XCircle for cancel

const ActivityCenter: React.FC = () => {
  const [tasks, setTasks] = useState<DownloadItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // TODO: useEffect for IPC listeners (task:update)

  const activeTasksCount = tasks.filter(task => task.status === 'downloading' || task.status === 'queued' || task.status === 'paused').length;

  if (!isVisible) {
    return null; // Or a button to re-open
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-50 bg-card text-card-foreground">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
        <CardTitle className="text-sm font-semibold">
          Activity {activeTasksCount > 0 ? `(${activeTasksCount})` : ''}
        </CardTitle>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
            // TODO: Implement clear all completed/failed tasks
            console.log("Clear all clicked");
          }}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(!isMinimized)}>
            <ChevronDown className={`h-4 w-4 transform transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
          </Button>
          {/* Optional: Close button to hide the widget entirely */}
          {/* <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsVisible(false)}>
            <X className="h-4 w-4" />
          </Button> */}
        </div>
      </CardHeader>
      {!isMinimized && (
        <CardContent className="p-0 max-h-60 overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">No active tasks.</p>
          ) : (
            <ul className="divide-y">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ActivityCenter;