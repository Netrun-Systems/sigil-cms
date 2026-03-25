import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Save, MessageSquare, Search, Mail, Bot, Megaphone } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface PanelConfig {
  docs_search_enabled: boolean;
  contact_form_enabled: boolean;
  ai_chat_enabled: boolean;
  announcements_enabled: boolean;
  primary_color: string;
  accent_color: string;
  panel_title: string;
  greeting_message: string;
  position: 'bottom-right' | 'bottom-left';
}

const defaultConfig: PanelConfig = {
  docs_search_enabled: true,
  contact_form_enabled: true,
  ai_chat_enabled: false,
  announcements_enabled: true,
  primary_color: '#90b9ab',
  accent_color: '#6b8f83',
  panel_title: 'Help & Support',
  greeting_message: 'How can we help you today?',
  position: 'bottom-right',
};

export function PanelConfigPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [config, setConfig] = useState<PanelConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: PanelConfig }>(`/sites/${siteId}/support/config`);
      if (res.data) setConfig(res.data);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/sites/${siteId}/support/config`, config);
    } catch { /* */ } finally { setSaving(false); }
  };

  const updateField = <K extends keyof PanelConfig>(key: K, value: PanelConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const featureToggles: { key: keyof PanelConfig; label: string; icon: React.ReactNode; description: string }[] = [
    { key: 'docs_search_enabled', label: 'Docs Search', icon: <Search className="h-4 w-4" />, description: 'Allow users to search documentation' },
    { key: 'contact_form_enabled', label: 'Contact Form', icon: <Mail className="h-4 w-4" />, description: 'Show a contact/support form' },
    { key: 'ai_chat_enabled', label: 'AI Chat', icon: <Bot className="h-4 w-4" />, description: 'Enable AI-powered chat assistant' },
    { key: 'announcements_enabled', label: 'Announcements', icon: <Megaphone className="h-4 w-4" />, description: 'Display active announcements' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Panel Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Feature Toggles */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <h2 className="text-lg font-medium">Features</h2>
            {featureToggles.map((ft) => (
              <label key={ft.key} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{ft.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{ft.label}</p>
                    <p className="text-xs text-muted-foreground">{ft.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config[ft.key] as boolean}
                  onClick={() => updateField(ft.key, !config[ft.key] as PanelConfig[typeof ft.key])}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                    config[ft.key] ? 'bg-primary' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
                      config[ft.key] ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <h2 className="text-lg font-medium">Appearance</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-0.5"
                  />
                  <input
                    value={config.primary_color}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Accent Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={config.accent_color}
                    onChange={(e) => updateField('accent_color', e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-0.5"
                  />
                  <input
                    value={config.accent_color}
                    onChange={(e) => updateField('accent_color', e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Panel Title</label>
              <input
                value={config.panel_title}
                onChange={(e) => updateField('panel_title', e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Help & Support"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Greeting Message</label>
              <input
                value={config.greeting_message}
                onChange={(e) => updateField('greeting_message', e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="How can we help you today?"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Position</label>
              <select
                value={config.position}
                onChange={(e) => updateField('position', e.target.value as PanelConfig['position'])}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <h2 className="text-lg font-medium">Preview</h2>
          <div className="relative rounded-lg border border-border bg-muted/30 p-8 min-h-[200px]">
            <div
              className={cn(
                'absolute bottom-4 w-72 rounded-lg border shadow-lg overflow-hidden',
                config.position === 'bottom-right' ? 'right-4' : 'left-4'
              )}
              style={{ borderColor: config.primary_color + '40' }}
            >
              {/* Panel header */}
              <div className="px-4 py-3 text-white text-sm font-medium" style={{ backgroundColor: config.primary_color }}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {config.panel_title}
                </div>
              </div>
              {/* Panel body */}
              <div className="bg-background p-4 space-y-3">
                <p className="text-sm text-muted-foreground">{config.greeting_message}</p>
                <div className="space-y-2">
                  {config.docs_search_enabled && (
                    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                      <Search className="h-3 w-3" /> Search docs...
                    </div>
                  )}
                  {config.announcements_enabled && (
                    <div className="flex items-center gap-2 rounded-md px-3 py-2 text-xs" style={{ backgroundColor: config.accent_color + '15', color: config.accent_color }}>
                      <Megaphone className="h-3 w-3" /> 1 active announcement
                    </div>
                  )}
                  {config.contact_form_enabled && (
                    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> Contact us
                    </div>
                  )}
                  {config.ai_chat_enabled && (
                    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                      <Bot className="h-3 w-3" /> Chat with AI
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
