import React from 'react';
import { Input } from './Input';
import { Calendar } from 'lucide-react';

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <Input
        type="date"
        label={label}
        error={error}
        icon={Calendar}
        ref={ref}
        className={className}
        {...props}
      />
    );
  }
);
DatePicker.displayName = 'DatePicker';
