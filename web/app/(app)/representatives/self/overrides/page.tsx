'use client'

import { useState } from 'react';

export default function RepresentativeOverridesPage() {
  const [representativeId, setRepresentativeId] = useState<string>('');
  const [shortBio, setShortBio] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [campaignWebsite, setCampaignWebsite] = useState<string>('');
  const [pressContact, setPressContact] = useState<string>('');
  const [socialsText, setSocialsText] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const parseSocials = (): Record<string, string> => {
    const lines = socialsText.split('\n');
    const obj: Record<string, string> = {};
    for (const line of lines) {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key && val) obj[key] = val;
      }
    }
    return obj;
  };

  const onSubmit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/representatives/self/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          representativeId: Number(representativeId),
          short_bio: shortBio || undefined,
          profile_photo_url: photoUrl || undefined,
          campaign_website: campaignWebsite || undefined,
          press_contact: pressContact || undefined,
          socials: socialsText ? parseSocials() : undefined,
        }),
      });
      const js = await res.json().catch(() => ({}));
      if (res.ok && js?.success !== false) {
        setMessage('Overrides saved.');
      } else {
        setMessage(js?.error ?? 'Failed to save overrides.');
      }
    } catch {
      setMessage('Failed to save overrides.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Representative Public Overrides</h1>
      <p className="text-gray-600 text-sm">
        For fast-tracked representatives only. Edits are limited to public-facing details and are audited. Official records remain immutable.
      </p>

      {message ? <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">{message}</div> : null}

      <div className="space-y-1">
        <label className="text-sm font-medium">Representative ID</label>
        <input
          className="w-full border rounded p-2"
          placeholder="Enter your representative ID"
          value={representativeId}
          onChange={(e) => setRepresentativeId(e.target.value)}
          inputMode="numeric"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Profile Photo URL</label>
        <input
          className="w-full border rounded p-2"
          placeholder="https://example.com/photo.jpg"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Campaign Website</label>
        <input
          className="w-full border rounded p-2"
          placeholder="https://yourcampaign.com"
          value={campaignWebsite}
          onChange={(e) => setCampaignWebsite(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Press Contact</label>
        <input
          className="w-full border rounded p-2"
          placeholder="press@yourcampaign.com or contact details"
          value={pressContact}
          onChange={(e) => setPressContact(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Short Bio</label>
        <textarea
          className="w-full border rounded p-2"
          rows={4}
          placeholder="Brief public bio"
          value={shortBio}
          onChange={(e) => setShortBio(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Social Links (key: url per line)</label>
        <textarea
          className="w-full border rounded p-2"
          rows={4}
          placeholder="twitter: https://x.com/you\nfacebook: https://facebook.com/you"
          value={socialsText}
          onChange={(e) => setSocialsText(e.target.value)}
        />
      </div>

      <div>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white"
          onClick={onSubmit}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Overrides'}
        </button>
      </div>
    </div>
  );
}


