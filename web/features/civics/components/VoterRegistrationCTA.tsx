"use client";

import { Download, ExternalLink, Loader2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

import type { VoterRegistrationResource } from '@/lib/stores/voterRegistrationStore';

import { useI18n } from '@/hooks/useI18n';

type VoterRegistrationCTAProps = {
  stateCode?: string;
  resource: VoterRegistrationResource | null;
  isLoading: boolean;
  error: string | null;
};

const formatDate = (
  value: string | null | undefined,
  locale: string | undefined,
): string | null => {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale ?? undefined, {
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
  const { t, currentLanguage } = useI18n();
  if (!stateCode) {
    return null;
  }

  const formattedState = stateCode.toUpperCase();
  const lastVerified = formatDate(resource?.last_verified ?? resource?.updated_at, currentLanguage);

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
    <div className="mt-6 rounded-lg border border-border bg-primary/10 dark:bg-muted p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-primary">
            {t('civics.registration.heading', { state: formattedState })}
          </h3>
          {lastVerified && (
            <p className="text-xs text-primary">
              {t('civics.registration.updated', { date: lastVerified })}
            </p>
          )}
        </div>
        {isLoading && (
            <Loader2
            className="h-5 w-5 animate-spin text-primary"
            aria-label={t('civics.registration.loadingAria')}
          />
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
                  {t('civics.registration.buttons.online')}
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
                  {t('civics.registration.buttons.mailForm')}
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
                  {t('civics.registration.buttons.mailForm')}
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}
            {resource.status_check_url && (
              <Button variant="ghost" asChild className="w-full sm:w-auto text-primary hover:text-primary/90">
                <a
                  href={resource.status_check_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  {t('civics.registration.buttons.status')}
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
                  {t('civics.registration.buttons.learn')}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          {resource.special_instructions && (
            <p className="rounded-md bg-card px-3 py-2 text-sm text-primary shadow-sm">
              {resource.special_instructions}
            </p>
          )}

          {resource.mailing_address && (
            <div className="rounded-md bg-card px-3 py-2 shadow-sm">
              <h4 className="text-sm font-semibold text-primary">
                {t('civics.registration.sections.mailingAddress')}
              </h4>
              <address className="mt-1 whitespace-pre-wrap text-sm not-italic text-primary">
                {resource.mailing_address}
              </address>
            </div>
          )}

          {resource.election_office_name && (
            <p className="text-sm text-primary">
              {t('civics.registration.sections.electionOffice', {
                office: resource.election_office_name,
              })}
            </p>
          )}

          {resource.sources && resource.sources.length > 0 && (
            <p className="text-xs uppercase tracking-wide text-primary">
              {t('civics.registration.sections.sources', {
                sources: resource.sources.map((source) => source.replace(/_/g, ' ')).join(', '),
              })}
            </p>
          )}
        </div>
      )}

      {!isLoading && !error && !resource && (
        <div className="rounded-md border border-border bg-card px-3 py-3 text-sm text-primary shadow-sm">
          {t('civics.registration.empty.prefix', { state: formattedState })}{' '}
          <a
            href="https://vote.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline"
          >
            {t('civics.registration.empty.voteGov')}
          </a>{' '}
          {t('civics.registration.empty.suffix')}
        </div>
      )}
    </div>
  );
}


