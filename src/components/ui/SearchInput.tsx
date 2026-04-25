import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './Input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Qidirish...', debounceMs = 300, className }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, onChange, value, debounceMs]);

  return (
    <div className={`relative ${className || ''}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        icon={Search}
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue('');
            onChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
