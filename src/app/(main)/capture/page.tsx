
'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Paperclip, Camera, Wand2, FileText, UserSearch, Copy, Sparkles, Linkedin, Loader2, Search, Phone, FileScan, Briefcase, UserRound, Send, Plus, AudioLines, ImageUp, FileUp, X, MessageSquare, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { describeImage } from '@/ai/flows/describe-image-flow';
import { analyzeDocumentForRoles } from '@/ai/flows/analyze-document-for-roles-flow';
import { hiringAssistant, type HiringAssistantOutput } from '@/ai/flows/hiring-assistant-flow';
import { generateLinkedInPost, type GenerateLinkedInPostOutput } from '@/ai/flows/generate-linkedin-post-flow';
import { findProfiles, type FindProfilesOutput } from '@/ai/flows/find-matching-profiles-flow';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/context/UserContext';
import { type ChatConversation } from '@/lib/types';
import { getConversationHistory, saveOrUpdateConversation } from '@/lib/server-actions';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';


export default function CaptureNeedPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [documentName, setDocumentName] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState({
      image: false,
      jobDescription: false,
      linkedInPost: false,
      profiles: false,
      document: false,
      history: false,
  });

  // State for the current conversation
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [history, setHistory] = useState<ChatConversation[]>([]);

  // Derived state from currentConversation
  const jobDescriptionResult = currentConversation?.jobDescriptionResult ?? null;
  const jobDescriptionText = currentConversation?.jobDescriptionResult?.jobDescription ?? '';
  const linkedInPostResult = currentConversation?.linkedInPostResult ?? null;
  const profileResults = currentConversation?.profileResults ?? null;

  const [hasSearchedProfiles, setHasSearchedProfiles] = useState(false);
  
  const showWelcome = !currentConversation && !description && !imagePreview && !documentName;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div');
        if(scrollableView) {
           scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [jobDescriptionResult, profileResults, linkedInPostResult]);


  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [description]);


  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
  }, []);
  
  // Fetch history on load
  useEffect(() => {
    if (user) {
      setIsLoading(prev => ({ ...prev, history: true }));
      getConversationHistory(user.uid)
        .then(setHistory)
        .catch(err => {
          console.error("Failed to fetch history:", err);
          toast({ variant: "destructive", title: "Could not load chat history." });
        })
        .finally(() => setIsLoading(prev => ({ ...prev, history: false })));
    }
  }, [user, toast]);


  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const handleRemoveAttachment = () => {
    setImagePreview(null);
    setDocumentName(null);
    if (imageInputRef.current) {
        imageInputRef.current.value = '';
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };


  const handleImageAnalysis = async (dataUrl: string) => {
    setIsLoading(prev => ({ ...prev, image: true }));
    setDescription('');
    try {
      const result = await describeImage({ imageDataUri: dataUrl });
      setDescription(result.description);
      toast({
        title: 'Image Analyzed',
        description: "We've added a description based on your image. You can now generate a job description.",
      });
    } catch (error) {
      console.error('Image analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Could not analyze the image. Please describe your need manually.',
      });
       handleRemoveAttachment();
    } finally {
      setIsLoading(prev => ({ ...prev, image: false }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleNewConversation();
      setDocumentName(null);
      
      const dataUrl = await fileToDataUri(file);
      setImagePreview(dataUrl);
      await handleImageAnalysis(dataUrl);
    }
  };
  
  const handleAnalyzeDocument = async (text: string) => {
    if (!text) {
      toast({ variant: 'destructive', title: 'No Document Content', description: 'Could not extract text from the document.' });
      return;
    }
    setIsLoading(prev => ({ ...prev, document: true }));
    setDescription('');
    try {
      const result = await analyzeDocumentForRoles({ documentText: text });
      setDescription(result.rolesDescription);
      toast({
        title: 'Document Analyzed',
        description: "We've identified the roles needed. You can now generate a job description.",
      });
    } catch (error) {
      console.error('Document analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Could not analyze the document.',
      });
      handleRemoveAttachment();
    } finally {
      setIsLoading(prev => ({ ...prev, document: false }));
    }
  };


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleNewConversation();
      setImagePreview(null);
      
      setDocumentName(file.name);
      
      try {
        if (file.type === 'application/pdf') {
          const reader = new FileReader();
          reader.onload = async (event) => {
            if (event.target?.result) {
              const loadingTask = pdfjsLib.getDocument({ data: event.target.result as ArrayBuffer });
              const pdf = await loadingTask.promise;
              let fullText = '';
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
              }
              await handleAnalyzeDocument(fullText);
            }
          };
          reader.readAsArrayBuffer(file);
        } else if (file.type === 'text/plain') {
          const text = await file.text();
          await handleAnalyzeDocument(text);
        } else {
          toast({
            variant: 'destructive',
            title: 'Unsupported File Type',
            description: 'Please upload a .txt or .pdf file.',
          });
          handleRemoveAttachment();
        }
      } catch (error) {
         console.error('Error processing file:', error);
         toast({
            variant: 'destructive',
            title: 'File Processing Failed',
            description: 'There was an error reading the file content.',
         });
         handleRemoveAttachment();
      }
    }
  };

  const handleGetAiSolution = async () => {
    if (!description || !user) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter a description.' });
      return;
    }
    
    // Clear previous results but keep the description
    setCurrentConversation(prev => ({
        ...(prev ?? {
            userId: user.uid,
            timestamp: new Date(),
            title: description.substring(0, 40) + '...',
            initialNeed: description,
        }),
        jobDescriptionResult: undefined,
        linkedInPostResult: undefined,
        profileResults: undefined,
    }));
    setHasSearchedProfiles(false);
    setIsLoading(prev => ({ ...prev, jobDescription: true }));

    try {
      const solution = await hiringAssistant({ need: description });
      
      const convoToSave: ChatConversation = {
        ...(currentConversation ?? {
            userId: user.uid,
            timestamp: new Date(),
            title: description.substring(0, 40) + '...',
        }),
        initialNeed: description,
        jobDescriptionResult: solution
      };

      const savedId = await saveOrUpdateConversation(user.uid, convoToSave);
      
      const finalConvo = { ...convoToSave, id: savedId };
      setCurrentConversation(finalConvo);

      // Add to history list or update it
      setHistory(prev => {
        const existingIndex = prev.findIndex(h => h.id === savedId);
        if (existingIndex > -1) {
            const newHistory = [...prev];
            newHistory[existingIndex] = finalConvo;
            return newHistory;
        } else {
            return [finalConvo, ...prev];
        }
      });
      
    } catch (error) {
      console.error('AI solution failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Solution Failed',
        description: error instanceof Error ? error.message : 'The AI service could not generate a solution.',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, jobDescription: false }));
    }
  };

  const handleGenerateLinkedInPost = async () => {
    if (!jobDescriptionText || !user || !currentConversation) {
      return;
    }
    setIsLoading(prev => ({ ...prev, linkedInPost: true }));
    try {
      const result = await generateLinkedInPost({ jobDescription: jobDescriptionText });
      
      const convoToSave = { ...currentConversation, linkedInPostResult: result };
      await saveOrUpdateConversation(user.uid, convoToSave);
      setCurrentConversation(convoToSave);

    } catch (error) {
      console.error('LinkedIn post generation failed:', error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: error instanceof Error ? error.message : 'Could not generate LinkedIn post.' });
    } finally {
      setIsLoading(prev => ({ ...prev, linkedInPost: false }));
    }
  };

   const handleFindMatchingProfiles = async () => {
    if (!jobDescriptionText || !user || !currentConversation) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please generate a job description first.' });
      return;
    }
    setIsLoading(prev => ({...prev, profiles: true}));
    setHasSearchedProfiles(true);
    
    try {
      const profiles = await findProfiles({ jobDescription: jobDescriptionText });
      
      const convoToSave = { ...currentConversation, profileResults: profiles };
      await saveOrUpdateConversation(user.uid, convoToSave);
      setCurrentConversation(convoToSave);

      if (profiles.suggestedCandidates.length === 0) {
        toast({
          title: 'No Profiles Found',
          description: "We couldn't find any matching profiles. Try refining the job description.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while searching for profiles.',
      });
    } finally {
      setIsLoading(prev => ({...prev, profiles: false}));
    }
  };

  const handleNewConversation = () => {
    setCurrentConversation(null);
    setDescription('');
    handleRemoveAttachment();
    setHasSearchedProfiles(false);
  };
  
  const handleLoadConversation = (convo: ChatConversation) => {
    setCurrentConversation(convo);
    setDescription(convo.initialNeed);
    setHasSearchedProfiles(!!convo.profileResults);
    handleRemoveAttachment(); // Clear any file previews
  };

  const handleCopyToClipboard = (text: string | null) => {
    if (!text) {
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to Clipboard!',
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
      });
    });
  };

  const handlePostOnLinkedIn = (text: string | null) => {
    if (!text) {
      return;
    }
    const url = `https://www.linkedin.com/shareArticle?mini=true&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const anyLoading = Object.values(isLoading).some(v => v);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!anyLoading && description) {
            handleGetAiSolution();
        }
    }
  };

  const isAnalyzing = isLoading.image || isLoading.document;

  return (
    <div className="flex h-full w-full bg-slate-900 text-white overflow-hidden">
        {/* History Sidebar */}
        <div className="hidden md:flex flex-col w-64 bg-slate-900/80 border-r border-slate-800">
            <div className="p-2">
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent border-slate-700 hover:bg-slate-800" onClick={handleNewConversation}>
                    <PlusCircle className="h-4 w-4"/> New Chat
                </Button>
            </div>
            <ScrollArea className="flex-1 p-2">
                <div className="space-y-1">
                {isLoading.history && <p className="text-xs text-slate-500 text-center py-2">Loading history...</p>}
                {history.map(convo => (
                    <Button 
                        key={convo.id}
                        variant="ghost" 
                        className={cn(
                            "w-full justify-start gap-2 truncate text-left h-auto py-2",
                            currentConversation?.id === convo.id ? "bg-slate-800" : "hover:bg-slate-800/50"
                        )}
                        onClick={() => handleLoadConversation(convo)}
                    >
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="truncate text-sm font-normal">{convo.title}</span>
                            <span className="text-xs text-slate-500">{formatDistanceToNow(convo.timestamp, { addSuffix: true })}</span>
                        </div>
                    </Button>
                ))}
                </div>
            </ScrollArea>
        </div>

        <div className="flex flex-col flex-1 h-full max-h-[calc(100vh-8rem)]">
            <ScrollArea className="flex-1 -mx-4 px-4" ref={scrollAreaRef}>
                <div className="space-y-8 pb-4 max-w-5xl mx-auto">
                    {showWelcome && (
                        <div className="flex flex-col items-center justify-center text-center h-full pt-16">
                            <Logo className="text-4xl text-white" iconClassName="h-12 w-12 text-primary" />
                            <p className="mt-4 text-slate-400">How can I help you today?</p>
                        </div>
                    )}
                
                    {jobDescriptionResult && !isLoading.jobDescription && (
                        <Card className="bg-slate-800 border-slate-700 text-white">
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-6 w-6" />
                                        Generated Job Description
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">Review the generated job description. You can copy it or use it to find matching profiles and generate more assets.</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(jobDescriptionText)} className="text-slate-400 hover:text-white hover:bg-slate-700">
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy Job Description</span>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-slate-300">
                                {jobDescriptionText}
                                </ReactMarkdown>
                            </CardContent>
                            <CardFooter className="flex flex-col sm:flex-row gap-4 justify-end">
                            <Button variant="secondary" onClick={handleFindMatchingProfiles} disabled={anyLoading} className="bg-slate-700 hover:bg-slate-600 text-white">
                                {isLoading.profiles ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserSearch className="mr-2 h-4 w-4" />}
                                {isLoading.profiles ? 'Searching...' : 'Find Matching Profiles'}
                            </Button>
                            <Button variant="secondary" onClick={handleGenerateLinkedInPost} disabled={anyLoading} className="bg-slate-700 hover:bg-slate-600 text-white">
                                {isLoading.linkedInPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Linkedin className="mr-2 h-4 w-4" />}
                                {isLoading.linkedInPost ? 'Generating...' : 'Generate LinkedIn Post'}
                            </Button>
                            </CardFooter>
                        </Card>
                    )}
                
                    {hasSearchedProfiles && !isLoading.profiles && profileResults && (
                        <Card className="bg-slate-800 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-6 w-6" />
                                    Suggested Candidates
                                </CardTitle>
                                <CardDescription className="text-slate-400">Here are some candidates the AI found based on the job description.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {profileResults.suggestedCandidates.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {profileResults.suggestedCandidates.map((candidate, index) => (
                                            <Card key={index} className="flex flex-col bg-slate-700 border-slate-600">
                                                <CardHeader className="flex flex-row items-start gap-4">
                                                    <Avatar className="h-12 w-12 border border-slate-500">
                                                        <AvatarImage src={candidate.thumbnail} alt={candidate.name} data-ai-hint="person portrait" />
                                                        <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <CardTitle className="text-lg text-white">{candidate.name}</CardTitle>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="flex-grow">
                                                <div className="prose prose-sm prose-invert max-w-none text-slate-400 line-clamp-3" dangerouslySetInnerHTML={{ __html: candidate.summary }} />
                                                </CardContent>
                                                <CardFooter>
                                                    <Button asChild className="w-full bg-slate-600 hover:bg-slate-500 text-white">
                                                        <a href={candidate.link} target="_blank" rel="noopener noreferrer">
                                                            <Linkedin className="mr-2 h-4 w-4" /> View Profile
                                                        </a>
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                <div className="flex flex-col items-center justify-center text-center h-48 rounded-lg border border-dashed border-slate-700">
                                        <UserSearch className="h-10 w-10 mb-4 text-slate-500" />
                                        <p className="font-semibold text-white">No Matching Profiles Found</p>
                                        <p className="text-sm text-slate-400">Try refining your job description for better results.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {linkedInPostResult && !isLoading.linkedInPost && (
                        <Card className="bg-slate-800 border-slate-700 text-white">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Linkedin className="h-6 w-6" />
                                            Generated LinkedIn Post
                                        </CardTitle>
                                        <CardDescription className="text-slate-400">Copy this post or share it directly on LinkedIn.</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(linkedInPostResult.linkedInPost)} className="text-slate-400 hover:text-white hover:bg-slate-700">
                                        <Copy className="h-4 w-4" />
                                        <span className="sr-only">Copy LinkedIn Post</span>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-slate-300 whitespace-pre-wrap">
                                {linkedInPostResult.linkedInPost}
                                </ReactMarkdown>
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button onClick={() => handlePostOnLinkedIn(linkedInPostResult.linkedInPost)} className="bg-slate-700 hover:bg-slate-600 text-white">
                                    <Linkedin className="mr-2 h-4 w-4" />
                                    Post on LinkedIn
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </ScrollArea>
            <div className="mt-auto bg-slate-900 pt-4">
                <div className="relative mx-auto w-full max-w-5xl">
                    {(imagePreview || documentName) && (
                        <div className="p-4">
                            <div className="relative w-fit bg-slate-800 p-2 rounded-lg flex items-center gap-3">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Image preview" className="h-20 w-auto rounded" />
                                ) : documentName ? (
                                    <div className="flex items-center gap-3 p-2">
                                        <FileText className="h-8 w-8 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium text-white">{documentName}</p>
                                            <p className="text-xs text-slate-400">Document</p>
                                        </div>
                                    </div>
                                ) : null}
                                {isAnalyzing && (
                                    <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-2 bg-slate-700 text-slate-300 border-slate-600">
                                        <Loader2 className="h-3 w-3 animate-spin"/>
                                        <span>Analyzing...</span>
                                    </Badge>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-600 text-white"
                                    onClick={handleRemoveAttachment}
                                    disabled={isAnalyzing}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!anyLoading && description) {
                                handleGetAiSolution();
                            }
                        }}
                        className="relative flex w-full items-center rounded-full bg-slate-800 p-2"
                    >
                        <Input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" disabled={anyLoading} ref={imageInputRef}/>
                        <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.pdf" disabled={anyLoading} ref={fileInputRef}/>
                        
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" disabled={anyLoading} className="text-slate-400 hover:text-white hover:bg-slate-700">
                            <Plus className="h-5 w-5" />
                            <span className="sr-only">Show Upload Options</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 mb-2 bg-slate-800 border-slate-700 text-white">
                            <div className="flex flex-col gap-2">
                            <Button
                                variant="ghost"
                                className="justify-start hover:bg-slate-700"
                                onClick={() => imageInputRef.current?.click()}
                                disabled={anyLoading}
                            >
                                <ImageUp className="mr-2 h-4 w-4" />
                                Upload Image
                            </Button>
                            <Button
                                variant="ghost"
                                className="justify-start hover:bg-slate-700"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={anyLoading}
                            >
                                <FileUp className="mr-2 h-4 w-4" />
                                Upload Document
                            </Button>
                            </div>
                        </PopoverContent>
                        </Popover>

                        <div className="w-px h-6 bg-slate-600/30 mx-2"/>

                        <Textarea
                            id="description"
                            ref={textareaRef}
                            placeholder="Ask anything..."
                            className="flex-1 bg-transparent border-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none p-0 text-base text-white placeholder:text-slate-400"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onKeyDown={handleKeyDown}
                            aria-label="Need description"
                            disabled={anyLoading}
                            rows={1}
                        />
                        <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon" onClick={() => toast({title: "Voice input not available"}) } disabled={anyLoading} className="text-slate-400 hover:text-white hover:bg-slate-700">
                                <Mic className="h-5 w-5" />
                                <span className="sr-only">Use Microphone</span>
                            </Button>
                            <Button type="submit" size="icon" className="bg-primary rounded-full" disabled={anyLoading || !description}>
                                {isLoading.jobDescription ? <Loader2 className="h-5 w-5 animate-spin" /> : <AudioLines className="h-5 w-5" />}
                                <span className="sr-only">Generate</span>
                            </Button>
                        </div>
                    </form>
                    <p className="text-xs text-center text-slate-500 mt-2 px-2">
                        YOLO Needs can generate job descriptions, find candidates, and more. 
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}
