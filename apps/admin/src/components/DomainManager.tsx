/**
 * Domain Manager
 *
 * UI for configuring and verifying custom domains on a Sigil CMS site.
 */

import { useState } from 'react';
import { Globe, CheckCircle2, XCircle, Loader2, Trash2, ExternalLink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Separator,
  cn,
} from '@netrun-cms/ui';
import { api } from '../lib/api';

interface DomainVerification {
  domain: string;
  verified: boolean;
  records: string[];
  expected: string;
}

interface DomainManagerProps {
  siteId: string;
  currentDomain: string;
  onDomainChange: (domain: string) => void;
}

export function DomainManager({ siteId, currentDomain, onDomainChange }: DomainManagerProps) {
  const [domain, setDomain] = useState(currentDomain || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState<DomainVerification | null>(null);

  const handleSave = async () => {
    if (!domain.trim()) return;
    setIsSaving(true);
    setError(null);
    setVerification(null);
    try {
      await api.put(`/sites/${siteId}/domain`, { domain: domain.trim().toLowerCase() });
      onDomainChange(domain.trim().toLowerCase());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save domain');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);
    try {
      const res = await api.get<{ data: DomainVerification }>(`/sites/${siteId}/domain/verify`);
      setVerification(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to verify domain');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove the custom domain from this site?')) return;
    setIsRemoving(true);
    setError(null);
    setVerification(null);
    try {
      await api.delete(`/sites/${siteId}/domain`);
      setDomain('');
      onDomainChange('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove domain');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Custom Domain
        </CardTitle>
        <CardDescription>
          Connect your own domain to this site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Domain Input */}
        <div className="space-y-2">
          <Label htmlFor="custom-domain">Domain</Label>
          <div className="flex gap-2">
            <Input
              id="custom-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1"
            />
            <Button onClick={handleSave} disabled={isSaving || !domain.trim()}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
          {currentDomain ? (
            <p className="text-sm text-muted-foreground">
              Current domain: <span className="font-medium">{currentDomain}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No custom domain configured</p>
          )}
        </div>

        {/* Actions for existing domain */}
        {currentDomain && (
          <>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleVerify} disabled={isVerifying}>
                {isVerifying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="mr-2 h-4 w-4" />
                )}
                Verify DNS
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a
                  href={`https://${currentDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open site"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Remove
              </Button>
            </div>

            {/* Verification Result */}
            {verification && (
              <div
                className={cn(
                  'rounded-lg border p-4 space-y-2',
                  verification.verified
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-yellow-500/50 bg-yellow-500/10'
                )}
              >
                <div className="flex items-center gap-2">
                  {verification.verified ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-700">DNS verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-700">DNS not yet pointing to Sigil</span>
                    </>
                  )}
                </div>
                {verification.records.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">Current records:</p>
                    <ul className="list-disc list-inside">
                      {verification.records.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!verification.verified && (
                  <p className="text-sm text-muted-foreground">
                    Expected target: <code className="rounded bg-muted px-1 py-0.5">{verification.expected}</code>
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <Separator />

        {/* Setup Instructions */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">Point your domain to Sigil:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>
              Add a CNAME record: <code className="rounded bg-muted px-1 py-0.5">your-domain.com</code>{' '}
              &rarr; <code className="rounded bg-muted px-1 py-0.5">sigil.netrunsystems.com</code>
            </li>
            <li>Wait for DNS propagation (up to 48 hours)</li>
            <li>Click "Verify DNS" to confirm</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
