import React from 'react';

export function PageTransition({ children, className = '', ...props }) {
  return (
    <div
      className={`animate-in fade-in duration-300 ease-out ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default PageTransition;

