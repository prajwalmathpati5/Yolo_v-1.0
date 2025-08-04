'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Need, ServiceProvider } from '@/lib/types'
import { ListTodo, CheckCircle2, AlertCircle, PlusCircle, Search, Phone, DollarSign } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { findProvidersBySmartSearch } from '@/lib/server-actions'

const activeNeedsData: Need[] = [
  { id: '2', user: { name: 'You', avatar: 'https://placehold.co/40x40.png' }, description: 'Looking for a study partner for my chemistry final.', status: 'Approved', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  { id: '1', user: { name: 'You', avatar: 'https://placehold.co/40x40.png' }, description: 'I need help moving a couch this weekend.', status: 'Pending', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
];

const totalNeeds = 8;
const completedNeeds = 4;
const pendingNeeds = activeNeedsData.filter(n => n.status === 'Pending').length;

export default function HomePage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ServiceProvider[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        variant: 'destructive',
        title: 'Search Error',
        description: 'Please enter a category to search for.',
      });
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const providers = await findProvidersBySmartSearch(searchQuery);
      setSearchResults(providers);
      if (providers.length === 0) {
        toast({
          title: 'No Providers Found',
          description: `We couldn't find any providers related to "${searchQuery}".`,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: 'An unexpected error occurred while searching for providers.',
      });
    } finally {
      setIsSearching(false);
    }
  };


  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Needs</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalNeeds}</div>
                <p className="text-xs text-muted-foreground">in the last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedNeeds}</div>
                <p className="text-xs text-muted-foreground">tasks you've finished</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingNeeds}</div>
                <p className="text-xs text-muted-foreground">needs awaiting action</p>
              </CardContent>
            </Card>
        </div>

        <Button asChild size="lg" className="h-14 text-lg">
          <Link href="/capture">
            <PlusCircle className="mr-2 h-6 w-6" />
            Create a New Need
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Find a Service Provider</CardTitle>
            <CardDescription>Search for available providers by service category.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="text"
                placeholder="e.g., Healthcare, fix leaky pipe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isSearching}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-primary-foreground rounded-full"></span>
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {hasSearched && !isSearching && (
              <div className="mt-4 border rounded-lg">
                 <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Avg. Cost</TableHead>
                          <TableHead className="text-right">Contact</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                  {searchResults.length > 0 ? (
                    searchResults.map((provider) => (
                      <TableRow key={provider.id}>
                          <TableCell className="font-medium">{provider.name}</TableCell>
                          <TableCell>{provider.category}</TableCell>
                          <TableCell>₹{provider.avg_cost}</TableCell>
                          <TableCell className="text-right">
                              <Button asChild variant="outline" size="sm">
                                <a href={`tel:${provider.phone_number}`}>
                                  <Phone className="mr-2 h-4 w-4" /> Call
                                </a>
                              </Button>
                          </TableCell>
                      </TableRow>
                    ))
                   ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No results found for "{searchQuery}". Try a different search.
                      </TableCell>
                    </TableRow>
                   )}
                  </TableBody>
              </Table>
              </div>
            )}
            
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Active Needs</CardTitle>
            <CardDescription>A summary of your needs that are not yet completed.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="hidden sm:table-cell">Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                  {activeNeedsData.map((need) => (
                      <TableRow key={need.id}>
                          <TableCell className="font-medium max-w-sm truncate">{need.description}</TableCell>
                          <TableCell className="hidden sm:table-cell">{format(need.timestamp, 'MM/dd/yyyy')}</TableCell>
                          <TableCell>
                              <Badge variant={need.status === 'Pending' ? 'secondary' : 'default'}
                                className={need.status === 'Approved' ? 'bg-green-500/20 text-green-700 border-green-500/20' : ''}
                              >{need.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                              <Button variant="outline" size="sm" asChild>
                                <Link href="/activity">View Details</Link>
                              </Button>
                          </TableCell>
                      </TableRow>
                  ))}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
