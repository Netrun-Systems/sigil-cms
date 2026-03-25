import { useState, useEffect } from 'react';
import { Panel } from '../components/common/Panel';
import { useApi } from '../services/api';

export default function ShiftsTodayPage() {
  const api = useApi();
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    api.get('/shifts/today').then((r: any) => setShifts(r.items || []));
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Today's Shifts — {today}</h1>

      {shifts.length === 0 ? (
        <Panel title="No Shifts Today">
          <p className="text-gray-600">No shifts scheduled for today.</p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {shifts.map(s => (
            <div key={s.id} className={`border rounded-lg p-4 flex items-center justify-between ${s.status === 'open' ? 'border-yellow-300 bg-yellow-50' : s.status === 'coverage_requested' ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
              <div>
                <div className="font-semibold text-lg">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</div>
                <div className="text-gray-700">{s.role}</div>
                {s.notes && <div className="text-sm text-gray-500 mt-1">{s.notes}</div>}
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${s.status === 'open' ? 'text-yellow-700' : s.status === 'coverage_requested' ? 'text-red-700' : 'text-green-700'}`}>
                  {s.status === 'open' ? 'OPEN' : s.status === 'coverage_requested' ? 'NEEDS COVERAGE' : 'CLAIMED'}
                </div>
                <div className="text-lg font-semibold text-gray-900">{s.assigned_artist_name || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
