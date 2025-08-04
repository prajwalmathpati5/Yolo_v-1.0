
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ListTodo, CheckCircle2, AlertCircle, Phone, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import type { UserProfile } from '@/lib/types'

// This would typically come from a subcollection on the provider's document
const serviceRequestsData = [
  { id: 'req1', user: { name: 'Alex Johnson', avatar: 'https://placehold.co/40x40.png' }, description: 'Need help moving a large couch.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), status: 'Pending', cost: 150 },
  { id: 'req2', user: { name: 'Maria Garcia', avatar: 'https://placehold.co/40x40.png' }, description: 'I need urgent help with a leaky pipe under my sink.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), status: 'Accepted', cost: 120 },
  { id: 'req3', user: { name: 'Chen Wei', avatar: 'https://placehold.co/40x40.png' }, description: 'Looking for a calculus tutor for weekly sessions.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), status: 'Completed', cost: 50 },
  { id: 'req4', user: { name: 'David Smith', avatar: 'https://placehold.co/40x40.png' }, description: 'Computer is running slow and making strange noises.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), status: 'Declined', cost: 75 },
]

export default function ProviderDashboardPage() {
  const { toast } = useToast()
  
  const handleStatusChange = (requestId: string, newStatus: 'Accepted' | 'Declined' | 'Completed') => {
    // Here you would update the request status in Firestore
    console.log(`Updating request ${requestId} to ${newStatus}`)
    toast({
      title: 'Request Updated',
      description: `Request #${requestId.slice(0, 4)} has been marked as ${newStatus}.`
    })
  }

  const totalRequests = serviceRequestsData.length;
  const pendingRequests = serviceRequestsData.filter(r => r.status === 'Pending').length;
  const completedJobs = serviceRequestsData.filter(r => r.status === 'Completed').length;
  const totalRevenue = serviceRequestsData.filter(r => r.status === 'Completed').reduce((sum, req) => sum + req.cost, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests}</div>
              <p className="text-xs text-muted-foreground">in the last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground">awaiting your response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedJobs}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue}</div>
              <p className="text-xs text-muted-foreground">from completed jobs</p>
            </CardContent>
          </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Incoming Service Requests</CardTitle>
          <CardDescription>Manage incoming requests from users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden sm:table-cell">Description</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceRequestsData.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={req.user.avatar} alt={req.user.name} data-ai-hint="profile person"/>
                          <AvatarFallback>{req.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{req.user.name}</span>
                      </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell max-w-sm truncate">{req.description}</TableCell>
                  <TableCell className="hidden md:table-cell">{format(req.timestamp, 'MM/dd/yyyy')}</TableCell>
                  <TableCell>
                      <Badge 
                        variant={req.status === 'Pending' ? 'secondary' : req.status === 'Completed' ? 'default' : req.status === 'Declined' ? 'destructive' : 'outline'}
                        className={req.status === 'Completed' ? 'bg-green-500/20 text-green-700 border-green-500/20' : req.status === 'Accepted' ? 'bg-blue-500/20 text-blue-700 border-blue-500/20' : ''}
                      >
                        {req.status}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === 'Pending' ? (
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleStatusChange(req.id, 'Accepted')}>Accept</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleStatusChange(req.id, 'Declined')}>Decline</Button>
                      </div>
                    ) : req.status === 'Accepted' ? (
                       <Button variant="default" size="sm" onClick={() => handleStatusChange(req.id, 'Completed')}>Mark as Complete</Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No actions</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
