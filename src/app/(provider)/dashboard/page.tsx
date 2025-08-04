
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ListTodo, CheckCircle2, AlertCircle, Phone, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import type { ServiceRequest } from '@/lib/types'
import { useUser } from '@/context/UserContext'
import { getServiceRequests, updateRequestStatus } from '@/lib/server-actions'

export default function ProviderDashboardPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return
      setIsLoading(true)
      try {
        const serviceRequests = await getServiceRequests(user.uid)
        setRequests(serviceRequests)
      } catch (error) {
        console.error('Failed to fetch service requests:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load your service requests.'
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchRequests()
  }, [user, toast])
  
  const handleStatusChange = async (requestId: string, needId: string, newStatus: 'Accepted' | 'Declined' | 'Completed') => {
    if (!user) return
    try {
      await updateRequestStatus({
        providerId: user.uid,
        requestId,
        needId,
        status: newStatus
      })

      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      )

      toast({
        title: 'Request Updated',
        description: `Request has been marked as ${newStatus}.`
      })
    } catch (error) {
       console.error('Failed to update status:', error)
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not update the request status.'
        })
    }
  }

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const completedJobs = requests.filter(r => r.status === 'Completed').length;
  const totalRevenue = requests
    .filter(r => r.status === 'Completed')
    .reduce((sum, req) => sum + (req.cost || 0), 0);

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
              <p className="text-xs text-muted-foreground">in your queue</p>
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
              <p className="text-xs text-muted-foreground">all-time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading requests...
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No service requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={req.user.photoUrl} alt={req.user.name} data-ai-hint="profile person"/>
                            <AvatarFallback>{req.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{req.user.name}</span>
                        </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell max-w-sm truncate">{req.description}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(req.requestTimestamp.toDate(), 'MM/dd/yyyy')}</TableCell>
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
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(req.id, req.needId, 'Accepted')}>Accept</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleStatusChange(req.id, req.needId, 'Declined')}>Decline</Button>
                        </div>
                      ) : req.status === 'Accepted' ? (
                        <Button variant="default" size="sm" onClick={() => handleStatusChange(req.id, req.needId, 'Completed')}>Mark as Complete</Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No actions</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
