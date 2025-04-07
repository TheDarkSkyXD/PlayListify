import { AppSettings } from '../../../../../shared/types/appTypes';

/**
 * Props for the settings components
 */
export interface SettingsComponentProps {
  settings: Partial<AppSettings>;
  isSaving: boolean;
  error: string | null;
  saveSuccess: boolean;
  onSettingsChange: (name: string, value: any) => void;
  onSelectFolder: (setting: string) => Promise<void>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Return type for the useSettings hook
 */
export interface UseSettingsReturn {
  settings: Partial<AppSettings>;
  isLoading: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  error: string | null;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSelectFolder: (setting: string) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}
