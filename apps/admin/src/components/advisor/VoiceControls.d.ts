interface Props {
    onTranscript: (text: string) => void;
    audioBlob?: Blob | null;
    autoPlay?: boolean;
    onAutoPlayToggle?: (enabled: boolean) => void;
}
interface SpeechRecognitionEvent extends Event {
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string;
            };
        };
        length: number;
    };
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
export declare function VoiceControls({ onTranscript, audioBlob, autoPlay, onAutoPlayToggle }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=VoiceControls.d.ts.map