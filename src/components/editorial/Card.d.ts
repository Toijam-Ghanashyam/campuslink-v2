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
