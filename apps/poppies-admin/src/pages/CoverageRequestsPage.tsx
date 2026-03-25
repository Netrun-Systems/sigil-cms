import { useState, useEffect } from 'react';
import { Panel } from '../components/common/Panel';
import { useApi } from '../services/api';

export default function CoverageRequestsPage() {
  const api = useApi();
  const [requests, setRequests] = useState<any[]>([]);
  const [currentArtistId] = useState<string | null>(localStorage.getItem('poppies_artist_id'));

  useEffect(() => {
    api.get('/shifts/coverage?status=open').then((r: any) => setRequests(r.items || []));
  }, []);

  const acceptCoverage = async (requestId: string) => {
    if (!currentArtistId) return alert('Set your artist profile first');
    await api.post(`/shifts/coverage/${requestId}/accept`, { artist_id: currentArtistId });
    setRequests(requests.filter(r => r.id !== requestId));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Coverage Requests</h1>
      <p className="text-gray-600">Artists who need someone to cover their shift.</p>

      {requests.length === 0 ? (
        <Panel title="No Open Requests">
          <p className="text-gray-600">All shifts are covered.</p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="border border-orange-300 bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{r.requesting_artist_name} needs coverage</div>
                  <div className="text-gray-700">{r.shift_date?.split?.('T')?.[0] || r.shift_date} — {r.start_time?.slice(0, 5)} to {r.end_time?.slice(0, 5)}</div>
                  <div className="text-sm text-gray-600">{r.role}</div>
                  {r.reason && <div className="text-sm text-gray-500 mt-1 italic">"{r.reason}"</div>}
                </div>
                <button onClick={() => acceptCoverage(r.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                  I'll Take It
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
