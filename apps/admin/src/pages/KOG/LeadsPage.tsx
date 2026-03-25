import { Fragment, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search, Loader2, Users, Settings, RefreshCw, ChevronDown, ChevronRight,
  Phone, Mail, CheckCircle2, AlertCircle, TrendingUp, Calendar,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  capturedAt: string;
  activities?: Activity[];
}

interface Activity {
  id: string;
  type: 'call' | 'email' | 'task';
  subject: string;
  date: string;
  notes: string | null;
}

interface KOGStats {
  totalLeads: number;
  leadsThisMonth: number;
  conversionRate: number;
}

interface KOGContact {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

const statusColors: Record<Lead['status'], string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  qualified: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  converted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  lost: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const activityIcons: Record<Activity['type'], React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  task: CheckCircle2,
};

export function LeadsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const basePath = `/sites/${siteId}`;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<KOGStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [loadingActivities, setLoadingActivities] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<KOGContact[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes, configRes] = await Promise.all([
        api.get<{ data: Lead[] }>(`${basePath}/kog/leads`),
        api.get<{ data: KOGStats }>(`${basePath}/kog/stats`),
        api.get<{ data: { connected: boolean; lastSync: string | null; apiUrl: string } }>(`${basePath}/kog/config`),
      ]);
      setLeads(leadsRes.data ?? []);
      setStats(statsRes.data ?? null);
      if (configRes.data) {
        setConnected(configRes.data.connected);
        setLastSync(configRes.data.lastSync);
        setApiUrl(configRes.data.apiUrl ?? '');
      }
    } catch {
      // graceful empty state
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  useEffect(() => { load(); }, [load]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await api.post<{ data: { connected: boolean } }>(`${basePath}/kog/test-connection`, {});
      setConnected(res.data?.connected ?? false);
    } catch {
      setConnected(false);
    } finally {
      setTesting(false);
    }
  };

  const handleExpandLead = async (leadId: string) => {
    if (expandedLead === leadId) {
      setExpandedLead(null);
      return;
    }
    setExpandedLead(leadId);
    const lead = leads.find((l) => l.id === leadId);
    if (lead?.activities) return;

    setLoadingActivities(leadId);
    try {
      const res = await api.get<{ data: Activity[] }>(`${basePath}/kog/leads/${leadId}/activities`);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, activities: res.data ?? [] } : l))
      );
    } catch {
      // keep without activities
    } finally {
      setLoadingActivities(null);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get<{ data: KOGContact[] }>(
        `${basePath}/kog/contacts/search?q=${encodeURIComponent(search)}`
      );
      setSearchResults(res.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">CRM Leads</h1>
        <button
          onClick={load}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Settings className="h-4 w-4" /> Sync Settings
        </button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'h-3 w-3 rounded-full',
                  connected === true ? 'bg-green-500' : connected === false ? 'bg-red-500' : 'bg-gray-400'
                )}
              />
              <div>
                <p className="text-sm font-medium">
                  KOG API {connected === true ? 'Connected' : connected === false ? 'Disconnected' : 'Unknown'}
                </p>
                {lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Last sync: {new Date(lastSync).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex h-8 items-center gap-2 rounded-md border border-input px-3 text-sm transition-colors hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', testing && 'animate-spin')} />
              Test Connection
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalLeads}</p>
                  <p className="text-xs text-muted-foreground">Total Leads Captured</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.leadsThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Leads This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search KOG Contacts */}
      <Card>
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-medium">Search KOG Contacts</p>
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search contacts by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm transition-colors hover:bg-accent disabled:opacity-50"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 divide-y divide-border rounded-md border border-border">
              {searchResults.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{contact.name}</span>
                  <span className="text-muted-foreground">{contact.email}</span>
                  {contact.company && (
                    <span className="text-muted-foreground">— {contact.company}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Leads Table */}
      {leads.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Users className="h-8 w-8" />
          <p className="text-sm">No leads captured yet</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-8 px-3 py-3"></th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Company</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Source</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const isExpanded = expandedLead === lead.id;
                  return (
                    <Fragment key={lead.id}>
                      <tr
                        className="group cursor-pointer border-b border-border last:border-0 hover:bg-accent/50"
                        onClick={() => handleExpandLead(lead.id)}
                      >
                        <td className="px-3 py-4 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{lead.name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{lead.email}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{lead.company ?? '—'}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {lead.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(lead.capturedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium capitalize', statusColors[lead.status])}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-border last:border-0">
                          <td colSpan={7} className="bg-muted/30 px-10 py-4">
                            {loadingActivities === lead.id ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading activities...
                              </div>
                            ) : !lead.activities || lead.activities.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No activities recorded in KOG</p>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  KOG Activities
                                </p>
                                {lead.activities.map((activity) => {
                                  const Icon = activityIcons[activity.type] ?? CheckCircle2;
                                  return (
                                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                                      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <span className="font-medium">{activity.subject}</span>
                                        <span className="ml-2 text-muted-foreground">
                                          {new Date(activity.date).toLocaleDateString()}
                                        </span>
                                        {activity.notes && (
                                          <p className="mt-0.5 text-muted-foreground">{activity.notes}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Config Section */}
      <Card>
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-medium">Configuration</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">KOG API URL (set via environment)</label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                {apiUrl || 'Not configured'}
              </div>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="mt-4 flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm transition-colors hover:bg-accent disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertCircle className="h-3.5 w-3.5" />}
              Test
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

