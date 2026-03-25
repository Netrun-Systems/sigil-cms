import { useState, useEffect } from 'react';
import { Panel } from '../components/common/Panel';
import { useApi } from '../services/api';

export default function NotificationSettingsPage() {
  const api = useApi();
  const artistId = localStorage.getItem('poppies_artist_id');
  const [prefs, setPrefs] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: false,
    email_address: '',
    phone_number: '',
    quiet_hours_start: '',
    quiet_hours_end: '',
    shift_reminders: true,
    coverage_requests: true,
    new_messages: true,
    new_dm: true,
  });
  const [saved, setSaved] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    if (!artistId) return;
    api.get(`/notifications/preferences/${artistId}`).then((r: any) => {
      setPrefs(prev => ({ ...prev, ...r }));
    });
    setPushSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, [artistId]);

  const save = async () => {
    await api.put(`/notifications/preferences/${artistId}`, prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const subscribePush = async () => {
    try {
      const vapidRes = await api.get('/notifications/push/vapid-public-key');
      if (!vapidRes.publicKey) return alert('Push notifications not configured on server');

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidRes.publicKey,
      });

      const keys = sub.toJSON().keys!;
      await api.post('/notifications/push/subscribe', {
        artist_id: artistId,
        endpoint: sub.endpoint,
        p256dh_key: keys.p256dh,
        auth_key: keys.auth,
        user_agent: navigator.userAgent,
      });

      setPrefs(prev => ({ ...prev, push_enabled: true }));
      alert('Push notifications enabled for this device');
    } catch (err: any) {
      alert('Failed to enable push: ' + err.message);
    }
  };

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-700">{label}</span>
      <button onClick={() => onChange(!value)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-300'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>

      <Panel title="Channels">
        <div className="divide-y divide-gray-100">
          <Toggle label="Email notifications" value={prefs.email_enabled} onChange={v => setPrefs({ ...prefs, email_enabled: v })} />
          {prefs.email_enabled && (
            <div className="py-2">
              <label className="block text-sm text-gray-600">Email address (leave blank to use profile email)</label>
              <input type="email" value={prefs.email_address || ''} onChange={e => setPrefs({ ...prefs, email_address: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" placeholder="Override email" />
            </div>
          )}
          <Toggle label="SMS / text notifications" value={prefs.sms_enabled} onChange={v => setPrefs({ ...prefs, sms_enabled: v })} />
          {prefs.sms_enabled && (
            <div className="py-2">
              <label className="block text-sm text-gray-600">Phone number</label>
              <input type="tel" value={prefs.phone_number || ''} onChange={e => setPrefs({ ...prefs, phone_number: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" placeholder="+1 (555) 123-4567" />
            </div>
          )}
          <Toggle label="Push notifications (this device)" value={prefs.push_enabled} onChange={v => setPrefs({ ...prefs, push_enabled: v })} />
          {pushSupported && !prefs.push_enabled && (
            <div className="py-2">
              <button onClick={subscribePush} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Enable push for this device
              </button>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Notification Types">
        <div className="divide-y divide-gray-100">
          <Toggle label="Shift reminders" value={prefs.shift_reminders} onChange={v => setPrefs({ ...prefs, shift_reminders: v })} />
          <Toggle label="Coverage requests" value={prefs.coverage_requests} onChange={v => setPrefs({ ...prefs, coverage_requests: v })} />
          <Toggle label="Chatroom messages" value={prefs.new_messages} onChange={v => setPrefs({ ...prefs, new_messages: v })} />
          <Toggle label="Direct messages" value={prefs.new_dm} onChange={v => setPrefs({ ...prefs, new_dm: v })} />
        </div>
      </Panel>

      <Panel title="Quiet Hours">
        <p className="text-sm text-gray-600 mb-3">External notifications (email, SMS, push) are paused during quiet hours. In-app notifications still appear.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start</label>
            <input type="time" value={prefs.quiet_hours_start || ''} onChange={e => setPrefs({ ...prefs, quiet_hours_start: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End</label>
            <input type="time" value={prefs.quiet_hours_end || ''} onChange={e => setPrefs({ ...prefs, quiet_hours_end: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>
      </Panel>

      <div className="flex items-center gap-3">
        <button onClick={save} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
          Save Settings
        </button>
        {saved && <span className="text-green-600 font-medium">Saved!</span>}
      </div>
    </div>
  );
}
