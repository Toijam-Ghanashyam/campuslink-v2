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
