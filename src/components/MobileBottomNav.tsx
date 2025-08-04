'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, HandHelping, History, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/capture', icon: HandHelping, label: 'Need' },
  { href: '/activity', icon: History, label: 'Activity' },
  { href: '/gamification', icon: Trophy, label: 'Missions' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-background sm:hidden">
      <div className={cn(
        "grid h-16",
        {
          "grid-cols-4": navItems.length === 4,
          "grid-cols-5": navItems.length === 5,
          "grid-cols-6": navItems.length === 6,
        }
      )}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-xs font-medium',
              (pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href)))
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
