export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isStreaming?: boolean;
}
interface Props {
    message: ChatMessage;
    onSpeak?: (text: string) => void;
}
export declare function MessageBubble({ message, onSpeak }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=MessageBubble.d.ts.map