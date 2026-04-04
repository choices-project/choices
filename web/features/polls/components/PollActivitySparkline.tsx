'use client';

import React, { useEffect, useState } from 'react';

type DataPoint = { date: string; count: number };

type PollActivitySparklineProps = {
  pollId: string;
  className?: string;
  width?: number;
  height?: number;
  /** Accessible label for the chart */
  'aria-label'?: string;
};

/**
 * Small SVG sparkline showing poll vote activity over the last 7 days.
 * Lightweight - no Recharts dependency.
 */
export function PollActivitySparkline({
  pollId,
  className = '',
  width = 120,
  height = 32,
  'aria-label': ariaLabel = 'Poll activity over time',
}: PollActivitySparklineProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/polls/${pollId}/activity`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.data) return;
        setData(Array.isArray(json.data) ? json.data : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [pollId]);

  if (loading || data.length === 0) {
    return null;
  }

  const counts = data.map((d) => d.count);
  const maxCount = Math.max(1, ...counts);
  const minCount = Math.min(0, ...counts);
  const range = maxCount - minCount || 1;
  const padding = { top: 2, right: 2, bottom: 2, left: 2 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data
    .map((d, i) => {
      const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.count - minCount) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const totalVotes = counts.reduce((a, b) => a + b, 0);
  const summary = totalVotes > 0
    ? `${totalVotes} votes over last ${data.length} days`
    : 'No recent activity';

  return (
    <svg
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={ariaLabel}
      aria-hidden={false}
    >
      <title>{summary}</title>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.7"
        points={points}
      />
    </svg>
  );
}
