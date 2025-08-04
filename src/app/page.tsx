'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { Logo } from '@/components/Logo';
import { useUser } from '@/context/UserContext';

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.profileType === 'provider') {
        router.replace('/provider/dashboard');
      } else {
        router.replace('/home');
      }
    }
  }, [user, loading, router]);
  
  if(loading || user) {
     return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-pulse">
          <Logo className="text-4xl" iconClassName="h-12 w-12" />
        </div>
      </div>
     )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
