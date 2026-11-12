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
