/**
 * Meridian Publishing Dashboard — Overview of publications, flipbooks, and reader engagement.
 */

import { BookOpen, Layers, BarChart3, TrendingUp, Eye, Clock } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Publishing Dashboard</h1>
        <p className="mt-1 text-gray-600">Manage your digital publications and track reader engagement.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Publications" value="--" color="bg-meridian-navy" />
        <StatCard icon={<Layers className="w-5 h-5" />} label="Flipbooks" value="--" color="bg-meridian-indigo" />
        <StatCard icon={<Eye className="w-5 h-5" />} label="Total Views" value="--" color="bg-meridian-sky" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Avg. Read Time" value="--" color="bg-meridian-steel" />
      </div>

      {/* Recent publications */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Publications</h2>
          <a href="/publications/new" className="text-sm font-medium text-meridian-indigo hover:text-meridian-navy">
            + New Publication
          </a>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center py-8 text-gray-600">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No publications yet</p>
            <p className="text-sm mt-1">Create your first publication to get started.</p>
          </div>
        </div>
      </section>

      {/* Top performing flipbooks */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Flipbooks</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center py-8 text-gray-600">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No analytics data yet</p>
            <p className="text-sm mt-1">Reader engagement data will appear here once your flipbooks are viewed.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`${color} text-white p-2 rounded-lg`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
