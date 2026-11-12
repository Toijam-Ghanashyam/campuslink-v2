
import * as React from 'react';
export interface ThemeContextType {
  theme: string;
  toggle: (e?: any) => Promise<void>;
}
export declare function ThemeProvider(props: { children: React.ReactNode }): React.JSX.Element;
export declare function useTheme(): ThemeContextType;
export default ThemeProvider;
