'use client';

import { Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useI18n } from '@/hooks/useI18n';

type TrustScoreData = {
  overall: number;
  factors: {
    credential_count: number;
    device_diversity: number;
    recent_usage: number;
    backup_status: number;
    security_features: number;
  };
  recommendations: string[];
};

export function TrustScoreCard() {
  const { t } = useI18n();
  const [data, setData] = useState<TrustScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch('/api/v1/auth/webauthn/trust-score', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (!active) return;
        const raw = json?.data?.trust_score ?? json?.trust_score;
        if (raw && typeof raw.overall === 'number') {
          setData(raw as TrustScoreData);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading || error) return null;
  if (!data) return null;

  const recommendations = [...(data.recommendations ?? [])];
  if (data.factors?.credential_count === 1 && !recommendations.some((r) => /backup|respaldo/i.test(r))) {
    recommendations.push(t('auth.passkey.backupPrompt'));
  }
  const hasRecommendations = recommendations.length > 0;

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm">
        <Shield className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="font-medium text-foreground">{t('auth.passkey.trustScoreLabel', { score: data.overall })}</span>
      </div>
      {hasRecommendations && (
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {recommendations.map((rec, i) => (
            <li key={i}>• {rec}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
