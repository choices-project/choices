'use client';

import { notFound } from 'next/navigation';

import { AnalyticsTestBridge } from '../_components/AnalyticsTestBridge';

const isProduction = process.env.NODE_ENV === 'production';

export default function FeedbackWidgetHarnessPage() {
  if (isProduction) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <AnalyticsTestBridge />
      <div className="max-w-3xl mx-auto py-24 px-6 text-center space-y-4">
        <h1 className="text-3xl font-semibold text-slate-800">Feedback Widget Harness</h1>
        <p className="text-slate-600">
          This lightweight page exists so automated tests can interact with the enhanced feedback widget
          without relying on fragile production journeys.
        </p>
      </div>
    </main>
  );
}

