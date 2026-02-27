import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@netrun-cms/ui';

interface Props {
  onTranscript: (text: string) => void;
  audioBlob?: Blob | null;
  autoPlay?: boolean;
  onAutoPlayToggle?: (enabled: boolean) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function VoiceControls({ onTranscript, audioBlob, autoPlay = false, onAutoPlayToggle }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript.trim()) {
        onTranscript(transcript.trim());
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => { recognition.stop(); };
  }, [onTranscript]);

  useEffect(() => {
    if (audioBlob && autoPlay) playAudio(audioBlob);
  }, [audioBlob, autoPlay]);

  const toggleMic = useCallback(() => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }, [listening]);

  const playAudio = useCallback((blob: Blob) => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play();
    audioRef.current = audio;
  }, []);

  return (
    <div className="flex items-center gap-1">
      {supported && (
        <button
          onClick={toggleMic}
          className={cn(
            'rounded-lg p-2 transition-colors',
            listening
              ? 'bg-red-500/20 text-red-400 animate-pulse'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          title={listening ? 'Stop listening' : 'Start voice input'}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      )}
      <button
        onClick={() => onAutoPlayToggle?.(!autoPlay)}
        className={cn(
          'rounded-lg p-2 transition-colors',
          autoPlay
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        title={autoPlay ? 'Disable auto-read' : 'Enable auto-read responses'}
      >
        {autoPlay ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
    </div>
  );
}
