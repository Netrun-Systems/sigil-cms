import { AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ValidationErrorProps {
  error?: string;
  className?: string;
}

export function ValidationError({ error, className }: ValidationErrorProps) {
  if (!error) return null;
  
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-red-600 mt-1",
      className
    )}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}

export default ValidationError;