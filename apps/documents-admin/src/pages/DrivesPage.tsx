import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardDrive, Plus, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { getDrives, connectMicrosoft, connectGoogle, disconnectDrive, syncDrive } from '../services/api';

export default function DrivesPage() {
  const navigate = useNavigate();
  const [drives, setDrives] = useState<any[]>([]);
  const [providers, setProviders] = useState({ microsoft: false, google: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadDrives();
  }, []);

  async function loadDrives() {
    setLoading(true);
    try {
      const res = await getDrives();
      setDrives(res.data);
      setProviders(res.providers);
    } catch (err) {
      console.error('Failed to load drives:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectMicrosoft() {
    try {
      const redirectUri = `${window.location.origin}/api/v1/documents/drives/callback/microsoft`;
      const res = await connectMicrosoft(redirectUri);
      window.location.href = res.data.authUrl;
    } catch (err) {
      console.error('Failed to initiate Microsoft connection:', err);
    }
  }

  async function handleConnectGoogle() {
    try {
      const redirectUri = `${window.location.origin}/api/v1/documents/drives/callback/google`;
      const res = await connectGoogle(redirectUri);
      window.location.href = res.data.authUrl;
    } catch (err) {
      console.error('Failed to initiate Google connection:', err);
    }
  }

  async function handleDisconnect(driveId: string) {
    if (!confirm('Disconnect this drive? Cached file metadata will be removed.')) return;
    try {
      await disconnectDrive(driveId);
      loadDrives();
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  }

  async function handleSync(driveId: string) {
    setSyncing(driveId);
    try {
      const res = await syncDrive(driveId);
      alert(`Synced ${res.data.synced} files`);
      loadDrives();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(null);
    }
  }

  if (loading) {
    return <div className="p-6"><p style={{ color: 'var(--text-secondary)' }}>Loading drives...</p></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Header
        title="Connected Drives"
        subtitle="Connect Microsoft 365 or Google Workspace to browse and link documents"
      />

      {/* Connect buttons */}
      <div className="flex gap-3 mb-6">
        <Button
          variant="secondary"
          icon={<HardDrive size={14} />}
          onClick={handleConnectMicrosoft}
          disabled={!providers.microsoft}
        >
          {providers.microsoft ? 'Connect Microsoft 365' : 'Microsoft (not configured)'}
        </Button>
        <Button
          variant="secondary"
          icon={<HardDrive size={14} />}
          onClick={handleConnectGoogle}
          disabled={!providers.google}
        >
          {providers.google ? 'Connect Google Workspace' : 'Google (not configured)'}
        </Button>
      </div>

      {/* Connected drives list */}
      <Panel title={`Connected (${drives.length})`}>
        {drives.length > 0 ? (
          <div className="space-y-3">
            {drives.map((drive) => (
              <div
                key={drive.id}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ background: 'var(--bg-input)' }}
              >
                <div className="flex items-center gap-3">
                  <HardDrive
                    size={20}
                    style={{ color: drive.provider === 'microsoft' ? '#0078d4' : '#4285f4' }}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {drive.driveName || drive.provider}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {drive.accountEmail}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Connected {new Date(drive.connectedAt).toLocaleDateString()}
                      {drive.lastSyncAt && ` | Last sync: ${new Date(drive.lastSyncAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Badge variant={drive.provider === 'microsoft' ? 'info' : 'accent'}>
                    {drive.provider}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ExternalLink size={14} />}
                    onClick={() => navigate(`/documents/drives/${drive.id}`)}
                  >
                    Browse
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw size={14} className={syncing === drive.id ? 'animate-spin' : ''} />}
                    onClick={() => handleSync(drive.id)}
                    disabled={syncing === drive.id}
                  >
                    Sync
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={() => handleDisconnect(drive.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <HardDrive size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No drives connected yet. Connect Microsoft 365 or Google Workspace above.
            </p>
          </div>
        )}
      </Panel>

      {/* Info about what's required */}
      {(!providers.microsoft || !providers.google) && (
        <Panel title="Configuration" className="mt-6">
          <div className="text-xs space-y-2" style={{ color: 'var(--text-secondary)' }}>
            {!providers.microsoft && (
              <p>
                <strong>Microsoft 365:</strong> Set <code style={{ color: 'var(--accent)' }}>MICROSOFT_CLIENT_ID</code>,{' '}
                <code style={{ color: 'var(--accent)' }}>MICROSOFT_CLIENT_SECRET</code>, and{' '}
                <code style={{ color: 'var(--accent)' }}>MICROSOFT_TENANT_ID</code> environment variables.
              </p>
            )}
            {!providers.google && (
              <p>
                <strong>Google Workspace:</strong> Set <code style={{ color: 'var(--accent)' }}>GOOGLE_CLIENT_ID</code> and{' '}
                <code style={{ color: 'var(--accent)' }}>GOOGLE_CLIENT_SECRET</code> environment variables.
              </p>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
