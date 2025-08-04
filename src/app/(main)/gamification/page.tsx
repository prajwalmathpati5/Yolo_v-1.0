import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function GamificationPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          YOLO Warrior
        </CardTitle>
        <CardDescription>
          Complete missions, earn rewards, and climb the leaderboard!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Gamification features are coming soon.</p>
          <p className="text-sm text-muted-foreground">Get ready for missions, leaderboards, and more!</p>
        </div>
      </CardContent>
    </Card>
  );
}
