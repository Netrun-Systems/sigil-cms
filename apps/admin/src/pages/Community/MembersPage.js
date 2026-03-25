import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Users, Search, Trophy, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const roleBadgeColors = {
    member: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
    moderator: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    admin: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
};
const roleIcons = {
    member: _jsx(Shield, { className: "h-3 w-3" }),
    moderator: _jsx(ShieldCheck, { className: "h-3 w-3" }),
    admin: _jsx(ShieldAlert, { className: "h-3 w-3" }),
};
export function MembersPage() {
    const { siteId } = useParams();
    const [members, setMembers] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('');
    const [bannedFilter, setBannedFilter] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (roleFilter)
                params.set('role', roleFilter);
            if (bannedFilter)
                params.set('banned', 'true');
            if (searchQuery)
                params.set('q', searchQuery);
            const qs = params.toString() ? `?${params}` : '';
            const res = await api.get(`/sites/${siteId}/community/members${qs}`);
            setMembers(res.data ?? []);
            if (res.leaderboard)
                setLeaderboard(res.leaderboard);
        }
        catch { /* */ }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId, roleFilter, bannedFilter, searchQuery]);
    const handleRoleChange = async (memberId, role) => {
        try {
            await api.patch(`/sites/${siteId}/community/members/${memberId}`, { role });
            setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: role } : m));
        }
        catch { /* */ }
    };
    const handleBanToggle = async (member) => {
        try {
            await api.patch(`/sites/${siteId}/community/members/${member.id}`, { is_banned: !member.is_banned });
            setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, is_banned: !m.is_banned } : m));
        }
        catch { /* */ }
    };
    const totalCount = members.length;
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Community Members" }), _jsx("span", { className: "rounded-md bg-muted px-2.5 py-0.5 text-sm text-muted-foreground", children: totalCount })] }) }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "relative flex-1 min-w-[200px] max-w-sm", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx("input", { value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search members...", className: "flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("select", { value: roleFilter, onChange: (e) => setRoleFilter(e.target.value), className: "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "", children: "All Roles" }), _jsx("option", { value: "member", children: "Member" }), _jsx("option", { value: "moderator", children: "Moderator" }), _jsx("option", { value: "admin", children: "Admin" })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: bannedFilter, onChange: (e) => setBannedFilter(e.target.checked), className: "h-4 w-4 rounded border-input" }), "Banned only"] })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-[1fr_280px]", children: [_jsx("div", { children: loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : members.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Users, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No members found" })] })) : (_jsx("div", { className: "rounded-lg border border-border overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border bg-muted/30", children: [_jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Name" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Email" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Role" }), _jsx("th", { className: "text-center px-4 py-2 font-medium text-muted-foreground", children: "Rep" }), _jsx("th", { className: "text-center px-4 py-2 font-medium text-muted-foreground", children: "Posts" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Joined" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Last Active" }), _jsx("th", { className: "text-right px-4 py-2 font-medium text-muted-foreground", children: "Actions" })] }) }), _jsx("tbody", { children: members.map((member) => (_jsxs("tr", { className: cn('border-b border-border last:border-0 hover:bg-muted/20', member.is_banned && 'opacity-60'), children: [_jsx("td", { className: "px-4 py-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium", children: member.display_name }), member.is_banned && (_jsx("span", { className: "rounded-md border border-red-500/50 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400", children: "BANNED" }))] }) }), _jsx("td", { className: "px-4 py-2 text-muted-foreground", children: member.email }), _jsx("td", { className: "px-4 py-2", children: _jsxs("span", { className: cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs capitalize border', roleBadgeColors[member.role] || ''), children: [roleIcons[member.role], member.role] }) }), _jsx("td", { className: "px-4 py-2 text-center font-medium", children: member.reputation }), _jsx("td", { className: "px-4 py-2 text-center text-muted-foreground", children: member.post_count }), _jsx("td", { className: "px-4 py-2 text-muted-foreground", children: new Date(member.joined_at).toLocaleDateString() }), _jsx("td", { className: "px-4 py-2 text-muted-foreground", children: member.last_active_at ? new Date(member.last_active_at).toLocaleDateString() : '-' }), _jsx("td", { className: "px-4 py-2", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsxs("select", { value: member.role, onChange: (e) => handleRoleChange(member.id, e.target.value), className: "flex h-7 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "member", children: "Member" }), _jsx("option", { value: "moderator", children: "Moderator" }), _jsx("option", { value: "admin", children: "Admin" })] }), _jsx("button", { onClick: () => handleBanToggle(member), className: cn('rounded-md px-2 py-1 text-xs font-medium border transition-colors', member.is_banned
                                                                    ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                                                    : 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'), children: member.is_banned ? 'Unban' : 'Ban' })] }) })] }, member.id))) })] }) })) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Trophy, { className: "h-4 w-4 text-yellow-400" }), _jsx("h2", { className: "text-sm font-medium", children: "Top Reputation" })] }), leaderboard.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground", children: "No data yet" })) : (_jsx("div", { className: "space-y-2", children: leaderboard.map((entry, idx) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("span", { className: cn('shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold', idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                            idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                                                                idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                                    'bg-muted text-muted-foreground'), children: idx + 1 }), _jsx("span", { className: "truncate", children: entry.display_name })] }), _jsx("span", { className: "shrink-0 font-medium text-muted-foreground", children: entry.reputation })] }, entry.id))) }))] }) })] })] }));
}
//# sourceMappingURL=MembersPage.js.map