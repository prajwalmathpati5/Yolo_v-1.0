
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, DollarSign, Award, Star, ShieldCheck } from "lucide-react";

// Mock data, this would typically come from your backend
const providerStats = {
  completedJobs: 28,
  totalRevenue: 2500,
  rank: "Bronze",
  points: 72,
  pointsToNextRank: 100,
  badges: [
    { name: "Top Performer", icon: Award, description: "Completed 25+ jobs" },
    { name: "Quick Responder", icon: ShieldCheck, description: "Maintained a high response rate" },
    { name: "5-Star Service", icon: Star, description: "Received 10+ five-star ratings" },
  ],
};

const rankColors = {
    Bronze: "text-amber-700",
    Silver: "text-gray-400",
    Gold: "text-yellow-500",
    Platinum: "text-cyan-400"
}

export default function ProviderGamificationPage() {
  const progressPercentage = (providerStats.points / providerStats.pointsToNextRank) * 100;

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
       <div className="grid gap-4 sm:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{providerStats.completedJobs}</div>
                    <p className="text-xs text-muted-foreground">All-time completed requests</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{providerStats.totalRevenue}</div>
                    <p className="text-xs text-muted-foreground">From completed jobs this month</p>
                </CardContent>
            </Card>
       </div>
       
       <Card>
            <CardHeader>
                <CardTitle>Current Rank</CardTitle>
                <CardDescription>Complete more jobs and get good ratings to rank up!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className={`text-2xl font-bold ${rankColors.Bronze}`}>{providerStats.rank} Tier</h3>
                    <p className="text-sm text-muted-foreground">{providerStats.points} / {providerStats.pointsToNextRank} Points</p>
                </div>
                <Progress value={progressPercentage} aria-label={`${progressPercentage}% to next rank`} />
                <p className="text-xs text-center text-muted-foreground">You need {providerStats.pointsToNextRank - providerStats.points} more points to reach Silver rank.</p>
            </CardContent>
       </Card>

       <Card>
            <CardHeader>
                <CardTitle>Earned Badges</CardTitle>
                <CardDescription>Special achievements unlocked by you.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {providerStats.badges.map((badge) => (
                    <div key={badge.name} className="flex items-start gap-4 rounded-lg border p-4">
                        <badge.icon className="h-8 w-8 text-primary mt-1" />
                        <div>
                            <p className="font-semibold">{badge.name}</p>
                            <p className="text-sm text-muted-foreground">{badge.description}</p>
                        </div>
                    </div>
                ))}
                 <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-muted-foreground">
                    <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">?</div>
                    <p className="font-semibold">More badges coming soon</p>
                </div>
            </CardContent>
       </Card>
    </div>
  );
}
