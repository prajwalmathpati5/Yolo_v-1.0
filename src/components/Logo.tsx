import { HandHelping } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, iconClassName }: { className?: string, iconClassName?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 text-2xl font-bold font-headline text-foreground', className)}>
      <HandHelping className={cn('h-8 w-8 text-primary', iconClassName)} />
      <span className="font-headline">YOLO Needs</span>
    </div>
  );
}
