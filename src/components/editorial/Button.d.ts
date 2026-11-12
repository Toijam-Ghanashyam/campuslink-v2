import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'accent' | string;
  size?: 'sm' | 'md' | 'lg' | string;
  icon?: any;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export default Button;

