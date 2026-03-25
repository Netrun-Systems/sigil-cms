import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../services/api';

export default function ChatroomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const api = useApi();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const artistId = localStorage.getItem('poppies_artist_id');
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const loadMessages = async (before?: string) => {
    const q = before ? `?before=${before}&limit=50` : '?limit=50';
    const r = await api.get(`/messaging/${roomId}/messages${q}`);
    if (before) {
      setMessages(prev => [...(r.items || []), ...prev]);
    } else {
      setMessages(r.items || []);
    }
    setHasMore(r.hasMore || false);
  };

  useEffect(() => {
    if (!roomId) return;
    loadMessages();
    api.get(`/messaging/rooms/${roomId}/members`).then((r: any) => setMembers(r.items || []));
    // Mark as read
    if (artistId) api.post(`/messaging/${roomId}/read`, { artist_id: artistId });

    // Poll for new messages every 5 seconds
    pollRef.current = setInterval(async () => {
      const r = await api.get(`/messaging/${roomId}/messages?limit=50`);
      setMessages(r.items || []);
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !artistId) return;
    await api.post(`/messaging/${roomId}/messages`, { sender_id: artistId, body: newMessage.trim() });
    setNewMessage('');
    loadMessages(); // Refresh
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group messages by date
  let lastDate = '';

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chat</h1>
          <div className="text-sm text-gray-600">{members.length} members</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 px-2">
        {hasMore && (
          <button onClick={() => messages.length && loadMessages(messages[0]?.created_at)} className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 py-2">
            Load older messages
          </button>
        )}
        {messages.map(msg => {
          const msgDate = formatDate(msg.created_at);
          const showDate = msgDate !== lastDate;
          lastDate = msgDate;
          const isMe = msg.sender_id === artistId;

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center text-xs text-gray-500 py-2 font-medium">{msgDate}</div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                <div className={`max-w-[70%] rounded-lg px-3 py-2 ${isMe ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {!isMe && <div className="text-xs font-semibold mb-0.5">{msg.sender_name}</div>}
                  <div className="text-sm whitespace-pre-wrap break-words">{msg.body}</div>
                  <div className={`text-xs mt-0.5 ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {formatTime(msg.created_at)}
                    {msg.edited_at && ' (edited)'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={sendMessage} disabled={!newMessage.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
