
'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { ProviderDesktopSidebar } from '@/components/provider/ProviderDesktopSidebar';
import { ProviderMobileBottomNav } from '@/components/provider/ProviderMobileBottomNav';
import { Header } from '@/components/Header';

export default function ProviderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
      return;
    }
    // If a personal user somehow lands on a provider page, redirect them
    if (!loading && user && user.profileType !== 'provider') {
      router.replace('/home');
    }
  }, [user, loading, router]);

  if (loading || !user || user.profileType !== 'provider') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-pulse">
          <Logo className="text-4xl" iconClassName="h-12 w-12" />
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="flex min-h-screen w-full bg-muted/40">
        <ProviderDesktopSidebar />
        <div className="flex flex-1 flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <Header />
          <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-8 pb-24 md:pb-8">
            {children}
          </main>
        </div>
        <ProviderMobileBottomNav />
      </div>
    </>
  );
}
