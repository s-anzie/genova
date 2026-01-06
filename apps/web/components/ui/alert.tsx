import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: 'text-blue-600',
    Icon: Info,
  },
  success: {
    container: 'bg-success/10 border-success/20 text-success',
    icon: 'text-success',
    Icon: CheckCircle,
  },
  warning: {
    container: 'bg-warning/10 border-warning/20 text-warning',
    icon: 'text-warning',
    Icon: AlertCircle,
  },
  error: {
    container: 'bg-error/10 border-error/20 text-error',
    icon: 'text-error',
    Icon: XCircle,
  },
};

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <div className={cn('border rounded-lg p-4', styles.container, className)}>
      <div className="flex gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', styles.icon)} />
        <div className="flex-1">
          {title && <h5 className="font-semibold mb-1">{title}</h5>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
