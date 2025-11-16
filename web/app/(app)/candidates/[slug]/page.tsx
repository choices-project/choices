'use client'

import useSWR from '@/shims/swr';
import Link from 'next/link';
import { useState } from 'react';

type CandidateProfile = {
  id: string;
  slug: string;
  display_name: string;
  office?: string | null;
  jurisdiction?: string | null;
  party?: string | null;
  bio?: string | null;
  website?: string | null;
  social?: Record<string, string> | null;
  filing_status: 'not_started' | 'in_progress' | 'filed' | 'verified';
  representative_id?: number | null;
  isOwner?: boolean;
  is_public?: boolean;
};

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => {
  if (!r.ok) throw new Error('Failed to load');
  return r.json();
});

export default function CandidatePage({ params }: { params: { slug: string } }) {
  const { data, error, mutate } = useSWR<{ data: CandidateProfile }>(`/api/candidates/${params.slug}`, fetcher);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [editDraft, setEditDraft] = useState<{ bio?: string; website?: string; social?: Record<string, string> }>({});
  const [message, setMessage] = useState<string | null>(null);
  const [codeRequested, setCodeRequested] = useState(false);
  const [code, setCode] = useState('');

  if (error) {
    return <div className="p-6">Candidate not found.</div>;
  }
  if (!data) {
    return <div className="p-6">Loading…</div>;
  }

  const c = data.data;
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{c.display_name}</h1>
        <p className="text-gray-600">
          {c.office ? c.office : 'Prospective Candidate'}
          {c.party ? ` • ${c.party}` : ''} {c.jurisdiction ? ` • ${c.jurisdiction}` : ''}
        </p>
        <div className="mt-2">
          <span className={`inline-flex items-center rounded px-2 py-1 text-sm ${c.filing_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {c.filing_status === 'verified' ? 'Verified' : 'In Verification'}
          </span>
        </div>
      </div>

      {c.isOwner ? (
        <div className="flex items-center gap-3 p-3 border rounded">
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white"
            onClick={async () => {
              try {
                const res = await fetch(`/api/candidates/${params.slug}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ is_public: !Boolean(c.is_public) }),
                });
                if (res.ok) {
                  mutate();
                }
              } catch {
                // noop
              }
            }}
            title="Toggle public visibility"
          >
            {c.is_public ? 'Unpublish Profile' : 'Publish Profile'}
          </button>
          <span className="text-sm text-gray-600">
            {c.is_public ? 'Your profile is public.' : 'Your profile is private (preview only).'}
          </span>
          <button
            className="ml-auto px-3 py-1 rounded border"
            onClick={async () => {
              setVerifying(true);
              setMessage(null);
              try {
                const res = await fetch('/api/candidates/verify/request', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                });
                const js = await res.json().catch(() => ({}));
                if (res.ok && js?.success !== false) {
                  setMessage('Verification code sent to your official email. Enter it below.');
                  setCodeRequested(true);
                } else {
                  setMessage(js?.error ?? 'Could not send verification code.');
                }
              } catch {
                setMessage('Failed to send verification code. Please try again.');
              } finally {
                setVerifying(false);
              }
            }}
            disabled={verifying}
            title="Verify with your official email"
          >
            {verifying ? 'Verifying…' : 'Verify Official Email'}
          </button>
        </div>
      ) : null}

      {message ? <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">{message}</div> : null}
      {c.isOwner && codeRequested ? (
        <div className="flex items-center gap-2 p-3 border rounded">
          <input
            className="border rounded p-2"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            inputMode="numeric"
          />
          <button
            className="px-3 py-1 rounded bg-green-600 text-white"
            onClick={async () => {
              setSaving(true);
              setMessage(null);
              try {
                const res = await fetch('/api/candidates/verify/confirm', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ code }),
                });
                const js = await res.json().catch(() => ({}));
                if (res.ok && js?.success !== false) {
                  setMessage('Verification complete.');
                  mutate();
                } else {
                  setMessage(js?.error ?? 'Invalid code.');
                }
              } catch {
                setMessage('Verification failed. Please try again.');
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || code.length < 6}
          >
            {saving ? 'Submitting…' : 'Submit Code'}
          </button>
        </div>
      ) : null}

      {/* Owner inline edit */}
      {c.isOwner ? (
        <div className="space-y-3 p-4 border rounded">
          <div className="space-y-1">
            <label className="text-sm font-medium">Bio</label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              defaultValue={c.bio ?? ''}
              onChange={(e) => setEditDraft((d) => ({ ...d, bio: e.target.value }))}
              placeholder="Tell voters about you…"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Website</label>
            <input
              type="url"
              className="w-full border rounded p-2"
              defaultValue={c.website ?? ''}
              onChange={(e) => setEditDraft((d) => ({ ...d, website: e.target.value }))}
              placeholder="https://yourcampaign.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Social (key → URL, one per line)</label>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              defaultValue={
                c.social
                  ? Object.entries(c.social)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('\n')
                  : ''
              }
              onChange={(e) => {
                const lines = e.target.value.split('\n');
                const obj: Record<string, string> = {};
                for (const line of lines) {
                  const idx = line.indexOf(':');
                  if (idx > 0) {
                    const key = line.slice(0, idx).trim();
                    const val = line.slice(idx + 1).trim();
                    if (key && val) obj[key] = val;
                  }
                }
                setEditDraft((d) => ({ ...d, social: obj }));
              }}
              placeholder="twitter: https://x.com/you"
            />
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-green-600 text-white"
              onClick={async () => {
                setSaving(true);
                setMessage(null);
                try {
                  const res = await fetch(`/api/candidates/${params.slug}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      ...(editDraft.bio !== undefined ? { bio: editDraft.bio } : {}),
                      ...(editDraft.website !== undefined ? { website: editDraft.website } : {}),
                      ...(editDraft.social !== undefined ? { social: editDraft.social } : {}),
                    }),
                  });
                  if (res.ok) {
                    setMessage('Profile updated.');
                    mutate();
                  } else {
                    setMessage('Failed to update profile.');
                  }
                } catch {
                  setMessage('Failed to update profile.');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : null}

      {!c.isOwner && c.bio ? <p className="text-base leading-7">{c.bio}</p> : null}

      <div className="space-y-2">
        {c.website ? (
          <div>
            <span className="font-medium">Website:</span>{' '}
            <a className="text-blue-600 underline" href={c.website} rel="noopener noreferrer" target="_blank">
              {c.website}
            </a>
            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700" title="Self-provided link">Self-provided</span>
          </div>
        ) : null}
        {c.social ? (
          <div className="space-x-3">
            {Object.entries(c.social).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1">
                <a className="text-blue-600 underline" href={v} target="_blank" rel="noopener noreferrer">
                  {k}
                </a>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700" title="Self-provided link">Self-provided</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="pt-4 border-t">
        <Link href="/app">Back to app</Link>
      </div>
    </div>
  );
}

