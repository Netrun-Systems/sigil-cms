import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@netrun-cms/ui';
export function VoiceControls({ onTranscript, audioBlob, autoPlay = false, onAutoPlayToggle }) {
    const [listening, setListening] = useState(false);
    const [supported, setSupported] = useState(true);
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
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
        recognition.onresult = (event) => {
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
        if (audioBlob && autoPlay)
            playAudio(audioBlob);
    }, [audioBlob, autoPlay]);
    const toggleMic = useCallback(() => {
        if (!recognitionRef.current)
            return;
        if (listening) {
            recognitionRef.current.stop();
            setListening(false);
        }
        else {
            recognitionRef.current.start();
            setListening(true);
        }
    }, [listening]);
    const playAudio = useCallback((blob) => {
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
    return (_jsxs("div", { className: "flex items-center gap-1", children: [supported && (_jsx("button", { onClick: toggleMic, className: cn('rounded-lg p-2 transition-colors', listening
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'), title: listening ? 'Stop listening' : 'Start voice input', children: listening ? _jsx(MicOff, { className: "h-4 w-4" }) : _jsx(Mic, { className: "h-4 w-4" }) })), _jsx("button", { onClick: () => onAutoPlayToggle?.(!autoPlay), className: cn('rounded-lg p-2 transition-colors', autoPlay
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'), title: autoPlay ? 'Disable auto-read' : 'Enable auto-read responses', children: autoPlay ? _jsx(Volume2, { className: "h-4 w-4" }) : _jsx(VolumeX, { className: "h-4 w-4" }) })] }));
}
//# sourceMappingURL=VoiceControls.js.map