import { Megaphone } from 'lucide-react';

const PLATFORMS = [
  { name: 'Mailchimp', description: 'Email lists, campaigns, audience sync' },
  { name: 'SendGrid', description: 'Transactional and marketing email campaigns' },
  { name: 'Constant Contact', description: 'Email lists and campaign management' },
  { name: 'Google Analytics', description: 'Website traffic and conversion reporting' },
  { name: 'Mixpanel', description: 'Product analytics and event tracking' },
  { name: 'Google Ads', description: 'Ad campaign performance data' },
  { name: 'Meta Ads', description: 'Facebook/Instagram ad campaign data' },
  { name: 'Microsoft Ads', description: 'Bing ad campaign performance data' },
];

export default function MarketingPage() {
  return (
    <div>
      <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Marketing</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Marketing platform integrations, campaign data, and analytics
        </p>
      </div>

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map((p) => (
            <div key={p.name} className="rounded-lg p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-hover)' }}>
                  <Megaphone size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                </div>
              </div>
              <button
                className="w-full text-xs py-2 rounded"
                style={{ background: 'rgba(45,212,191,0.1)', color: 'var(--accent)', border: '1px solid rgba(45,212,191,0.2)' }}
              >
                Configure
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
