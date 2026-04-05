'use client';

import { ArrowRight, Shield, Users, Scale, Lock, Vote, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { TrendingPollsSkeleton } from '@/components/shared/Skeletons';

import { get } from '@/lib/api/client';
import { env } from '@/lib/config/env';
import { logger } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

// Lazy load feedback widget - not critical for initial page load
const EnhancedFeedbackWidget = dynamic(
  () => import('@/components/EnhancedFeedbackWidget'),
  {
    ssr: false,
    loading: () => null, // Don't show loading indicator for widget
  }
);

const isFeedbackWidgetEnabled =
  env.NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET !== '1' &&
  process.env.NODE_ENV === 'production';

// Trending Polls Component - Lazy loaded to not block TTI
type TrendingPoll = {
  id: string;
  title: string;
  description: string;
  category: string;
  totalVotes: number;
  options: Array<{ id: string; text: string; votes: number; percentage: number }>;
};

function TrendingPollsSection() {
  const { t } = useI18n();
  const [polls, setPolls] = useState<TrendingPoll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Defer loading until after initial render to not block TTI
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 1500); // Load 1.5s after page load

    return () => clearTimeout(timer);
  }, []);

  // Fetch trending polls
  useEffect(() => {
    if (!shouldLoad) return;

    const controller = new AbortController();

    const loadPolls = async () => {
      try {
        setIsLoading(true);
        const data = await get<{ polls?: TrendingPoll[] }>('/api/polls/trending?limit=3', {
          signal: controller.signal,
        });
        if (data?.polls && Array.isArray(data.polls)) {
          setPolls(data.polls.slice(0, 3));
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        logger.warn('Failed to load trending polls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPolls();
    return () => controller.abort();
  }, [shouldLoad]);

  // Deferred: don't render until we're ready to load
  if (!shouldLoad) {
    return null;
  }

  // Show skeleton while loading
  if (isLoading && polls.length === 0) {
    return <TrendingPollsSkeleton />;
  }

  // Don't show section if no polls
  if (polls.length === 0) {
    return null;
  }

  return (
    <section 
      className="bg-gradient-to-b from-background to-muted/30 dark:from-background dark:to-muted py-20"
      aria-labelledby="trending-polls-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id="trending-polls-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('landing.trendingPolls.heading') || 'Trending Polls'}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('landing.trendingPolls.subheading') || 'See what the community is discussing right now'}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3" role="list">
          {polls.map((poll) => {
            const topOption = poll.options.reduce((prev, current) => 
              (current.votes > prev.votes) ? current : prev
            );

            return (
              <article
                key={poll.id}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary"
                role="listitem"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                    {poll.category || 'General'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {poll.totalVotes.toLocaleString()} {poll.totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                  {poll.title}
                </h3>

                {poll.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {poll.description}
                  </p>
                )}

                {poll.options.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">{topOption.text}</span>
                      <span className="font-medium">{topOption.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${topOption.percentage}%` }}
                        aria-label={`${topOption.percentage}% voted for ${topOption.text}`}
                      />
                    </div>
                  </div>
                )}

                <Link
                  href={`/polls/${poll.id}`}
                  className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
                >
                  View Poll
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/polls"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {t('landing.trendingPolls.viewAll') || 'View All Polls'}
            <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Landing Page Client Component
 * 
 * Public-facing homepage for the Choices platform (client-side rendered).
 * Features mission statement, key features, and clear CTAs.
 * 
 * Accessibility Features:
 * - Semantic HTML structure with proper heading hierarchy
 * - ARIA labels for all interactive elements
 * - Skip link target for keyboard navigation
 * - High contrast colors (WCAG AA compliant)
 * - Focus indicators on all interactive elements
 * - Screen reader announcements for dynamic content
 * 
 * Internationalization:
 * - All text content uses i18n translation keys
 * - Supports English (en) and Spanish (es)
 * 
 * Created: December 17, 2025
 * Status: ✅ PRODUCTION READY
 */
export default function LandingPageClient() {
  const { t } = useI18n();
  const [showFeedbackWidget, setShowFeedbackWidget] = useState(false);

  // Defer feedback widget loading until after initial render
  useEffect(() => {
    // Load feedback widget after page is interactive (1 second delay)
    const timer = setTimeout(() => {
      setShowFeedbackWidget(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-background via-muted/30 to-background dark:from-background dark:via-muted dark:to-background">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        {t('common.skipToContent')}
      </a>

      {/* Navigation */}
      <nav 
        className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50"
        role="navigation"
        aria-label={t('navigation.menu.title')}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Shield 
                className="h-8 w-8 text-primary group-hover:text-primary/90 transition-colors" 
                aria-hidden="true"
              />
              <span className="text-xl font-bold text-foreground">
                {t('landing.footer.platformName')}
              </span>
              <span className="sr-only">{t('landing.nav.logoAlt')}</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/auth"
                className="inline-flex items-center min-h-[44px] min-w-[44px] text-sm font-medium text-foreground/80 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-3 py-2"
                aria-label={t('landing.nav.login')}
              >
                {t('landing.nav.login')}
              </Link>
              <Link
                href="/auth?mode=signup"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label={t('landing.nav.signup')}
              >
                {t('landing.nav.signup')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header 
        id="main-content"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {t('landing.hero.title')}
            <br />
            <span className="text-primary">{t('landing.hero.titleHighlight')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {t('landing.hero.subtitle')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 sm:gap-4 flex-wrap" role="group" aria-label="Primary actions">
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={t('landing.hero.ctaPrimary')}
            >
              {t('landing.hero.ctaPrimary')}
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center min-h-[44px] rounded-lg border-2 border-border bg-card px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-foreground hover:border-border hover:bg-muted transition-all focus:outline-none focus:ring-2 focus:ring-muted-foreground focus:ring-offset-2"
              aria-label={t('landing.hero.ctaSecondary')}
            >
              {t('landing.hero.ctaSecondary')}
            </Link>
          </div>
        </div>
      </header>

      {/* Mission Statement */}
      <section 
        className="bg-slate-900 py-16"
        aria-label={t('landing.mission.quote')}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <blockquote className="text-center">
            <p className="text-xl font-medium text-white sm:text-3xl">
              &ldquo;{t('landing.mission.quote')}
              <br />
              <span className="text-blue-400">{t('landing.mission.quoteHighlight')}&rdquo;</span>
            </p>
          </blockquote>
        </div>
      </section>

      {/* Features Grid */}
      <section 
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20"
        aria-labelledby="features-heading"
      >
        <div className="text-center mb-16">
          <h2 id="features-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('landing.features.heading')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('landing.features.subheading')}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" role="list">
          {/* Feature 1: Level Playing Field */}
          <article 
            className="group rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-600 transition-colors">
              <Scale className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              {t('landing.features.levelPlayingField.title')}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {t('landing.features.levelPlayingField.description')}
            </p>
          </article>

          {/* Feature 2: Campaign Finance Transparency */}
          <article 
            className="group rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-amber-600"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-600 transition-colors">
              <TrendingUp className="h-6 w-6 text-amber-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              {t('landing.features.followMoney.title')}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {t('landing.features.followMoney.description')}
            </p>
          </article>

          {/* Feature 3: Direct Engagement */}
          <article 
            className="group rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-purple-600"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-600 transition-colors">
              <Users className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              {t('landing.features.directEngagement.title')}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {t('landing.features.directEngagement.description')}
            </p>
          </article>

          {/* Feature 4: Privacy-First */}
          <article 
            className="group rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-green-600"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-600 transition-colors">
              <Lock className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              {t('landing.features.privacyFirst.title')}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {t('landing.features.privacyFirst.description')}
            </p>
          </article>

          {/* Feature 5: Equal Voting */}
          <article 
            className="group rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-rose-600"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30 group-hover:bg-rose-600 transition-colors">
              <Vote className="h-6 w-6 text-rose-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              {t('landing.features.polling.title')}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {t('landing.features.polling.description')}
            </p>
          </article>

          {/* Feature 6: Location-Based */}
          <article 
            className="group rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-cyan-600"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30 group-hover:bg-cyan-600 transition-colors">
              <Shield className="h-6 w-6 text-cyan-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              {t('landing.features.location.title')}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {t('landing.features.location.description')}
            </p>
          </article>
        </div>
      </section>

      {/* Trending Polls Section */}
      <TrendingPollsSection />

      {/* CTA Section */}
      <section 
        className="bg-gradient-to-br from-blue-600 to-blue-700 py-16"
        aria-labelledby="cta-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="cta-heading" className="text-3xl font-bold text-white sm:text-4xl">
            {t('landing.cta.heading')}
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            {t('landing.cta.subheading')}
          </p>
          <div className="mt-8">
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center justify-center rounded-lg bg-primary-foreground px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-primary hover:bg-muted transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2 focus:ring-offset-primary"
              aria-label={t('landing.cta.button')}
            >
              {t('landing.cta.button')}
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feedback Widget - Allow users to provide feedback from landing page */}
      {showFeedbackWidget && isFeedbackWidgetEnabled && <EnhancedFeedbackWidget />}
    </div>
  );
}

