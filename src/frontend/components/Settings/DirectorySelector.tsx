import React from 'react';
import { Button } from '../ui/Button';
import { Folder } from 'lucide-react';
import { useIPC } from '../../hooks/useIPC';
import { useToast } from '../../hooks/useToast';

interface DirectorySelectorProps {
  label: string;
  value: string;
  onChange: (path: string) => void;
  description?: string;
  disabled?: boolean;
}

export const DirectorySelector: React.FC<DirectorySelectorProps> = ({
  label,
  value,
  onChange,
  description,
  disabled = false
}) => {
  const { toast } = useToast();
  
  // Hook for selecting directories
  const {
    loading: isSelectingDir,
    invoke: selectDirectory
  } = useIPC<void, { success: boolean; data: { path: string } | null }>(
    'download:select-directory'
  );
  
  // Handle directory selection
  const handleSelectDirectory = async () => {
    if (disabled || isSelectingDir) return;
    
    try {
      const result = await selectDirectory();
      if (result.success && result.data) {
        onChange(result.data.path);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to select directory'
      });
    }
  };
  
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          readOnly
          className="flex-1 px-3 py-2 bg-background border rounded-md text-sm"
          disabled={disabled}
        />
        <Button
          variant="outline"
          onClick={handleSelectDirectory}
          disabled={disabled || isSelectingDir}
        >
          <Folder className="mr-2 h-4 w-4" />
          Browse
        </Button>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      )}
    </div>
  );
}; 