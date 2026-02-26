'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { logger } from '@/lib/utils/logger';

import { useAuth } from '@/hooks/useAuth';

type Submission = {
  id: number;
  representative_id: number;
  contact_type: string;
  value: string;
  is_primary: boolean;
  is_verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  created_at: string;
  representative: { id: number; name: string; office: string; party: string } | null;
};

function getContactIcon(type: string) {
  switch (type) {
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'phone':
      return <Phone className="h-4 w-4" />;
    case 'address':
      return <MapPin className="h-4 w-4" />;
    default:
      return <Mail className="h-4 w-4" />;
  }
}

function getContactLabel(type: string) {
  const labels: Record<string, string> = {
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    fax: 'Fax',
    website: 'Website',
  };
  return labels[type] ?? type;
}

export default function MySubmissionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/contact/submissions');
      if (!res.ok) {
        if (res.status === 401) {
          setError('Sign in to view your submissions');
          return;
        }
        throw new Error('Failed to load submissions');
      }
      const data = await res.json();
      if (data.success && data.data) {
        setSubmissions(data.data.submissions ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
      logger.error('Error fetching contact submissions', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void fetchSubmissions();
    } else if (!authLoading) {
      setLoading(false);
      setError('Sign in to view your submissions');
    }
  }, [user, authLoading, fetchSubmissions]);

  if (authLoading || (user && loading)) {
    return (
      <div
        className="container max-w-3xl mx-auto px-4 py-8"
        aria-label="Loading submissions"
        aria-busy="true"
        aria-live="polite"
        role="status"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" aria-hidden />
          <div className="h-32 bg-muted rounded" aria-hidden />
          <div className="h-32 bg-muted rounded" aria-hidden />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>My Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Sign in to view your contact information submissions.
            </p>
            <Button asChild>
              <Link href="/auth?redirect=/contact/submissions">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <EnhancedErrorDisplay
          title="Failed to load submissions"
          message={error}
          canRetry
          onRetry={fetchSubmissions}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Submissions</h1>
        <p className="text-muted-foreground mt-1">
          Contact information you&apos;ve submitted for representatives
        </p>
      </div>

      {submissions.length === 0 ? (
        <EnhancedEmptyState
          icon={<Mail className="h-12 w-12 text-muted-foreground" />}
          title="No submissions yet"
          description="When you submit contact information for a representative, it will appear here. Pending submissions await admin review."
          primaryAction={{
            label: 'Find representatives',
            href: '/representatives',
          }}
        />
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {getContactIcon(s.contact_type)}
                    <span className="font-medium">{getContactLabel(s.contact_type)}</span>
                  </div>
                  <Badge
                    variant={
                      s.status === 'approved'
                        ? 'default'
                        : s.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {s.status === 'approved' ? 'Approved' : s.status === 'rejected' ? 'Rejected' : 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-mono text-sm">{s.value}</p>
                {s.status === 'rejected' && s.rejection_reason && (
                  <p className="text-sm text-destructive">
                    Reason: {s.rejection_reason}
                  </p>
                )}
                {s.representative && (
                  <p className="text-sm text-muted-foreground">
                    <Link
                      href={`/representatives/${s.representative.id}`}
                      className="text-primary hover:underline"
                    >
                      {s.representative.name}
                      {s.representative.office ? ` — ${s.representative.office}` : ''}
                    </Link>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(s.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Button variant="outline" asChild>
          <Link href="/contact/history">Back to Contact History</Link>
        </Button>
      </div>
    </div>
  );
}
