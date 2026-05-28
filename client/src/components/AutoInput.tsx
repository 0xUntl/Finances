import { useEffect, useRef, useState } from 'react';

type Props = {
  value: string | number | null | undefined;
  onSave: (v: string) => void | Promise<void>;
  type?: 'text' | 'number';
  placeholder?: string;
  className?: string;
  step?: string;
  min?: string;
  max?: string;
};

export function AutoInput({ value, onSave, type = 'text', placeholder, className, step, min, max }: Props) {
  const [val, setVal] = useState<string>(value == null ? '' : String(value));
  const skip = useRef(true);

  useEffect(() => {
    setVal(value == null ? '' : String(value));
    skip.current = true;
  }, [value]);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const id = setTimeout(() => {
      onSave(val);
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [val]);

  return (
    <input
      type={type}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onSave(val)}
      placeholder={placeholder}
      className={className ?? 'input-flat'}
      step={step}
      min={min}
      max={max}
    />
  );
}
