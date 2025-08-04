'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';

export function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="animate-fade-in opacity-0 [--animation-delay:500ms]">
        <Logo className="text-4xl" iconClassName="h-12 w-12" />
      </div>
    </main>
  );
}
