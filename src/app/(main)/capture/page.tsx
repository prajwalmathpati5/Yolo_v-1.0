
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Paperclip, Camera, Wand2, FileText, UserSearch, Copy, Sparkles, Linkedin, Loader2, Search, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { describeImage } from '@/ai/flows/describe-image-flow';
import { hiringAssistant, type HiringAssistantOutput } from '@/ai/flows/hiring-assistant-flow';
import { generateLinkedInPost, type GenerateLinkedInPostOutput } from '@/ai/flows/generate-linkedin-post-flow';
import { findProfiles, type FindProfilesOutput } from '@/ai/flows/find-profiles-flow';
import { marked } from 'marked';
import { findProvidersBySmartSearch } from '@/lib/server-actions';
import type { ServiceProvider } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


export default function CaptureNeedPage() {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  
  const [isLoading, setIsLoading] = useState({
      image: false,
      jobDescription: false,
      linkedInPost: false,
      profiles: false,
      providers: false,
  });

  const [jobDescriptionResult, setJobDescriptionResult] = useState<HiringAssistantOutput | null>(null);
  const [jobDescriptionText, setJobDescriptionText] = useState(''); // Store raw text for AI flows
  const [jobDescriptionHtml, setJobDescriptionHtml] = useState(''); // Store HTML for display
  
  const [linkedInPostResult, setLinkedInPostResult] = useState<GenerateLinkedInPostOutput | null>(null);
  const [suggestedCandidates, setSuggestedCandidates] = useState<FindProfilesOutput['suggestedCandidates']>([]);
  const [providerResults, setProviderResults] = useState<ServiceProvider[]>([]);
  const [hasSearchedProviders, setHasSearchedProviders] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      return;
    }
    navigator.permissions.query({ name: 'camera' as PermissionName }).then((permissionStatus) => {
        setHasCameraPermission(permissionStatus.state !== 'denied');
        permissionStatus.onchange = () => {
            setHasCameraPermission(permissionStatus.state !== 'denied');
        };
    });
  }, []);


  useEffect(() => {
    const startCamera = async () => {
      if (hasCameraPermission && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          setIsCameraOn(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if(videoRef.current) {
            videoRef.current.srcObject = null;
        }
      }
    };

    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isCameraOn, hasCameraPermission, toast]);

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageAnalysis = async (dataUrl: string) => {
    setIsLoading(prev => ({ ...prev, image: true }));
    setDescription('');
    try {
      const result = await describeImage({ imageDataUri: dataUrl });
      setDescription(result.description);
      toast({
        title: 'Image Analyzed',
        description: "We've created a description based on your image.",
      });
    } catch (error) {
      console.error('Image analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Could not analyze the image. Please describe your need manually.',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, image: false }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await fileToDataUri(file);
      setImagePreview(dataUrl);
      if (isCameraOn) setIsCameraOn(false);
      await handleImageAnalysis(dataUrl);
    }
  };

  const handleTakePhoto = () => {
    if (isCameraOn && videoRef.current && canvasRef.current && videoRef.current.readyState >= 3) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setImagePreview(dataUrl);
        setIsCameraOn(false);
        handleImageAnalysis(dataUrl);
      }
    } else {
       toast({
        variant: 'destructive',
        title: 'Camera Not Ready',
        description: 'Please wait for the camera feed to start before taking a photo.',
      });
    }
  };

  const handleGetAiSolution = async () => {
    if (!description) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter a description.' });
      return;
    }
    
    handleResetResults();
    setIsLoading(prev => ({ ...prev, jobDescription: true }));

    try {
        const solution = await hiringAssistant({ need: description });
        setJobDescriptionResult(solution);
        setJobDescriptionText(solution.jobDescription); // Store raw markdown text
        const html = await marked.parse(solution.jobDescription, { gfm: true, breaks: true });
        setJobDescriptionHtml(html); // Store rendered HTML for display
    } catch (error) {
      console.error('AI solution failed:', error);
       toast({
        variant: 'destructive',
        title: 'AI Solution Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, jobDescription: false }));
    }
  };

  const handleGenerateLinkedInPost = async () => {
    if (!jobDescriptionText) return;
    setIsLoading(prev => ({ ...prev, linkedInPost: true }));
    setLinkedInPostResult(null);
    try {
      const result = await generateLinkedInPost({ jobDescription: jobDescriptionText });
      setLinkedInPostResult(result);
    } catch (error) {
      console.error('LinkedIn post generation failed:', error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: error instanceof Error ? error.message : 'Could not generate LinkedIn post.' });
    } finally {
      setIsLoading(prev => ({ ...prev, linkedInPost: false }));
    }
  };

  const handleFindProfiles = async () => {
    if (!jobDescriptionText) return;
    setIsLoading(prev => ({ ...prev, profiles: true }));
    setSuggestedCandidates([]);
    try {
      const result = await findProfiles({ jobDescription: jobDescriptionText });
      setSuggestedCandidates(result.suggestedCandidates);
       if (result.suggestedCandidates.length === 0) {
        toast({ title: 'No Profiles Found', description: `We couldn't find any candidate profiles. Try refining the job description.` });
      }
    } catch (error) {
      console.error('Find profiles failed:', error);
      toast({ variant: 'destructive', title: 'Search Failed', description: error instanceof Error ? error.message : 'Could not find profiles.' });
    } finally {
      setIsLoading(prev => ({ ...prev, profiles: false }));
    }
  };
  
   const handleFindProviders = async () => {
    if (!description) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter a description.' });
      return;
    }
    handleResetResults();
    setIsLoading(prev => ({...prev, providers: true}));
    setHasSearchedProviders(true);
    try {
      const providers = await findProvidersBySmartSearch(description);
      setProviderResults(providers);
      if (providers.length === 0) {
        toast({
          title: 'No Providers Found',
          description: `We couldn't find any providers related to your need.`,
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
      setIsLoading(prev => ({...prev, providers: false}));
    }
  };

  const handleToggleCameraSwitch = (checked: boolean) => {
      if (checked && hasCameraPermission === false) {
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this feature.',
          });
          return;
      }
      setIsCameraOn(checked);
  };
  
  const handleResetResults = () => {
    setJobDescriptionResult(null);
    setJobDescriptionText('');
    setJobDescriptionHtml('');
    setLinkedInPostResult(null);
    setSuggestedCandidates([]);
    setProviderResults([]);
    setHasSearchedProviders(false);
  }

  const handleResetAll = () => {
    setDescription('');
    setImagePreview(null);
    if(isCameraOn) setIsCameraOn(false);
    handleResetResults();
  };
  
  const handleCopyToClipboard = (text: string | null) => {
    if (!text) return;
    // The text is already parsed to HTML, create a temp element to get text content for clipboard
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";

    navigator.clipboard.writeText(plainText).then(() => {
      toast({
        title: 'Copied to Clipboard!',
        description: 'You can now paste the content.',
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy text to clipboard.',
      });
    });
  };

  const anyLoading = Object.values(isLoading).some(v => v);

  return (
    <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Describe Your Need</CardTitle>
            <CardDescription>
              Detail your problem, question, or goal. You can find a service provider or use the AI to generate a job description for hiring.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="camera-toggle"
                checked={isCameraOn}
                onCheckedChange={handleToggleCameraSwitch}
                aria-label="Toggle Camera"
                disabled={anyLoading}
              />
              <Label htmlFor="camera-toggle">Use Camera</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Live Camera</Label>
                <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-muted">
                    <video ref={videoRef} className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : 'block'}`} autoPlay muted playsInline />
                    {!isCameraOn && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Camera className="h-10 w-10 mb-2" />
                        <span>Camera is off</span>
                        </div>
                    )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" data-ai-hint="user upload" />
                  ) : (
                    <span className="text-muted-foreground">Photo preview</span>
                  )}
                   {isLoading.image && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                        <Sparkles className="h-8 w-8 animate-pulse text-primary" />
                        <p className="text-sm text-muted-foreground mt-2">Analyzing image...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <Camera className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  To use the live camera feature, please allow camera access in your browser settings. You can still upload a file manually.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
                <Label htmlFor="description">Your Need, Problem, or Question</Label>
                <Textarea
                id="description"
                placeholder={isLoading.image ? "AI is generating a description from your image..." : "e.g., 'I need a plumber to fix a leaky sink' or 'I want to hire an AI engineer'"}
                className="min-h-32 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-label="Need description"
                disabled={anyLoading}
                />
            </div>
            <div className="flex items-center gap-2 pt-2">
                <Button type="button" variant="outline" size="icon" onClick={handleTakePhoto} disabled={!isCameraOn || hasCameraPermission !== true || anyLoading}>
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Take Photo</span>
                </Button>
                <Input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" disabled={anyLoading} />
                <Button type="button" variant="outline" size="icon" asChild disabled={anyLoading}>
                    <Label htmlFor="image-upload" className={!anyLoading ? "cursor-pointer" : "cursor-not-allowed"}>
                    <Paperclip className="h-4 w-4" />
                    <span className="sr-only">Upload Image</span>
                    </Label>
                </Button>
                <Button type="button" variant="outline" size="icon" disabled>
                    <Mic className="h-4 w-4" />
                    <span className="sr-only">Voice Input</span>
                </Button>
            </div>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button variant="ghost" onClick={handleResetAll} disabled={anyLoading}>
                Start Over
            </Button>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleFindProviders} disabled={anyLoading || !description} variant="secondary">
                  {isLoading.providers ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  {isLoading.providers ? 'Finding...' : 'Find Providers'}
              </Button>
              <Button onClick={handleGetAiSolution} disabled={anyLoading || !description}>
                  {isLoading.jobDescription ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  {isLoading.jobDescription ? 'Processing...' : 'Get AI Solution'}
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {hasSearchedProviders && !isLoading.providers && (
          <Card>
            <CardHeader>
                <CardTitle>Available Providers</CardTitle>
                <CardDescription>These providers may be able to help with your need.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg">
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
                  {providerResults.length > 0 ? (
                    providerResults.map((provider) => (
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
                        No providers found for your need. Try rephrasing your description.
                      </TableCell>
                    </TableRow>
                   )}
                  </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        )}
      
        {jobDescriptionResult && !isLoading.jobDescription && (
            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Generated Job Description
                        </CardTitle>
                        <CardDescription>Review the generated job description. You can copy it or use it to generate more assets.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(jobDescriptionHtml)}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy Job Description</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div
                        className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                        dangerouslySetInnerHTML={{ __html: jobDescriptionHtml }}
                    />
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Button variant="secondary" onClick={handleGenerateLinkedInPost} disabled={anyLoading}>
                    {isLoading.linkedInPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Linkedin className="mr-2 h-4 w-4" />}
                    {isLoading.linkedInPost ? 'Generating...' : 'Generate LinkedIn Post'}
                  </Button>
                  <Button onClick={handleFindProfiles} disabled={anyLoading}>
                    {isLoading.profiles ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserSearch className="mr-2 h-4 w-4" />}
                    {isLoading.profiles ? 'Finding...' : 'Find Matching Profiles'}
                  </Button>
                </CardFooter>
            </Card>
        )}
      
        {linkedInPostResult && !isLoading.linkedInPost && (
            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Linkedin className="h-6 w-6" />
                            Generated LinkedIn Post
                        </CardTitle>
                        <CardDescription>Copy this post to share on LinkedIn.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(linkedInPostResult.linkedInPost)}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy LinkedIn Post</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div
                        className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: linkedInPostResult.linkedInPost }}
                    />
                </CardContent>
            </Card>
        )}

        {suggestedCandidates.length > 0 && !isLoading.profiles && (
             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserSearch className="h-6 w-6" />
                  Suggested Professionals
                </CardTitle>
                <CardDescription>We found these professionals based on the job description.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedCandidates.map((candidate, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{candidate.name}</h3>
                        <a href={candidate.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{candidate.link}</a>
                      </div>
                       <Button asChild variant="outline" size="sm">
                          <a href={candidate.link} target="_blank" rel="noopener noreferrer">
                           View Profile
                          </a>
                        </Button>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground mt-2" dangerouslySetInnerHTML={{ __html: candidate.summary }}/>
                  </div>
                ))}
              </CardContent>
            </Card>
        )}

    </div>
  );
}

    