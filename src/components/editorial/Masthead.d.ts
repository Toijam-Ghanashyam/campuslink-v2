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
