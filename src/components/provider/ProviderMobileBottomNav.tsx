'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, Settings, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/provider/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/provider/gamification', icon: Trophy, label: 'Missions' },
  { href: '/provider/profile', icon: User, label: 'Profile' },
  { href: '/provider/settings', icon: Settings, label: 'Settings' },
];

export function ProviderMobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-background sm:hidden">
      <div className={cn("grid h-16", `grid-cols-${navItems.length}`)}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-xs font-medium',
              (pathname.startsWith(item.href))
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            <item.icon className="h-6 w-6" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
