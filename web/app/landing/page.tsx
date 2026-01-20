'use client';

import { ArrowRight, Shield, Users, Scale, Lock, Vote, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
  process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET !== '1' &&
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

    const fetchTrendingPolls = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/polls/trending?limit=3');
        const data = await response.json();

        if (data.success && Array.isArray(data.polls)) {
          setPolls(data.polls.slice(0, 3));
        }
      } catch (error) {
        // Silently fail - polls section is nice-to-have, not critical
        console.warn('Failed to load trending polls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingPolls();
  }, [shouldLoad]);

  // Don't render if not loading yet or if no polls
  if (!shouldLoad || (isLoading && polls.length === 0)) {
    return null;
  }

  if (polls.length === 0) {
    return null; // Don't show section if no polls
  }

  return (
    <section 
      className="bg-gradient-to-b from-white to-blue-50/30 py-20"
      aria-labelledby="trending-polls-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id="trending-polls-heading" className="text-3xl font-bold text-slate-900 sm:text-4xl">
            {t('landing.trendingPolls.heading') || 'Trending Polls'}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
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
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-blue-600"
                role="listitem"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {poll.category || 'General'}
                  </span>
                  <span className="text-sm text-slate-500">
                    {poll.totalVotes.toLocaleString()} {poll.totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                  {poll.title}
                </h3>

                {poll.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {poll.description}
                  </p>
                )}

                {poll.options.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="truncate">{topOption.text}</span>
                      <span className="font-medium">{topOption.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${topOption.percentage}%` }}
                        aria-label={`${topOption.percentage}% voted for ${topOption.text}`}
                      />
                    </div>
                  </div>
                )}

                <Link
                  href={`/polls/${poll.id}`}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1"
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
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
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
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        {t('common.skipToContent')}
      </a>

      {/* Navigation */}
      <nav 
        className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50"
        role="navigation"
        aria-label={t('navigation.menu.title')}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Shield 
                className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" 
                aria-hidden="true"
              />
              <span className="text-xl font-bold text-slate-900">
                {t('landing.footer.platformName')}
              </span>
              <span className="sr-only">{t('landing.nav.logoAlt')}</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/auth"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-3 py-2"
              >
                {t('landing.nav.login')}
              </Link>
              <Link
                href="/auth?mode=signup"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
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
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
            {t('landing.hero.title')}
            <br />
            <span className="text-blue-600">{t('landing.hero.titleHighlight')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
            {t('landing.hero.subtitle')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap" role="group" aria-label="Primary actions">
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              aria-label={t('landing.hero.ctaPrimary')}
            >
              {t('landing.hero.ctaPrimary')}
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2"
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
            <p className="text-2xl font-medium text-white sm:text-3xl">
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
          <h2 id="features-heading" className="text-3xl font-bold text-slate-900 sm:text-4xl">
            {t('landing.features.heading')}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t('landing.features.subheading')}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" role="list">
          {/* Feature 1: Level Playing Field */}
          <article 
            className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-blue-600"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-600 transition-colors">
              <Scale className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              {t('landing.features.levelPlayingField.title')}
            </h3>
            <p className="mt-2 text-slate-600">
              {t('landing.features.levelPlayingField.description')}
            </p>
          </article>

          {/* Feature 2: Campaign Finance Transparency */}
          <article 
            className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-amber-600"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 group-hover:bg-amber-600 transition-colors">
              <TrendingUp className="h-6 w-6 text-amber-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              {t('landing.features.followMoney.title')}
            </h3>
            <p className="mt-2 text-slate-600">
              {t('landing.features.followMoney.description')}
            </p>
          </article>

          {/* Feature 3: Direct Engagement */}
          <article 
            className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-purple-600"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-600 transition-colors">
              <Users className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              {t('landing.features.directEngagement.title')}
            </h3>
            <p className="mt-2 text-slate-600">
              {t('landing.features.directEngagement.description')}
            </p>
          </article>

          {/* Feature 4: Privacy-First */}
          <article 
            className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-green-600"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-600 transition-colors">
              <Lock className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              {t('landing.features.privacyFirst.title')}
            </h3>
            <p className="mt-2 text-slate-600">
              {t('landing.features.privacyFirst.description')}
            </p>
          </article>

          {/* Feature 5: Equal Voting */}
          <article 
            className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-rose-600"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 group-hover:bg-rose-600 transition-colors">
              <Vote className="h-6 w-6 text-rose-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              {t('landing.features.polling.title')}
            </h3>
            <p className="mt-2 text-slate-600">
              {t('landing.features.polling.description')}
            </p>
          </article>

          {/* Feature 6: Location-Based */}
          <article 
            className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus-within:ring-2 focus-within:ring-cyan-600"
            role="listitem"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 group-hover:bg-cyan-600 transition-colors">
              <Shield className="h-6 w-6 text-cyan-600 group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              {t('landing.features.location.title')}
            </h3>
            <p className="mt-2 text-slate-600">
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
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label={t('landing.cta.button')}
            >
              {t('landing.cta.button')}
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="border-t border-slate-200 bg-white py-12"
        role="contentinfo"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" aria-hidden="true" />
              <span className="text-sm font-semibold text-slate-900">
                {t('landing.footer.platformName')}
              </span>
            </div>
            <nav 
              className="flex items-center gap-6 text-sm text-slate-600"
              aria-label="Footer navigation"
            >
              <Link 
                href="/terms" 
                className="hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1"
              >
                {t('landing.footer.terms')}
              </Link>
              <Link 
                href="/privacy" 
                className="hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1"
              >
                {t('landing.footer.privacy')}
              </Link>
              <span>{t('landing.footer.copyright')}</span>
            </nav>
          </div>
        </div>
      </footer>

      {/* Feedback Widget - Allow users to provide feedback from landing page */}
      {showFeedbackWidget && isFeedbackWidgetEnabled && <EnhancedFeedbackWidget />}
    </div>
  );
}

