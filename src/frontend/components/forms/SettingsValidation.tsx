import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SettingsValidationResult } from '@/shared/types/settings-types';
import { AlertTriangle, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import React from 'react';
import { Alert, AlertDescription } from '../ui/alert';

interface SettingsValidationProps {
  validation: SettingsValidationResult;
  onValidate: () => void;
  onSanitize: () => void;
  isValidating?: boolean;
  isSanitizing?: boolean;
}

export const SettingsValidation: React.FC<SettingsValidationProps> = ({
  validation,
  onValidate,
  onSanitize,
  isValidating = false,
  isSanitizing = false,
}) => {
  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center space-x-2'>
          <Settings className='h-5 w-5 text-primary' />
          <CardTitle>Settings Validation</CardTitle>
        </div>
        <CardDescription>
          Check and fix any issues with your current settings
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Validation Status */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            {validation.isValid ? (
              <CheckCircle className='h-5 w-5 text-green-600' />
            ) : (
              <AlertTriangle className='h-5 w-5 text-red-600' />
            )}
            <span className='font-medium'>
              {validation.isValid
                ? 'Settings are valid'
                : 'Settings have issues'}
            </span>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={onValidate}
            disabled={isValidating}
          >
            {isValidating ? (
              <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='mr-2 h-4 w-4' />
            )}
            Validate
          </Button>
        </div>

        {/* Errors */}
        {hasErrors && (
          <Alert className='border-red-200 bg-red-50'>
            <AlertTriangle className='h-4 w-4 text-red-600' />
            <AlertDescription className='text-red-800'>
              <div className='mb-2 font-medium'>Errors found:</div>
              <ul className='list-inside list-disc space-y-1'>
                {validation.errors.map((error, index) => (
                  <li key={index} className='text-sm'>
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <Alert className='border-yellow-200 bg-yellow-50'>
            <AlertTriangle className='h-4 w-4 text-yellow-600' />
            <AlertDescription className='text-yellow-800'>
              <div className='mb-2 font-medium'>Warnings:</div>
              <ul className='list-inside list-disc space-y-1'>
                {validation.warnings.map((warning, index) => (
                  <li key={index} className='text-sm'>
                    {warning}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-fix option */}
        {(hasErrors || hasWarnings) && (
          <div className='flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <div>
              <div className='font-medium text-blue-900'>Auto-fix Issues</div>
              <div className='text-sm text-blue-700'>
                Automatically correct invalid settings with safe defaults
              </div>
            </div>
            <Button onClick={onSanitize} disabled={isSanitizing} size='sm'>
              {isSanitizing ? (
                <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Settings className='mr-2 h-4 w-4' />
              )}
              Fix Issues
            </Button>
          </div>
        )}

        {/* Success state */}
        {validation.isValid && !hasWarnings && (
          <Alert className='border-green-200 bg-green-50'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <AlertDescription className='text-green-800'>
              All settings are valid and properly configured.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
