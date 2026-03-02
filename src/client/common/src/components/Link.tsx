import React from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom';
import { cn } from '../utility/utils';

interface LinkProps extends Omit<RouterLinkProps, 'className'> {
  variant?: 'primary' | 'secondary' | 'text';
  className?: string;
  children: React.ReactNode;
}

const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  text: 'text-primary hover:underline underline-offset-4',
};

export const Link = ({
  variant = 'text',
  className,
  children,
  ...props
}: LinkProps) => {
  return (
    <RouterLink
      className={cn(
        baseStyles,
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </RouterLink>
  );
};
