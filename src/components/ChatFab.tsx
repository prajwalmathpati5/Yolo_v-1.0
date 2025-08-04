
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import type { Message, ServiceProvider } from '@/lib/types';
import { Send, Phone, DollarSign, UserCheck, MessageSquare } from 'lucide-react';
import { chat } from '@/ai/flows/chat-flow';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';

const ProviderCard = ({ provider }: { provider: ServiceProvider }) => (
    <Card className="mt-2">
        <CardHeader className="pb-2">
            <CardTitle className="text-base">{provider.name}</CardTitle>
            <CardDescription>{provider.category}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
            <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{provider.phone_number}</span>
            </div>
            <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Average Cost: ₹{provider.avg_cost}</span>
            </div>
             <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span>{provider.available ? 'Available' : 'Unavailable'}</span>
            </div>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <a href={`tel:${provider.phone_number}`}>
                    <Phone className="mr-2 h-4 w-4" /> Call Now
                </a>
            </Button>
        </CardFooter>
    </Card>
);

const ChatInterface = () => {
    const { user } = useUser();
    const [messages, setMessages] = useState<Message[]>([
      { 
          id: '1', 
          userId: 'ai-support', 
          name: 'Support Team', 
          avatar: 'https://placehold.co/100x100.png', 
          text: 'Hello! How can I help you with YOLO Needs today? You can ask me to help build a project team.', 
          timestamp: new Date(), 
          isCurrentUser: false 
      },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
  
    const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newMessage.trim() === '' || isLoading) return;
  
      const userMessage: Message = {
        id: Date.now().toString(),
        userId: user!.email!,
        name: user!.name!,
        avatar: user!.photoUrl!,
        text: newMessage,
        timestamp: new Date(),
        isCurrentUser: true,
      };
  
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setNewMessage('');
      setIsLoading(true);
  
      try {
          const result = await chat({ history: messages, newMessage });
          
          const aiMessage: Message = {
              id: Date.now().toString() + '-ai',
              userId: 'ai-support',
              name: 'Support Team',
              avatar: 'https://placehold.co/100x100.png',
              text: result.response,
              timestamp: new Date(),
              isCurrentUser: false,
              matchedProviders: result.matchedProviders,
          };
          setMessages(prev => [...prev, aiMessage]);
  
      } catch (error) {
          console.error("Chat error", error);
          const errorMessage: Message = {
               id: Date.now().toString() + '-err',
              userId: 'ai-support',
              name: 'Support Team',
              avatar: 'https://placehold.co/100x100.png',
              text: "Sorry, I'm having trouble connecting. Please try again later.",
              timestamp: new Date(),
              isCurrentUser: false,
          };
          setMessages(prev => [...prev, errorMessage]);
      } finally {
          setIsLoading(false);
      }
    };
    return (
        <div className="flex flex-col h-full">
            <SheetHeader className='p-6 pb-2'>
                <SheetTitle>AI Chat Support</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden p-6 pt-2">
                <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                    {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn('flex items-end gap-2', { 'justify-end': msg.isCurrentUser })}
                    >
                        {!msg.isCurrentUser && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.avatar} alt={msg.name} data-ai-hint="profile support" />
                            <AvatarFallback>{msg.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        )}
                        <div
                        className={cn(
                            'max-w-xs rounded-lg p-3 text-sm lg:max-w-md',
                            msg.isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                        >
                        <p>{msg.text}</p>
                        {msg.matchedProviders && msg.matchedProviders.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    {msg.matchedProviders.map(p => <ProviderCard key={p.id} provider={p} />)}
                                </div>
                            )}
                        </div>
                        {msg.isCurrentUser && user && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoUrl} alt={user.name} data-ai-hint="profile picture" />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        )}
                    </div>
                    ))}
                    {isLoading && (
                    <div className="flex items-end gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={'https://placehold.co/100x100.png'} alt={'Support Team'} data-ai-hint="profile support" />
                            <AvatarFallback>S</AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse delay-0"></span>
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                            </div>
                        </div>
                    </div>
                    )}
                </div>
                </ScrollArea>
            </div>
            <div className="p-6 pt-0">
                <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                    <Send className="h-4 w-4" />
                </Button>
                </form>
            </div>
        </div>
    )
}

export function ChatFab() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
                    size="icon"
                >
                    <MessageSquare className="h-6 w-6" />
                    <span className="sr-only">Open Chat</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="p-0 w-full max-w-lg">
                <ChatInterface />
            </SheetContent>
        </Sheet>
    )
}
