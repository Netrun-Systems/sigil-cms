import { useState, useEffect } from 'react';
import { Panel } from '../components/common/Panel';
import { MetricCard } from '../components/common/MetricCard';
import { useApi } from '../services/api';

export default function ShiftsCalendarPage() {
  const api = useApi();
  const [shifts, setShifts] = useState<any[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newShift, setNewShift] = useState({ shift_date: '', start_time: '', end_time: '', role: 'floor', notes: '' });
  const [artists, setArtists] = useState<any[]>([]);

  const getWeekDates = () => {
    const start = new Date();
    start.setDate(start.getDate() + weekOffset * 7 - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };

  const weekDates = getWeekDates();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    api.get(`/shifts?from=${weekDates[0]}&to=${weekDates[6]}`).then((r: any) => setShifts(r.items || []));
    api.get('/consignment/artists?status=active').then((r: any) => setArtists(r.items || []));
  }, [weekOffset]);

  const createShift = async () => {
    if (!newShift.shift_date || !newShift.start_time || !newShift.end_time) return;
    await api.post('/shifts', newShift);
    setShowCreateForm(false);
    setNewShift({ shift_date: '', start_time: '', end_time: '', role: 'floor', notes: '' });
    api.get(`/shifts?from=${weekDates[0]}&to=${weekDates[6]}`).then((r: any) => setShifts(r.items || []));
  };

  const deleteShift = async (id: string) => {
    if (!confirm('Delete this shift?')) return;
    await api.delete(`/shifts/${id}`);
    setShifts(shifts.filter(s => s.id !== id));
  };

  const claimedCount = shifts.filter(s => s.status === 'claimed').length;
  const openCount = shifts.filter(s => s.status === 'open').length;
  const coverageCount = shifts.filter(s => s.status === 'coverage_requested').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shift Calendar</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          + New Shift
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Claimed" value={claimedCount} color="green" />
        <MetricCard label="Open" value={openCount} color="yellow" />
        <MetricCard label="Need Coverage" value={coverageCount} color="red" />
      </div>

      {showCreateForm && (
        <Panel title="Create Shift">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" value={newShift.shift_date} onChange={e => setNewShift({ ...newShift, shift_date: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={newShift.role} onChange={e => setNewShift({ ...newShift, role: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                <option value="floor">Floor</option>
                <option value="cashier">Cashier</option>
                <option value="gallery">Gallery Attendant</option>
                <option value="workshop">Workshop Lead</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input type="time" value={newShift.start_time} onChange={e => setNewShift({ ...newShift, start_time: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input type="time" value={newShift.end_time} onChange={e => setNewShift({ ...newShift, end_time: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <input type="text" value={newShift.notes} onChange={e => setNewShift({ ...newShift, notes: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Optional notes" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button onClick={createShift} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
              <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
            </div>
          </div>
        </Panel>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-1 bg-gray-200 rounded">&larr; Prev Week</button>
        <span className="font-medium text-gray-700">{weekDates[0]} — {weekDates[6]}</span>
        <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-1 bg-gray-200 rounded">Next Week &rarr;</button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const dayShifts = shifts.filter(s => (s.shift_date?.split?.('T')?.[0] || s.shift_date) === date);
          const isToday = date === new Date().toISOString().split('T')[0];
          return (
            <div key={date} className={`border rounded-lg p-2 min-h-[120px] ${isToday ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
              <div className="text-xs font-medium text-gray-600 mb-1">{dayNames[i]} {date.slice(5)}</div>
              {dayShifts.map(s => (
                <div key={s.id} className={`text-xs p-1 mb-1 rounded ${s.status === 'open' ? 'bg-yellow-100 text-yellow-800' : s.status === 'coverage_requested' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  <div className="font-medium">{s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}</div>
                  <div>{s.assigned_artist_name || 'Open'}</div>
                  <div className="text-gray-600">{s.role}</div>
                  <button onClick={() => deleteShift(s.id)} className="text-red-500 hover:text-red-700 text-xs mt-1">Delete</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
