'use client';

import { Copy, ExternalLink, Link2, Mail, Share2, Twitter, Linkedin, Facebook } from 'lucide-react';
import React, { useEffect, useMemo, useState, useId } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/useI18n';
import { useSocialSharing } from '@/hooks/useSocialSharing';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import type { FeedItem } from '@/lib/stores/types/feeds';

type FeedShareDialogProps = {
  item: FeedItem | null;
  isOpen: boolean;
  onClose: () => void;
};

export function FeedShareDialog({ item, isOpen, onClose }: FeedShareDialogProps) {
  const { t, currentLanguage } = useI18n();
  const [shareUrl, setShareUrl] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const descriptionId = useId();
  const linkDescriptionId = useId();
  const liveRegionId = useId();
  const { share, shareToClipboard, shareToTwitter, shareToFacebook, shareToLinkedIn } = useSocialSharing();

  const isDialogReady = Boolean(item && isOpen);

  useEffect(() => {
    if (!item || !isOpen) {
      setShareUrl('');
      setCopyState('idle');
      return;
    }

    let cancelled = false;

    const computeUrl = async () => {
      const canonical = item.metadata?.externalUrl ?? item.source?.url ?? '';
      if (canonical.startsWith('http')) {
        if (!cancelled) setShareUrl(canonical);
        return;
      }
      const { safeWindow } = await import('@/lib/utils/ssr-safe');
      const origin = safeWindow((w) => w.location?.origin ?? '', '');
      const fallback = origin ? `${origin}/feed/items/${item.id}` : '';
      if (!cancelled) setShareUrl(fallback || canonical);
    };

    ScreenReaderSupport.announce(
      t('share.dialog.live.opened', { title: item.title }),
      'polite',
    );
    setCopyState('idle');
    void computeUrl();

    return () => {
      cancelled = true;
    };
  }, [item, isOpen, t]);

  const formattedUpdatedAt = useMemo(() => {
    if (!item?.updatedAt) return null;
    try {
      return new Intl.DateTimeFormat(currentLanguage, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(item.updatedAt));
    } catch {
      return item.updatedAt;
    }
  }, [item?.updatedAt, currentLanguage]);

  const handleCopyLink = async () => {
    if (!item || !shareUrl) return;
    const result = await shareToClipboard({
      title: item.title,
      text: item.summary,
      url: shareUrl,
      hashtags: item.tags,
    });
    setCopyState(result.success ? 'copied' : 'error');
    ScreenReaderSupport.announce(
      result.success
        ? t('share.dialog.live.copied')
        : t('share.dialog.live.copyError'),
      result.success ? 'polite' : 'assertive',
    );
    if (result.success) {
      window.setTimeout(() => setCopyState('idle'), 2500);
    }
  };

  const handleSystemShare = async () => {
    if (!item || !shareUrl) return;
    await share({
      title: item.title,
      text: item.summary,
      url: shareUrl,
      hashtags: item.tags,
    });
  };

  const handleEmailShare = () => {
    if (!item || !shareUrl) return;
    const subject = encodeURIComponent(t('share.dialog.emailSubject', { title: item.title }));
    const body = encodeURIComponent(`${item.summary}\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
  };

  const renderMetadata = () => {
    if (!item) return null;
    const entries = [
      { label: t('share.dialog.metadata.source'), value: item.source?.name },
      { label: t('share.dialog.metadata.author'), value: item.author?.name },
      { label: t('share.dialog.metadata.category'), value: item.category },
      { label: t('share.dialog.metadata.district'), value: item.district },
      { label: t('share.dialog.metadata.updated'), value: formattedUpdatedAt },
    ].filter((entry) => Boolean(entry.value));

    return (
      <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2" aria-label={t('share.dialog.metadataHeading')}>
        {entries.map((entry) => (
          <div key={`${entry.label}-${entry.value}`} className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{entry.label}</dt>
            <dd className="text-foreground font-medium">{entry.value}</dd>
          </div>
        ))}
      </dl>
    );
  };

  if (!item) {
    return null;
  }

  return (
    <Dialog open={isDialogReady} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent aria-describedby={descriptionId}>
        <DialogHeader>
          <DialogTitle>{t('share.dialog.feedTitle')}</DialogTitle>
          <DialogDescription id={descriptionId}>
            {t('share.dialog.description', { title: item.title })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section aria-labelledby={linkDescriptionId} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label htmlFor="feed-share-link" className="text-sm font-medium">
                  {t('share.dialog.urlLabel')}
                </Label>
                <p id={linkDescriptionId} className="text-xs text-muted-foreground">
                  {t('share.dialog.urlDescription')}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs capitalize">
                {item.type.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="feed-share-link"
                readOnly
                value={shareUrl}
                aria-describedby={linkDescriptionId}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleCopyLink()}
                disabled={!shareUrl}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" aria-hidden />
                <span>
                  {copyState === 'copied'
                    ? t('share.dialog.copied')
                    : t('share.dialog.copy')}
                </span>
              </Button>
            </div>
            <div id={liveRegionId} aria-live="polite" className="sr-only">
              {copyState === 'copied'
                ? t('share.dialog.live.copied')
                : copyState === 'error'
                  ? t('share.dialog.live.copyError')
                  : ''}
            </div>
          </section>

          <section aria-label={t('share.dialog.actionsHeading')} className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSystemShare()}
                disabled={!shareUrl}
                className="flex items-center gap-2 justify-start"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                <span>{t('share.dialog.systemShare')}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleEmailShare}
                disabled={!shareUrl}
                className="flex items-center gap-2 justify-start"
              >
                <Mail className="h-4 w-4" aria-hidden />
                <span>{t('share.dialog.emailShare')}</span>
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  shareToTwitter({
                    title: item.title,
                    text: item.summary,
                    url: shareUrl,
                    hashtags: item.tags,
                  })
                }
                disabled={!shareUrl}
                className="flex items-center gap-2 justify-start"
              >
                <Twitter className="h-4 w-4" aria-hidden />
                <span>X / Twitter</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  shareToFacebook({
                    title: item.title,
                    url: shareUrl,
                  })
                }
                disabled={!shareUrl}
                className="flex items-center gap-2 justify-start"
              >
                <Facebook className="h-4 w-4" aria-hidden />
                <span>Facebook</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  shareToLinkedIn({
                    title: item.title,
                    text: item.summary,
                    url: shareUrl,
                  })
                }
                disabled={!shareUrl}
                className="flex items-center gap-2 justify-start"
              >
                <Linkedin className="h-4 w-4" aria-hidden />
                <span>LinkedIn</span>
              </Button>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {t('share.dialog.metadataHeading')}
              </h3>
              {item.source?.url && (
                <Button
                  type="button"
                  variant="link"
                  className="flex items-center gap-1 text-sm"
                  onClick={() => window.open(item.source?.url, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  {t('share.dialog.openSource')}
                </Button>
              )}
            </div>
            {renderMetadata()}
            {item.tags?.length ? (
              <div className="flex flex-wrap gap-2" aria-label={t('share.dialog.metadata.tags')}>
                {item.tags.slice(0, 6).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
                {item.tags.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.tags.length - 6}
                  </Badge>
                )}
              </div>
            ) : null}
          </section>

          {item.metadata?.externalUrl && (
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4" aria-hidden />
              <span>{item.metadata.externalUrl}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FeedShareDialog;

