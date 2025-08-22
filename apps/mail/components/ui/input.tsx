import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, error, ...props }, ref) => {
    // Ensure the value is always defined to prevent switching between controlled/uncontrolled
    const inputValue = value === undefined ? '' : value;

    return (
      <input
        type={type}
        className={cn(
          'border-input bg-background file:text-foreground placeholder:text-muted-foreground flex h-10 w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus:ring-0 ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          error && 'ring-2 ring-red-500 ring-offset-1',
          className,
        )}
        value={inputValue}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
