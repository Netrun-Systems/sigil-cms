import { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function DirectMessagesPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [showNewDM, setShowNewDM] = useState(false);
  const artistId = localStorage.getItem('poppies_artist_id');

  useEffect(() => {
    if (!artistId) return;
    api.get(`/messaging/dm/${artistId}`).then((r: any) => setConversations(r.items || []));
    api.get('/consignment/artists?status=active').then((r: any) => setArtists(r.items || []));
  }, [artistId]);

  const startDM = async (recipientId: string) => {
    const room = await api.post('/messaging/dm', { artist_id: artistId, recipient_id: recipientId });
    navigate(`/messaging/rooms/${room.id}`);
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Direct Messages</h1>
        <button onClick={() => setShowNewDM(!showNewDM)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          + New Message
        </button>
      </div>

      {showNewDM && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-3">Send a message to:</h3>
          <div className="grid grid-cols-2 gap-2">
            {artists.filter(a => a.id !== artistId).map(a => (
              <button key={a.id} onClick={() => startDM(a.id)} className="text-left border border-gray-200 rounded-lg p-3 hover:bg-white hover:border-indigo-300">
                <div className="font-medium text-gray-900">{a.artist_name}</div>
                {a.email && <div className="text-xs text-gray-500">{a.email}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {conversations.map(conv => (
          <div key={conv.id} onClick={() => navigate(`/messaging/rooms/${conv.id}`)} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{conv.other_artist_name || conv.name}</span>
                {parseInt(conv.unread_count) > 0 && (
                  <span className="bg-indigo-600 text-white text-xs font-bold rounded-full px-2 py-0.5">{conv.unread_count}</span>
                )}
              </div>
              {conv.last_message && (
                <div className="text-sm text-gray-600 truncate mt-1">{conv.last_message}</div>
              )}
            </div>
            <div className="text-xs text-gray-500 ml-4 flex-shrink-0">{formatTime(conv.updated_at)}</div>
          </div>
        ))}
        {conversations.length === 0 && artistId && (
          <p className="text-gray-600 text-center py-8">No conversations yet. Start a new message above.</p>
        )}
      </div>
    </div>
  );
}
