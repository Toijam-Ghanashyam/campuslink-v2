import * as React from 'react';
export interface ToastContextType {
  toast: (message: string, tone?: string, duration?: number) => string;
  removeToast: (id: string) => void;
}
export declare function ToastProvider(props: { children: React.ReactNode }): React.JSX.Element;
export declare function useToast(): ToastContextType;
export default ToastProvider;
