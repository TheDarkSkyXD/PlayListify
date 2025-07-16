import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Database,
  Loader2,
} from 'lucide-react';
import React, { useState } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';

interface MigrationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

interface SettingsMigrationProps {
  currentVersion: string;
  targetVersion: string;
  onMigrate: () => Promise<void>;
  onSkip: () => void;
}

export const SettingsMigration: React.FC<SettingsMigrationProps> = ({
  currentVersion,
  targetVersion,
  onMigrate,
  onSkip,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<MigrationStep[]>([
    {
      id: 'backup',
      name: 'Backup Current Settings',
      description: 'Create a backup of your current settings',
      status: 'pending',
    },
    {
      id: 'validate',
      name: 'Validate Settings',
      description: 'Check current settings for compatibility',
      status: 'pending',
    },
    {
      id: 'migrate',
      name: 'Apply Migration',
      description: 'Update settings to new format',
      status: 'pending',
    },
    {
      id: 'verify',
      name: 'Verify Migration',
      description: 'Ensure all settings are properly migrated',
      status: 'pending',
    },
  ]);

  const completedSteps = steps.filter(
    step => step.status === 'completed',
  ).length;
  const progress = (completedSteps / steps.length) * 100;

  const handleMigrate = async () => {
    setIsRunning(true);

    try {
      // Simulate migration steps
      for (let i = 0; i < steps.length; i++) {
        setSteps(prev =>
          prev.map((step, index) =>
            index === i ? { ...step, status: 'running' } : step,
          ),
        );

        // Simulate step execution time
        await new Promise(resolve => setTimeout(resolve, 1000));

        setSteps(prev =>
          prev.map((step, index) =>
            index === i ? { ...step, status: 'completed' } : step,
          ),
        );
      }

      // Call the actual migration function
      await onMigrate();
    } catch (error) {
      const currentStepIndex = steps.findIndex(
        step => step.status === 'running',
      );
      setSteps(prev =>
        prev.map((step, index) =>
          index === currentStepIndex
            ? { ...step, status: 'failed', error: (error as Error).message }
            : step,
        ),
      );
    } finally {
      setIsRunning(false);
    }
  };

  const hasFailedSteps = steps.some(step => step.status === 'failed');
  const isCompleted = steps.every(step => step.status === 'completed');

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center space-x-2'>
          <Database className='h-5 w-5 text-primary' />
          <CardTitle>Settings Migration Required</CardTitle>
        </div>
        <CardDescription>
          Your settings need to be updated to work with the new version
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Version Info */}
        <div className='flex items-center justify-center space-x-4 rounded-lg bg-blue-50 p-4'>
          <div className='text-center'>
            <div className='text-sm text-muted-foreground'>Current Version</div>
            <div className='font-mono font-medium'>{currentVersion}</div>
          </div>
          <ArrowRight className='h-5 w-5 text-muted-foreground' />
          <div className='text-center'>
            <div className='text-sm text-muted-foreground'>Target Version</div>
            <div className='font-mono font-medium'>{targetVersion}</div>
          </div>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Migration Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className='h-2' />
          </div>
        )}

        {/* Migration Steps */}
        <div className='space-y-3'>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className='flex items-center space-x-3 rounded-lg border p-3'
            >
              <div className='flex-shrink-0'>
                {step.status === 'pending' && (
                  <div className='h-5 w-5 rounded-full border-2 border-gray-300' />
                )}
                {step.status === 'running' && (
                  <Loader2 className='h-5 w-5 animate-spin text-blue-600' />
                )}
                {step.status === 'completed' && (
                  <CheckCircle className='h-5 w-5 text-green-600' />
                )}
                {step.status === 'failed' && (
                  <AlertTriangle className='h-5 w-5 text-red-600' />
                )}
              </div>
              <div className='flex-1'>
                <div className='font-medium'>{step.name}</div>
                <div className='text-sm text-muted-foreground'>
                  {step.description}
                </div>
                {step.error && (
                  <div className='mt-1 text-sm text-red-600'>{step.error}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Status Messages */}
        {hasFailedSteps && (
          <Alert className='border-red-200 bg-red-50'>
            <AlertTriangle className='h-4 w-4 text-red-600' />
            <AlertDescription className='text-red-800'>
              Migration failed. Please check the errors above and try again.
            </AlertDescription>
          </Alert>
        )}

        {isCompleted && (
          <Alert className='border-green-200 bg-green-50'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <AlertDescription className='text-green-800'>
              Settings migration completed successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className='flex justify-between'>
          <Button variant='outline' onClick={onSkip} disabled={isRunning}>
            Skip Migration
          </Button>
          <Button onClick={handleMigrate} disabled={isRunning || isCompleted}>
            {isRunning ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Migrating...
              </>
            ) : isCompleted ? (
              'Migration Complete'
            ) : (
              'Start Migration'
            )}
          </Button>
        </div>

        {/* Warning */}
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <strong>Important:</strong> A backup of your current settings will
            be created before migration. You can restore from this backup if
            needed.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
