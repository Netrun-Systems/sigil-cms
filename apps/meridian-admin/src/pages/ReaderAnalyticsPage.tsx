/**
 * Reader Analytics overview — aggregated engagement metrics across all flipbooks.
 */

import { BarChart3, Eye, Clock, BookOpen, TrendingUp, Users } from 'lucide-react';

export default function ReaderAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reader Analytics</h1>
        <p className="mt-1 text-gray-600">Track reader engagement across all your flipbooks.</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Users className="w-5 h-5" />} label="Total Sessions" value="--" change="" />
        <MetricCard icon={<Eye className="w-5 h-5" />} label="Pages Viewed" value="--" change="" />
        <MetricCard icon={<Clock className="w-5 h-5" />} label="Avg. Read Time" value="--" change="" />
        <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="Engagement Rate" value="--" change="" />
      </div>

      {/* Per-flipbook table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Flipbook Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Flipbook</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Sessions</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Pages Viewed</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Avg. Time</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Bounce Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                  <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-700">No analytics data yet</p>
                  <p className="text-sm mt-1">Data will appear once readers view your flipbooks.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, change }: { icon: React.ReactNode; label: string; value: string; change: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className="bg-meridian-ice text-meridian-indigo p-2 rounded-lg">{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {change && <span className="text-xs text-green-600 font-medium">{change}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
