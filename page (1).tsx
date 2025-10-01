
"use client";

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Bot, User, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { chatWithAssistant } from '@/ai/flows/chat-with-assistant';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function VoiceAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        if (transcript) {
          handleUserMessage(transcript);
        }
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        if (event.error === 'no-speech') {
          console.log('No speech detected.');
        } else {
            console.error('Speech recognition error', event.error);
            toast({
                variant: "destructive",
                title: "Speech Recognition Error",
                description: `An error occurred: ${event.error}. Please ensure you have given microphone permissions.`,
            });
        }
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

    } else {
        toast({
            variant: "destructive",
            title: "Browser Not Supported",
            description: "Speech recognition is not supported in your browser.",
        });
    }
  }, [toast]);
  
  const handleToggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Could not start recognition", error);
        toast({
          variant: "destructive",
          title: "Could not start recording",
          description: "Please ensure microphone permissions are granted and try again.",
        });
        setIsRecording(false);
      }
    }
  };

  const handleUserMessage = async (message: string) => {
    const userMessage: Message = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setAudioSrc(null);

    try {
      const conversationHistory = messages;
      const result = await chatWithAssistant({
        message,
        conversationHistory: conversationHistory.map(m => ({ role: m.role, content: m.content as string })),
      });
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      const audioResult = await textToSpeech({ text: result.response });
      setAudioSrc(audioResult.audioDataUri);

    } catch (error) {
      console.error('Error with AI chat:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioSrc && audioRef.current) {
        audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    }
  }, [audioSrc]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);


  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">Voice Assistant</h1>
      </header>
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
               <div className="space-y-6 pr-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground pt-16">
                    <Bot size={48} className="mx-auto" />
                    <p className="mt-4 text-lg">Press the mic to start talking.</p>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-4',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                       <Bot className="w-8 h-8 border rounded-full p-1.5" />
                    )}
                    <div
                      className={cn(
                        'max-w-md rounded-lg p-3 text-sm',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <User className="w-8 h-8 border rounded-full p-1.5" />
                    )}
                  </div>
                ))}
                 {isLoading && (
                  <div className="flex items-start gap-4">
                    <Bot className="w-8 h-8 border rounded-full p-1.5" />
                    <div className="max-w-md rounded-lg p-3 bg-card border">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
             <div className="flex flex-col items-center justify-center gap-4 pt-4">
                <Button onClick={handleToggleRecording} size="lg" className="rounded-full w-20 h-20" disabled={isLoading}>
                    {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                </Button>
                <p className="text-sm text-muted-foreground">
                    {isLoading ? "Thinking..." : isRecording ? 'Listening...' : 'Tap to speak'}
                </p>
             </div>
          </CardContent>
        </Card>
      </main>
      {audioSrc && <audio ref={audioRef} src={audioSrc} />}
    </div>
  );
}

declare global {
    interface Window {
      SpeechRecognition: typeof SpeechRecognition;
      webkitSpeechRecognition: typeof SpeechRecognition;
    }
}
