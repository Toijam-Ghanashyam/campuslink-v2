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
