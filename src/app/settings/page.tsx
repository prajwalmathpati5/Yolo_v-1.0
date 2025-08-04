'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUser } from '@/context/UserContext';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user } = useUser();
  const router = useRouter();

  if (!user) {
    return null; // or a loading state
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications from YOLO Needs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <Switch id="email-notifications" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications">Push Notifications</Label>
            <Switch id="push-notifications" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Review your privacy settings and our policies.</CardDescription>
        </CardHeader>
        <CardContent>
            <a href="#" className="text-sm text-primary underline">View Privacy Policy</a>
        </CardContent>
      </Card>
    </div>
  );
}
