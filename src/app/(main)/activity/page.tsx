'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Need } from '@/lib/types'
import { Star, CreditCard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const activityNeedsData: Need[] = [
  {
    id: '6',
    user: { name: 'You', avatar: 'https://placehold.co/40x40.png' },
    description: 'Help with assembling IKEA furniture.',
    status: 'Completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    provider: { name: 'John Helper', avatar: 'https://placehold.co/40x40.png' },
    cost: 50,
    isPaid: false,
  },
  {
    id: '7',
    user: { name: 'You', avatar: 'https://placehold.co/40x40.png' },
    description: 'Dog walking for a week.',
    status: 'Completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    provider: { name: 'Jane Walker', avatar: 'https://placehold.co/40x40.png' },
    cost: 100,
    isPaid: true,
  },
  {
    id: '8',
    user: { name: 'You', avatar: 'https://placehold.co/40x40.png' },
    description: 'Tutoring for a calculus exam.',
    status: 'Completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    provider: { name: 'Prof. Einstein', avatar: 'https://placehold.co/40x40.png' },
    cost: 75,
    isPaid: true,
    rating: 5,
    feedback: 'Amazing tutor! Helped me ace my exam.',
  },
  {
    id: '2',
    user: { name: 'You', avatar: 'https://placehold.co/40x40.png' },
    description: 'Looking for a study partner for my chemistry final.',
    status: 'Approved',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

const StarRating = ({ rating, setRating, disabled = false }: { rating: number, setRating?: (rating: number) => void, disabled?: boolean }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
                'h-5 w-5',
                rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50',
                !disabled && 'cursor-pointer'
            )}
            onClick={() => !disabled && setRating?.(star)}
          />
        ))}
      </div>
    )
}

export default function ActivityPage() {
    const { toast } = useToast()
    const [activities, setActivities] = useState<Need[]>(activityNeedsData)
    const [paymentNeed, setPaymentNeed] = useState<Need | null>(null)
    const [ratingNeed, setRatingNeed] = useState<Need | null>(null)
    const [currentRating, setCurrentRating] = useState(0)
    const [currentFeedback, setCurrentFeedback] = useState('')

    const handlePayment = () => {
        if (!paymentNeed) return;
        setActivities(activities.map(n => n.id === paymentNeed.id ? { ...n, isPaid: true } : n))
        toast({
            title: 'Payment Successful!',
            description: `Paid ₹${paymentNeed.cost} for need #${paymentNeed.id}.`,
        })
        setPaymentNeed(null)
    }

    const handleRating = () => {
        if (!ratingNeed) return;
        if (currentRating === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a star rating.'})
            return
        }
        setActivities(activities.map(n => n.id === ratingNeed.id ? { ...n, rating: currentRating, feedback: currentFeedback } : n))
        toast({
            title: 'Feedback Submitted!',
            description: 'Thank you for your feedback.',
        })
        setRatingNeed(null)
        setCurrentRating(0)
        setCurrentFeedback('')
    }
    
    const activeNeeds = activities.filter(n => n.status !== 'Completed');
    const completedNeeds = activities.filter(n => n.status === 'Completed');

    return (
        <div className="space-y-6">
            {/* Payment Dialog */}
            <Dialog open={!!paymentNeed} onOpenChange={(isOpen) => !isOpen && setPaymentNeed(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pay for Service</DialogTitle>
                        <DialogDescription>
                            Complete your payment for "{paymentNeed?.description}". Amount: ₹{paymentNeed?.cost}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                           <Label htmlFor="card-number">Card Number</Label>
                           <Input id="card-number" placeholder="**** **** **** 1234" defaultValue="4242 4242 4242 4242" />
                        </div>
                         <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expiry">Expiry</Label>
                                <Input id="expiry" placeholder="MM/YY" defaultValue="12/28" />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="cvc">CVC</Label>
                                <Input id="cvc" placeholder="123" defaultValue="123" />
                            </div>
                         </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentNeed(null)}>Cancel</Button>
                        <Button onClick={handlePayment}>Confirm Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rating Dialog */}
            <Dialog open={!!ratingNeed} onOpenChange={(isOpen) => !isOpen && setRatingNeed(null)}>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rate "{ratingNeed?.provider?.name}"</DialogTitle>
                        <DialogDescription>
                            Share your experience for the service: "{ratingNeed?.description}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Your Rating</Label>
                            <StarRating rating={currentRating} setRating={setCurrentRating} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="feedback">Your Feedback (optional)</Label>
                            <Textarea id="feedback" value={currentFeedback} onChange={(e) => setCurrentFeedback(e.target.value)} placeholder="Tell us about your experience..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRatingNeed(null)}>Cancel</Button>
                        <Button onClick={handleRating}>Submit Feedback</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div>
                <h2 className="text-xl font-semibold mb-4">Completed Needs</h2>
                {completedNeeds.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {completedNeeds.map((need) => (
                            <Card key={need.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="truncate">{need.description}</CardTitle>
                                    <CardDescription>Completed on {format(need.timestamp, 'MM/dd/yyyy')}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <div className="flex justify-between items-center">
                                       <Badge variant={'default'} className={'bg-green-500/20 text-green-700 border-green-500/20'}>{need.status}</Badge>
                                       {need.cost && <p className="font-semibold text-lg">₹{need.cost}</p>}
                                    </div>
                                    {need.provider && (
                                        <div className="flex items-center gap-3 pt-2">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={need.provider.avatar} alt={need.provider.name} data-ai-hint="profile person" />
                                                <AvatarFallback>{need.provider.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">Provided by</p>
                                                <p className="text-sm text-muted-foreground">{need.provider.name}</p>
                                            </div>
                                        </div>
                                    )}
                                    {need.rating ? (
                                        <div className="pt-2">
                                            <p className="text-sm font-medium mb-1">Your Rating</p>
                                            <div className="flex items-start gap-3">
                                               <StarRating rating={need.rating} disabled />
                                               {need.feedback && <p className="text-sm text-muted-foreground italic">"{need.feedback}"</p>}
                                            </div>
                                        </div>
                                    ) : <div className="h-10"></div>}
                                </CardContent>
                                <CardFooter>
                                    {need.cost && !need.isPaid ? (
                                        <Button className="w-full" onClick={() => setPaymentNeed(need)}>
                                            <CreditCard className="mr-2 h-4 w-4"/> Pay Now
                                        </Button>
                                    ) : (need.isPaid || !need.cost) && !need.rating ? (
                                        <Button variant="outline" className="w-full" onClick={() => setRatingNeed(need)}>
                                            <Star className="mr-2 h-4 w-4"/> Rate Service
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" disabled className="w-full">Task Complete</Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No completed needs yet.</p>
                )}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Active Needs</h2>
                 {activeNeeds.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeNeeds.map((need) => (
                             <Card key={need.id}>
                                <CardHeader>
                                    <CardTitle className="truncate">{need.description}</CardTitle>
                                    <CardDescription>Requested on {format(need.timestamp, 'MM/dd/yyyy')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Badge variant={'secondary'}>{need.status}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No active needs.</p>
                )}
            </div>
        </div>
    )
}
