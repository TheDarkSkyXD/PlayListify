export interface IpcResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
} 