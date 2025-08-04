
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { Camera, Settings, HandHelping, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import type { UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, updateUserProfile, loading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [photoUrlPreview, setPhotoUrlPreview] = useState('');
  const [category, setCategory] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhotoUrlPreview(user.photoUrl ?? '');
      setCategory(user.category || '');
      setPhoneNumber(user.phone_number || '');
      setAvgCost(user.avg_cost ? String(user.avg_cost) : '');
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const profileData: Partial<UserProfile> = {
        name,
      };

      if (user?.profileType === 'provider') {
        profileData.category = category;
        profileData.phone_number = phoneNumber;
        profileData.avg_cost = avgCost ? Number(avgCost) : 0;
      }
      
      await updateUserProfile(profileData);
      toast({
        title: 'Profile Updated',
        description: 'Your information has been successfully updated.',
      });

    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not save your profile changes.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const localPhotoUrl = URL.createObjectURL(file);
      setPhotoUrlPreview(localPhotoUrl);
      toast({
        title: 'Photo Preview Updated',
        description: 'Your profile photo preview is temporary and will not be saved.',
      });
    }
  };

  if (loading || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your personal and professional information here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your personal and professional information here.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative mx-auto w-fit">
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoUrlPreview} alt={name} data-ai-hint="profile picture" />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Input id="photo-upload" type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
              <Button size="icon" className="absolute bottom-0 right-0 rounded-full" asChild>
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">Change photo</span>
                </Label>
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={user.email} placeholder="Your email" disabled />
            </div>

            <div className="space-y-2">
              <Label>Profile Type</Label>
              <Input value={user.profileType === 'provider' ? 'Service Provider' : 'Personal User'} disabled />
            </div>

            {user.profileType === 'provider' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="category">Service Category</Label>
                   <Input 
                      id="category" 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)} 
                      placeholder="e.g., Plumbing, Graphic Design"
                    />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input id="phone_number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g., 5551234567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avg_cost">Average Cost (₹)</Label>
                  <Input
                    id="avg_cost"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={avgCost}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*$/.test(value)) {
                         setAvgCost(value);
                      }
                    }}
                    placeholder="e.g., 5000"
                  />
                </div>
              </>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

       {user.profileType === 'provider' && (
         <Card>
            <CardHeader>
                <CardTitle>Provider Dashboard</CardTitle>
                <CardDescription>View and manage your service requests.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/provider/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Go to Dashboard
                    </Link>
                </Button>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your account settings, notifications, and privacy.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={user.profileType === 'provider' ? '/provider/settings' : '/settings'}>
              <Settings className="mr-2 h-4 w-4" />
              Go to Settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
