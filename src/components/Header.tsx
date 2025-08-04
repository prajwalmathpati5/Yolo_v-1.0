'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/context/UserContext'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Skeleton } from './ui/skeleton'

const getTitle = (pathname: string) => {
  if (pathname.startsWith('/home')) return 'Home'
  if (pathname.startsWith('/capture')) return 'Capture Need'
  if (pathname.startsWith('/activity')) return 'My Activity'
  if (pathname.startsWith('/profile')) return 'My Profile'
  if (pathname.startsWith('/gamification')) return 'Missions'
  if (pathname.startsWith('/settings')) return 'Settings'
  // Provider routes
  if (pathname.startsWith('/provider/dashboard')) return 'Provider Dashboard'
  if (pathname.startsWith('/provider/gamification')) return 'Provider Missions'
  if (pathname.startsWith('/provider/profile')) return 'My Profile'
  if (pathname.startsWith('/provider/settings')) return 'Settings'
  
  return 'Dashboard'
}

export function Header() {
  const { user } = useUser()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const profilePath = user?.profileType === 'provider' ? '/provider/profile' : '/profile';
  const settingsPath = user?.profileType === 'provider' ? '/provider/settings' : '/settings';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <div className="flex-1">
        <h1 className="text-xl font-semibold md:text-2xl font-headline">
          {getTitle(pathname)}
        </h1>
       </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            { user ? (
              <Avatar>
                <AvatarImage src={user.photoUrl} alt={user.name} data-ai-hint="profile picture"/>
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : (
              <Skeleton className="h-full w-full rounded-full" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.name || 'My Account'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={profilePath}>Profile</Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
            <Link href={settingsPath}>Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
