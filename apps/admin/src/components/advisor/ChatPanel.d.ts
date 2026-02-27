import { type ChatMessage } from './MessageBubble';
interface Props {
    messages: ChatMessage[];
    onSpeak?: (text: string) => void;
}
export declare function ChatPanel({ messages, onSpeak }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ChatPanel.d.ts.map