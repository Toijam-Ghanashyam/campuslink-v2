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
