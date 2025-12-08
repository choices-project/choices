"use client";

import { Download, ExternalLink, Loader2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import type { VoterRegistrationResource } from '@/lib/stores/voterRegistrationStore';

type VoterRegistrationCTAProps = {
  stateCode?: string;
  resource: VoterRegistrationResource | null;
  isLoading: boolean;
  error: string | null;
};

const formatDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return null;
  }
};

export function VoterRegistrationCTA({
  stateCode,
  resource,
  isLoading,
  error,
}: VoterRegistrationCTAProps) {
  if (!stateCode) {
    return null;
  }

  const formattedState = stateCode.toUpperCase();
  const lastVerified = formatDate(resource?.last_verified ?? resource?.updated_at);

  const hasOnlinePortal = Boolean(resource?.online_url);
  const hasMailForm = Boolean(resource?.mail_form_url);
  const metadata =
    resource?.metadata && typeof resource.metadata === 'object' && !Array.isArray(resource.metadata)
      ? (resource.metadata as Record<string, unknown>)
      : null;
  const moreInfoUrl =
    metadata && typeof metadata.more_info === 'string' ? (metadata.more_info as string) : null;
  const homepageUrl =
    metadata && typeof metadata.homepage === 'string' ? (metadata.homepage as string) : null;
  const additionalInfoUrl = moreInfoUrl ?? homepageUrl;

  return (
    <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-blue-900">
            Register to Vote in {formattedState}
          </h3>
          {lastVerified && (
            <p className="text-xs text-blue-700">
              Updated {lastVerified}
            </p>
          )}
        </div>
        {isLoading && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-label="Loading voter registration resources" />
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isLoading && !error && resource && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {hasOnlinePortal && (
              <Button asChild className="w-full sm:w-auto">
                <a
                  href={resource.online_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Start Online Registration
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {!hasOnlinePortal && hasMailForm && (
              <Button asChild className="w-full sm:w-auto">
                <a
                  href={resource.mail_form_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Download Registration Form
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}
            {hasOnlinePortal && hasMailForm && (
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a
                  href={resource.mail_form_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Download Mail-in Form
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}
            {resource.status_check_url && (
              <Button variant="ghost" asChild className="w-full sm:w-auto text-blue-700 hover:text-blue-800">
                <a
                  href={resource.status_check_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Check Registration Status
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {additionalInfoUrl && (
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a
                  href={additionalInfoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Learn About Registration
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          {resource.special_instructions && (
            <p className="rounded-md bg-white px-3 py-2 text-sm text-blue-900 shadow-sm">
              {resource.special_instructions}
            </p>
          )}

          {resource.mailing_address && (
            <div className="rounded-md bg-white px-3 py-2 shadow-sm">
              <h4 className="text-sm font-semibold text-blue-900">Mailing Address</h4>
              <address className="mt-1 whitespace-pre-wrap text-sm not-italic text-blue-800">
                {resource.mailing_address}
              </address>
            </div>
          )}

          {resource.election_office_name && (
            <p className="text-sm text-blue-900">
              Election office: {resource.election_office_name}
            </p>
          )}

          {resource.sources && resource.sources.length > 0 && (
            <p className="text-xs uppercase tracking-wide text-blue-700">
              Sources: {resource.sources.map((source) => source.replace(/_/g, ' ')).join(', ')}
            </p>
          )}
        </div>
      )}

      {!isLoading && !error && !resource && (
        <div className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-blue-900 shadow-sm">
          We could not find a voter registration resource for {formattedState}. Visit{' '}
          <a
            href="https://vote.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-700 underline"
          >
            Vote.gov
          </a>{' '}
          for the latest instructions.
        </div>
      )}
    </div>
  );
}


