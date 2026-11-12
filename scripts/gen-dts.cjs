const fs = require('fs');
const path = require('path');

const editorialDir = path.join(__dirname, '../src/components/editorial');
const themeDir = path.join(__dirname, '../src/theme');
const fxDir = path.join(__dirname, '../src/fx');

// ThemeProvider.d.ts
fs.writeFileSync(path.join(themeDir, 'ThemeProvider.d.ts'), `
import * as React from 'react';
export interface ThemeContextType {
  theme: string;
  toggle: (e?: any) => Promise<void>;
}
export declare function ThemeProvider(props: { children: React.ReactNode }): React.JSX.Element;
export declare function useTheme(): ThemeContextType;
export default ThemeProvider;
`);

// useThemeTokens.d.ts
fs.writeFileSync(path.join(themeDir, 'useThemeTokens.d.ts'), `
export declare function useThemeTokens(): any;
export declare function sceneColors(t: any): any;
`);

// fx d.ts files
fs.writeFileSync(path.join(fxDir, 'useFx.d.ts'), `
export declare function useFx(): { mode: string; setMode: (m: string) => void; use3d: boolean };
export declare function setFxMode(mode: string): void;
export declare function detectWebGL(): boolean;
`);

fs.writeFileSync(path.join(fxDir, 'useInView.d.ts'), `
export declare function useInView(ref: any, margin?: string): boolean;
`);

fs.writeFileSync(path.join(fxDir, 'useTilt.d.ts'), `
export declare function useTilt(opts?: any): { ref: any; onPointerMove: (e: any) => void; onPointerLeave: () => void };
export declare function useMagnetic(opts?: any): { ref: any; onPointerMove: (e: any) => void; onPointerLeave: () => void };
`);

// Specific editorial components
const specificTypes = {
  Card: `
import * as React from 'react';
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
  object?: boolean;
  onClick?: any;
  [key: string]: any;
}
export declare function Card(props: CardProps): React.JSX.Element;
export default Card;
`,
  Stamp: `
import * as React from 'react';
export interface StampProps {
  tone?: 'default' | 'ochre' | 'jade' | 'brick' | 'ink' | string;
  children?: React.ReactNode;
  className?: string;
  rotate?: number;
  animate?: boolean;
  [key: string]: any;
}
export declare function Stamp(props: StampProps): React.JSX.Element;
export default Stamp;
`,
  Masthead: `
import * as React from 'react';
export interface MastheadProps {
  context?: string;
  title?: string;
  lede?: string;
  action?: React.ReactNode;
  className?: string;
  strong?: boolean;
  [key: string]: any;
}
export declare function Masthead(props: MastheadProps): React.JSX.Element;
export default Masthead;
`,
  StatStrip: `
import * as React from 'react';
export interface StatItem {
  label: string;
  value: any;
  hint?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  [key: string]: any;
}
export interface StatStripProps {
  items: StatItem[];
  className?: string;
  [key: string]: any;
}
export declare function StatStrip(props: StatStripProps): React.JSX.Element;
export default StatStrip;
`,
  Tabs: `
import * as React from 'react';
export interface TabItem {
  id: string;
  label: string;
  count?: number;
  [key: string]: any;
}
export interface TabsProps {
  tabs: TabItem[];
  value?: string;
  onChange?: (id: any) => void;
  className?: string;
  [key: string]: any;
}
export declare function Tabs(props: TabsProps): React.JSX.Element;
export default Tabs;
`,
  Callout: `
import * as React from 'react';
export interface CalloutProps {
  tone?: 'ochre' | 'jade' | 'brick' | 'ink' | string;
  title?: string;
  icon?: any;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function Callout(props: CalloutProps): React.JSX.Element;
export default Callout;
`,
  MarginNote: `
import * as React from 'react';
export interface MarginNoteProps {
  label?: string;
  children?: React.ReactNode;
  className?: string;
  strong?: boolean;
  [key: string]: any;
}
export declare function MarginNote(props: MarginNoteProps): React.JSX.Element;
export default MarginNote;
`,
  Drawer: `
import * as React from 'react';
export interface DrawerProps {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  width?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  [key: string]: any;
}
export declare function Drawer(props: DrawerProps): React.JSX.Element | null;
export default Drawer;
`,
  Toast: `
import * as React from 'react';
export interface ToastContextType {
  toast: (message: string, tone?: string, duration?: number) => string;
  removeToast: (id: string) => void;
}
export declare function ToastProvider(props: { children: React.ReactNode }): React.JSX.Element;
export declare function useToast(): ToastContextType;
export default ToastProvider;
`,
  PageTransition: `
import * as React from 'react';
export interface PageTransitionProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function PageTransition(props: PageTransitionProps): React.JSX.Element;
export default PageTransition;
`,
  ThemeToggle: `
import * as React from 'react';
export declare function ThemeToggle(props: { className?: string }): React.JSX.Element;
export default ThemeToggle;
`,
  Backdrop: `
import * as React from 'react';
export declare function Backdrop(props?: { className?: string }): React.JSX.Element;
export default Backdrop;
`
};

for (const [name, content] of Object.entries(specificTypes)) {
  fs.writeFileSync(path.join(editorialDir, `${name}.d.ts`), content.trim() + '\n');
}

// Generate generic .d.ts for any other .jsx file in editorialDir
const files = fs.readdirSync(editorialDir);
for (const file of files) {
  if (file.endsWith('.jsx')) {
    const baseName = file.replace('.jsx', '');
    const dtsPath = path.join(editorialDir, `${baseName}.d.ts`);
    if (!fs.existsSync(dtsPath)) {
      fs.writeFileSync(dtsPath, `
import * as React from 'react';
export declare const ${baseName}: React.ComponentType<any>;
export default ${baseName};
`.trim() + '\n');
    }
  }
}

console.log('All .d.ts files generated successfully');

