import { useState, useEffect } from 'react';
import { FileText, Mail, Brain } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { getTracker, generateCoverLetter, generateOutreach, analyzeRole } from '../services/api';

export default function ApplicationsPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<{ type: string; data: any } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getTracker();
        setEntries(res.data || []);
      } catch (err) { console.error('Failed to load:', err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleAction(trackerId: string, action: 'analyze' | 'cover-letter' | 'outreach') {
    setActionLoading(`${trackerId}-${action}`);
    try {
      let result;
      if (action === 'analyze') result = await analyzeRole(trackerId);
      else if (action === 'cover-letter') result = await generateCoverLetter(trackerId);
      else result = await generateOutreach(trackerId);
      setSelectedResult({ type: action, data: (result as any).data });
    } catch (err) { console.error(`${action} failed:`, err); }
    finally { setActionLoading(null); }
  }

  if (loading) {
    return (
      <div>
        <Header title="Applications" subtitle="Loading..." />
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Applications" subtitle="AI-powered application materials" />

      <div className="p-4 md:p-8 space-y-4">
        {/* Result modal */}
        {selectedResult && (
          <Panel title={`Generated: ${selectedResult.type}`}
            action={<Button size="sm" variant="ghost" onClick={() => setSelectedResult(null)}>Close</Button>}>
            <pre className="text-xs whitespace-pre-wrap font-body"
              style={{ color: 'var(--text-secondary)', maxHeight: '400px', overflow: 'auto' }}>
              {typeof selectedResult.data === 'string'
                ? selectedResult.data
                : JSON.stringify(selectedResult.data, null, 2)}
            </pre>
          </Panel>
        )}

        {/* Entry list with action buttons */}
        {entries.map((entry: any) => (
          <div key={entry.id} className="rounded-xl p-4"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                  {entry.role} at {entry.company}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Status: {entry.status} | Priority: {entry.priority}
                </p>
              </div>
              <Badge label={entry.status} variant="info" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="secondary"
                loading={actionLoading === `${entry.id}-analyze`}
                onClick={() => handleAction(entry.id, 'analyze')}>
                <Brain size={14} /> Analyze JD
              </Button>
              <Button size="sm" variant="secondary"
                loading={actionLoading === `${entry.id}-cover-letter`}
                onClick={() => handleAction(entry.id, 'cover-letter')}>
                <FileText size={14} /> Cover Letter
              </Button>
              <Button size="sm" variant="secondary"
                loading={actionLoading === `${entry.id}-outreach`}
                onClick={() => handleAction(entry.id, 'outreach')}>
                <Mail size={14} /> Outreach
              </Button>
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm">No targets in pipeline. Add targets from the Tracker page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
