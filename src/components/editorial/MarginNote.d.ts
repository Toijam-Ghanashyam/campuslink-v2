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
