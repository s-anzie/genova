'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

export interface SidebarItem {
  title: string;
  href: string;
  icon: keyof typeof Icons;
  badge?: string | number;
}

interface SidebarProps {
  title: string;
  items: SidebarItem[];
  variant?: 'admin' | 'tutor' | 'student';
}

const variantStyles = {
  admin: {
    bg: 'bg-gray-900',
    activeBg: 'bg-gray-800',
    hoverBg: 'hover:bg-gray-800',
    text: 'text-gray-300',
    activeText: 'text-white',
    border: 'border-gray-800',
  },
  tutor: {
    bg: 'bg-primary',
    activeBg: 'bg-primary-600',
    hoverBg: 'hover:bg-primary-600',
    text: 'text-white/80',
    activeText: 'text-white',
    border: 'border-primary-600',
  },
  student: {
    bg: 'bg-success',
    activeBg: 'bg-success/90',
    hoverBg: 'hover:bg-success/90',
    text: 'text-white/80',
    activeText: 'text-white',
    border: 'border-success/80',
  },
};

export function Sidebar({ title, items, variant = 'admin' }: SidebarProps) {
  const pathname = usePathname();
  const styles = variantStyles[variant];
  const { user, logout } = useAuth();

  return (
    <aside className={cn('w-64 min-h-screen fixed left-0 top-0 z-40', styles.bg)}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = Icons[item.icon] as Icons.LucideIcon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all group',
                  isActive
                    ? cn(styles.activeBg, styles.activeText, 'font-semibold shadow-lg')
                    : cn(styles.text, styles.hoverBg, 'font-medium')
                )}
              >
                <Icon 
                  className={cn(
                    'w-5 h-5 transition-transform group-hover:scale-110',
                    isActive && 'scale-110'
                  )} 
                />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={cn('p-4 border-t', styles.border)}>
          <div className="flex items-center gap-3 px-4 py-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className={cn('text-xs truncate', styles.text)}>{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-white hover:bg-white/10"
            onClick={() => logout()}
          >
            <Icons.LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>
    </aside>
  );
}
