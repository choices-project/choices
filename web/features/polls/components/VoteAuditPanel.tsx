/**
 * Vote Audit Panel (Admin Only)
 *
 * Displays vote history for a poll: who voted when, option chosen.
 * For investigations and integrity audits.
 *
 * Created: March 2026 (ROADMAP 3.7 Voting Integrity)
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { ClipboardList, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type VoteAuditEntry = {
  id: string;
  userId: string | null;
  displayName: string | null;
  optionText: string | null;
  optionId: string | null;
  rankings: number[] | null;
  createdAt: string;
  source: 'votes' | 'poll_rankings';
};

type VoteAuditResponse = {
  pollId: string;
  votingMethod: string;
  totalEntries: number;
  entries: VoteAuditEntry[];
};

type VoteAuditPanelProps = {
  pollId: string;
  className?: string;
};

export function VoteAuditPanel({ pollId, className = '' }: VoteAuditPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'vote-audit', pollId],
    queryFn: async (): Promise<VoteAuditResponse> => {
      const res = await fetch(`/api/admin/polls/${pollId}/vote-audit`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? err.message ?? `Failed to load vote audit (${res.status})`);
      }
      const json = await res.json();
      if (!json.success || !json.data) throw new Error('Invalid response');
      return json.data;
    },
    enabled: !!pollId && isExpanded,
  });

  return (
    <Card className={className}>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Vote Audit</CardTitle>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <CardDescription>
          View vote history (who voted when, option) for investigations
        </CardDescription>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {isLoading && (
            <div className="flex items-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading vote history…</span>
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive py-2">
              {error instanceof Error ? error.message : 'Failed to load vote audit'}
            </p>
          )}
          {data && !isLoading && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {data.totalEntries} vote{data.totalEntries !== 1 ? 's' : ''} ({data.votingMethod})
              </p>
              <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr>
                      <th className="text-left p-2 font-medium">Voter</th>
                      <th className="text-left p-2 font-medium">Choice</th>
                      <th className="text-left p-2 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map((e) => (
                      <tr key={e.id} className="border-t border-border">
                        <td className="p-2">
                          {e.displayName ?? (e.userId ? `User ${e.userId.slice(0, 8)}…` : '—')}
                        </td>
                        <td className="p-2">{e.optionText ?? '—'}</td>
                        <td className="p-2 text-muted-foreground">
                          {new Date(e.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
