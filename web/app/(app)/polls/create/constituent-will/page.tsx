'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { useNotificationActions } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';

import { useI18n } from '@/hooks/useI18n';

type BillPackage = {
  packageId: string;
  title: string;
  lastModified?: string;
  packageLink?: string;
};

export default function CreateConstituentWillPollPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const { addNotification } = useNotificationActions();

  const [representativeId, setRepresentativeId] = useState<string>('');
  const [representativeName, setRepresentativeName] = useState<string | null>(null);
  const [billQuery, setBillQuery] = useState('');
  const [congress, setCongress] = useState('119');
  const [searchResults, setSearchResults] = useState<BillPackage[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillPackage | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentRoute('/polls/create/constituent-will');
    setSidebarActiveSection('polls');
    setBreadcrumbs([
      { label: t('polls.page.breadcrumbs.polls') || 'Polls', href: '/polls' },
      { label: t('polls.create.page.title') || 'Create Poll', href: '/polls/create' },
      { label: 'Bill vote poll', href: '/polls/create/constituent-will' },
    ]);
    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection, t]);

  const repIdFromUrl = searchParams?.get('representative_id') ?? '';
  useEffect(() => {
    if (repIdFromUrl && !representativeId) {
      setRepresentativeId(repIdFromUrl);
      const id = parseInt(repIdFromUrl, 10);
      if (!Number.isNaN(id)) {
        fetch(`/api/v1/civics/representative/${id}?fields=id,name,office`)
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data?.success && data?.data?.representative) {
              setRepresentativeName(data.data.representative.name ?? null);
            }
          })
          .catch(() => { /* ignore fetch errors for rep name */ });
      }
    }
  }, [repIdFromUrl, representativeId]);

  const handleSearch = useCallback(async () => {
    if (!billQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const params = new URLSearchParams({ q: billQuery.trim() });
      if (congress) params.set('congress', congress);
      params.set('page_size', '20');
      const res = await fetch(`/api/bills/search?${params}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data?.data?.packages)) {
        setSearchResults(data.data.packages);
        if (data.data.packages.length === 0) {
          addNotification({
            type: 'info',
            title: 'No bills found',
            message: 'Try different keywords or congress number.',
            duration: 4000,
          });
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Search failed',
          message: data?.error ?? 'Could not search bills.',
          duration: 5000,
        });
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Search failed',
        message: err instanceof Error ? err.message : 'Network error',
        duration: 5000,
      });
    } finally {
      setSearching(false);
    }
  }, [billQuery, congress, addNotification]);

  const handleSelectBill = useCallback((pkg: BillPackage) => {
    setSelectedBill(pkg);
    const repName = representativeName || 'your representative';
    setTitle(`How should ${repName} vote on ${pkg.title}?`);
  }, [representativeName]);

  const handleSubmit = useCallback(async () => {
    const repId = parseInt(representativeId, 10);
    if (Number.isNaN(repId) || repId < 1) {
      addNotification({
        type: 'warning',
        title: 'Representative required',
        message: 'Enter a valid representative ID (from the representative profile page).',
        duration: 5000,
      });
      return;
    }
    if (!selectedBill) {
      addNotification({
        type: 'warning',
        title: 'Bill required',
        message: 'Search and select a bill first.',
        duration: 5000,
      });
      return;
    }
    if (!title.trim()) {
      addNotification({
        type: 'warning',
        title: 'Title required',
        message: 'Enter a poll title.',
        duration: 5000,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/polls/constituent-will', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          representativeId: repId,
          billId: selectedBill.packageId,
          billTitle: selectedBill.title,
          billSummary: undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          addNotification({
            type: 'warning',
            title: 'Sign in required',
            message: 'You must be signed in to create a poll.',
            duration: 5000,
          });
          router.push(`/auth?redirect=${encodeURIComponent('/polls/create/constituent-will')}`);
          return;
        }
        addNotification({
          type: 'error',
          title: 'Could not create poll',
          message: data?.error ?? data?.message ?? `Error ${res.status}`,
          duration: 6000,
        });
        return;
      }

      if (data?.success && data?.data?.id) {
        addNotification({
          type: 'success',
          title: 'Poll created',
          message: 'Your bill vote poll is live.',
          duration: 4000,
        });
        router.push(`/polls/${data.data.id}`);
      } else {
        addNotification({
          type: 'error',
          title: 'Unexpected response',
          message: 'Poll may have been created; check your polls list.',
          duration: 5000,
        });
        router.push('/polls');
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Request failed',
        message: err instanceof Error ? err.message : 'Network error',
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  }, [representativeId, selectedBill, title, description, addNotification, router]);

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create a bill vote poll
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask constituents how they want their representative to vote on a specific bill. After the vote, you can compare results to the actual vote.
          </p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Representative</CardTitle>
            <CardDescription>
              The representative this poll is about. Open their profile and use &quot;Create bill vote poll&quot; to pre-fill, or enter their ID below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="rep-id">Representative ID</Label>
            <Input
              id="rep-id"
              type="number"
              min={1}
              value={representativeId}
              onChange={(e) => setRepresentativeId(e.target.value)}
              placeholder="e.g. 123"
            />
            {representativeName && (
              <p className="text-sm text-muted-foreground">Representative: {representativeName}</p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Find a bill</CardTitle>
            <CardDescription>
              Search GovInfo for a bill (e.g. &quot;climate&quot;, &quot;health care&quot;, or a bill number).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Input
                className="flex-1 min-w-[200px]"
                placeholder="Search bills..."
                value={billQuery}
                onChange={(e) => setBillQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Input
                className="w-20"
                placeholder="119"
                value={congress}
                onChange={(e) => setCongress(e.target.value)}
                title="Congress number"
              />
              <Button onClick={handleSearch} disabled={searching || !billQuery.trim()}>
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="border border-border rounded-md divide-y divide-border max-h-64 overflow-y-auto">
                {searchResults.map((pkg) => (
                  <button
                    key={pkg.packageId}
                    type="button"
                    onClick={() => handleSelectBill(pkg)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${
                      selectedBill?.packageId === pkg.packageId ? 'bg-primary/10 ring-inset ring-1 ring-primary/30' : ''
                    }`}
                  >
                    <span className="font-medium">{pkg.title}</span>
                    <span className="block text-xs text-muted-foreground truncate">{pkg.packageId}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedBill && (
              <Alert className="bg-primary/5 border-primary/20">
                <AlertDescription>
                  Selected: <strong>{selectedBill.title}</strong> ({selectedBill.packageId})
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {selectedBill && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Poll title and description</CardTitle>
              <CardDescription>
                The poll will offer: Yes — Support this bill, No — Oppose this bill, Abstain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="How should [Rep] vote on [Bill]?"
                  maxLength={300}
                />
              </div>
              <div>
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief context for voters..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create poll'}
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-sm text-muted-foreground">
          <a href="/polls/create" className="underline hover:no-underline">
            ← Back to standard poll creation
          </a>
        </p>
      </div>
    </div>
  );
}
