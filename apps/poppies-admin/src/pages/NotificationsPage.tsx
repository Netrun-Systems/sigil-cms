import { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const typeIcons: Record<string, string> = {
  coverage_request: 'ArrowLeftRight',
  coverage_accepted: 'Check',
  new_message: 'MessageCircle',
  new_dm: 'Mail',
  shift_reminder: 'Clock',
};

const typeLabels: Record<string, string> = {
  coverage_request: 'Coverage Needed',
  coverage_accepted: 'Coverage Accepted',
  new_message: 'Chat Message',
  new_dm: 'Direct Message',
  shift_reminder: 'Shift Reminder',
};

export default function NotificationsPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const artistId = localStorage.getItem('poppies_artist_id');

  const load = async () => {
    if (!artistId) return;
    const [inbox, count] = await Promise.all([
      api.get(`/notifications/inbox?artist_id=${artistId}&limit=50`),
      api.get(`/notifications/inbox/count?artist_id=${artistId}`),
    ]);
    setNotifications(inbox.items || []);
    setUnreadCount(count.unread || 0);
  };

  useEffect(() => { load(); }, [artistId]);

  const markRead = async (id: string) => {
    await api.post(`/notifications/inbox/${id}/read`, {});
    load();
  };

  const markAllRead = async () => {
    await api.post('/notifications/inbox/read-all', { artist_id: artistId });
    load();
  };

  const handleClick = (notif: any) => {
    if (!notif.is_read) markRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white text-sm font-bold rounded-full px-3 py-0.5">{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <div key={n.id} onClick={() => handleClick(n)} className={`border rounded-lg p-4 cursor-pointer ${n.is_read ? 'border-gray-200 bg-white' : 'border-indigo-200 bg-indigo-50'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-100 rounded px-2 py-0.5">
                    {typeLabels[n.type] || n.type}
                  </span>
                  {!n.is_read && <span className="w-2 h-2 bg-indigo-600 rounded-full" />}
                </div>
                <div className="font-medium text-gray-900 mt-1">{n.title}</div>
                {n.body && <div className="text-sm text-gray-600 mt-0.5">{n.body}</div>}
                <div className="text-xs text-gray-500 mt-1">
                  {formatTime(n.created_at)}
                  {n.channels_sent && n.channels_sent.length > 0 && (
                    <span className="ml-2">via {(JSON.parse(typeof n.channels_sent === 'string' ? n.channels_sent : JSON.stringify(n.channels_sent))).join(', ')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-gray-600 text-center py-8">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
