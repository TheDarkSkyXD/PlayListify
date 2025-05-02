import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface ImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportJson: (jsonData: string) => void;
  isLoading?: boolean;
}

export const ImportJsonModal: React.FC<ImportJsonModalProps> = ({
  isOpen,
  onClose,
  onImportJson,
  isLoading = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check if file is JSON
      if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
        setError('Please select a valid JSON file');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a JSON file to import');
      return;
    }
    
    try {
      const jsonText = await file.text();
      // Try to parse the JSON to validate it
      JSON.parse(jsonText);
      onImportJson(jsonText);
    } catch (err) {
      setError('Invalid JSON file. Please select a properly formatted playlist JSON file.');
    }
  };

  const handleClose = () => {
    setFile(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Import Playlist from JSON</h2>
          <button
            onClick={handleClose}
            className="text-secondary-foreground/70 hover:text-secondary-foreground"
            aria-label="Close modal"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="json-file" className="block text-sm font-medium">
              JSON File <span className="text-destructive">*</span>
            </label>
            <input
              id="json-file"
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className={`w-full rounded-md border ${
                error ? 'border-destructive' : 'border-border'
              } bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring`}
              disabled={isLoading}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <div className="mt-2 text-sm text-secondary-foreground/70">
            <p>Select a JSON file previously exported from PlayListify to import a playlist.</p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isLoading || !file}
            >
              {isLoading ? (
                <>
                  <svg 
                    className="mr-2 h-4 w-4 animate-spin" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Importing...
                </>
              ) : (
                'Import Playlist'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 