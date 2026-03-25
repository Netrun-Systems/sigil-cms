import { useState, useEffect } from 'react';
import { Panel } from '../components/common/Panel';
import { useApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ChatroomsPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '' });
  const artistId = localStorage.getItem('poppies_artist_id');

  useEffect(() => {
    if (!artistId) return;
    api.get(`/messaging/rooms?artist_id=${artistId}`).then((r: any) => setRooms(r.items || []));
  }, [artistId]);

  const createRoom = async () => {
    if (!newRoom.name.trim()) return;
    const room = await api.post('/messaging/rooms', newRoom);
    setShowCreate(false);
    setNewRoom({ name: '', description: '' });
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
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          + New Room
        </button>
      </div>

      {!artistId && (
        <Panel title="Set Your Profile">
          <p className="text-gray-600">Save your artist ID to localStorage as 'poppies_artist_id' to use messaging.</p>
        </Panel>
      )}

      {showCreate && (
        <Panel title="Create Chatroom">
          <div className="space-y-3">
            <input type="text" placeholder="Room name (e.g., General)" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm" />
            <input type="text" placeholder="Description (optional)" value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm" />
            <div className="flex gap-2">
              <button onClick={createRoom} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
            </div>
          </div>
        </Panel>
      )}

      <div className="space-y-2">
        {rooms.map(room => (
          <div key={room.id} onClick={() => navigate(`/messaging/rooms/${room.id}`)} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{room.name}</span>
                {parseInt(room.unread_count) > 0 && (
                  <span className="bg-indigo-600 text-white text-xs font-bold rounded-full px-2 py-0.5">{room.unread_count}</span>
                )}
              </div>
              {room.last_message && (
                <div className="text-sm text-gray-600 truncate mt-1">
                  {room.last_message_sender && <span className="font-medium">{room.last_message_sender}: </span>}
                  {room.last_message}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 ml-4 flex-shrink-0">{formatTime(room.last_message_at)}</div>
          </div>
        ))}
        {rooms.length === 0 && artistId && (
          <p className="text-gray-600 text-center py-8">No chatrooms yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
