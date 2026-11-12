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
