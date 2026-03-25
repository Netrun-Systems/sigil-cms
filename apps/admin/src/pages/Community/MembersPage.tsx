import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Users, Search, Trophy, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Member {
  id: string;
  display_name: string;
  email: string;
  role: 'member' | 'moderator' | 'admin';
  reputation: number;
  post_count: number;
  joined_at: string;
  last_active_at: string | null;
  is_banned: boolean;
}

interface LeaderboardEntry {
  id: string;
  display_name: string;
  reputation: number;
}

const roleBadgeColors: Record<string, string> = {
  member: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
  moderator: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  admin: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
};

const roleIcons: Record<string, React.ReactNode> = {
  member: <Shield className="h-3 w-3" />,
  moderator: <ShieldCheck className="h-3 w-3" />,
  admin: <ShieldAlert className="h-3 w-3" />,
};

export function MembersPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [bannedFilter, setBannedFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (bannedFilter) params.set('banned', 'true');
      if (searchQuery) params.set('q', searchQuery);
      const qs = params.toString() ? `?${params}` : '';
      const res = await api.get<{ data: Member[]; leaderboard: LeaderboardEntry[] }>(`/sites/${siteId}/community/members${qs}`);
      setMembers(res.data ?? []);
      if (res.leaderboard) setLeaderboard(res.leaderboard);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [siteId, roleFilter, bannedFilter, searchQuery]);

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await api.patch(`/sites/${siteId}/community/members/${memberId}`, { role });
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: role as Member['role'] } : m));
    } catch { /* */ }
  };

  const handleBanToggle = async (member: Member) => {
    try {
      await api.patch(`/sites/${siteId}/community/members/${member.id}`, { is_banned: !member.is_banned });
      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, is_banned: !m.is_banned } : m));
    } catch { /* */ }
  };

  const totalCount = members.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Community Members</h1>
          <span className="rounded-md bg-muted px-2.5 py-0.5 text-sm text-muted-foreground">{totalCount}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Roles</option>
          <option value="member">Member</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={bannedFilter}
            onChange={(e) => setBannedFilter(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Banned only
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Members Table */}
        <div>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Users className="h-8 w-8" />
              <p className="text-sm">No members found</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Role</th>
                    <th className="text-center px-4 py-2 font-medium text-muted-foreground">Rep</th>
                    <th className="text-center px-4 py-2 font-medium text-muted-foreground">Posts</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Last Active</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className={cn('border-b border-border last:border-0 hover:bg-muted/20', member.is_banned && 'opacity-60')}>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.display_name}</span>
                          {member.is_banned && (
                            <span className="rounded-md border border-red-500/50 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">BANNED</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{member.email}</td>
                      <td className="px-4 py-2">
                        <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs capitalize border', roleBadgeColors[member.role] || '')}>
                          {roleIcons[member.role]}
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center font-medium">{member.reputation}</td>
                      <td className="px-4 py-2 text-center text-muted-foreground">{member.post_count}</td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(member.joined_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {member.last_active_at ? new Date(member.last_active_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className="flex h-7 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="member">Member</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleBanToggle(member)}
                            className={cn(
                              'rounded-md px-2 py-1 text-xs font-medium border transition-colors',
                              member.is_banned
                                ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                : 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            )}
                          >
                            {member.is_banned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leaderboard Sidebar */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <h2 className="text-sm font-medium">Top Reputation</h2>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <div key={entry.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        'shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                        idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {idx + 1}
                      </span>
                      <span className="truncate">{entry.display_name}</span>
                    </div>
                    <span className="shrink-0 font-medium text-muted-foreground">{entry.reputation}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
