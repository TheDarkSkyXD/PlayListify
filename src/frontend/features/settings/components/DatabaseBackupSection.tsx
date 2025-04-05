import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { Database, Save, RotateCcw, HardDrive, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../../../components/ui/use-toast';

/**
 * Database Backup Section Component
 * Provides UI for backing up and restoring the database
 */
const DatabaseBackupSection: React.FC = () => {
  const { toast } = useToast();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [backups, setBackups] = useState<{ path: string; date: string; size: string }[]>([]);
  const [showBackups, setShowBackups] = useState(false);

  // Create a database backup
  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const result = await window.api.database.backup();
      
      if (result.success) {
        toast({
          title: 'Backup Created',
          description: `Database backed up to ${result.path}`,
          variant: 'default',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Backup Failed',
          description: result.error || 'Failed to create database backup',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Backup Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Restore a database backup
  const handleRestore = async (backupPath: string) => {
    try {
      setIsRestoring(true);
      
      // Confirm before restoring
      if (!window.confirm('Are you sure you want to restore this backup? This will replace your current database.')) {
        setIsRestoring(false);
        return;
      }
      
      const result = await window.api.database.restore(backupPath);
      
      if (result.success) {
        toast({
          title: 'Backup Restored',
          description: 'Database has been restored successfully. The application will restart.',
          variant: 'default',
          duration: 3000,
        });
        
        // Restart the application after a short delay
        setTimeout(() => {
          window.api.app.restart();
        }, 3000);
      } else {
        toast({
          title: 'Restore Failed',
          description: result.error || 'Failed to restore database backup',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Restore Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Optimize the database
  const handleOptimize = async () => {
    try {
      setIsOptimizing(true);
      const result = await window.api.database.optimize();
      
      if (result.success) {
        toast({
          title: 'Database Optimized',
          description: 'Database has been optimized successfully',
          variant: 'default',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Optimization Failed',
          description: result.error || 'Failed to optimize database',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Load database backups
  const loadBackups = async () => {
    try {
      const result = await window.api.database.listBackups();
      
      if (result.success) {
        setBackups(result.backups);
        setShowBackups(true);
      } else {
        toast({
          title: 'Failed to Load Backups',
          description: result.error || 'Failed to load database backups',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to Load Backups',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Database Management</h3>
        <p className="text-sm text-muted-foreground">
          Backup, restore, and optimize your database
        </p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5" />
            <h4 className="font-medium">Backup Database</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Create a backup of your database to prevent data loss
          </p>
          <Button 
            onClick={handleBackup} 
            disabled={isBackingUp}
            className="w-full"
          >
            {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-5 w-5" />
            <h4 className="font-medium">Optimize Database</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Optimize the database to improve performance
          </p>
          <Button 
            onClick={handleOptimize} 
            disabled={isOptimizing}
            className="w-full"
            variant="outline"
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize Database'}
            <RotateCcw className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      </div>
      
      <Separator />
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Database Backups</h4>
          <Button 
            onClick={loadBackups} 
            variant="outline" 
            size="sm"
          >
            Refresh
          </Button>
        </div>
        
        {showBackups ? (
          backups.length > 0 ? (
            <div className="space-y-2">
              {backups.map((backup, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{backup.date}</p>
                      <p className="text-xs text-muted-foreground">{backup.size}</p>
                    </div>
                    <Button 
                      onClick={() => handleRestore(backup.path)} 
                      disabled={isRestoring}
                      size="sm"
                      variant="outline"
                    >
                      {isRestoring ? 'Restoring...' : 'Restore'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 border rounded-md">
              <p className="text-sm text-muted-foreground">No backups found</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center p-4 border rounded-md">
            <Button 
              onClick={loadBackups} 
              variant="outline"
            >
              Load Backups
            </Button>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
          <div>
            <h5 className="font-medium text-yellow-800 dark:text-yellow-300">Important Note</h5>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Restoring a backup will replace your current database and restart the application.
              Make sure to create a backup of your current database before restoring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseBackupSection;
