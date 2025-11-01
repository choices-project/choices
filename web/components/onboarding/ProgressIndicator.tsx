'use client'

import { CheckCircle2 } from 'lucide-react';
import * as React from 'react';

import type { StepSlug } from './types';
import { DEFAULT_STEP_ORDER, STEP_LABEL } from './types';

type ProgressIndicatorProps = {
  currentStep: StepSlug;
  completedSteps: string[]; // kept broad for back-compat; values should be StepSlug
  steps?: StepSlug[];       // override order if needed; defaults to DEFAULT_STEP_ORDER
}

export default function ProgressIndicator({
  currentStep,
  completedSteps,
  steps = DEFAULT_STEP_ORDER,
}: ProgressIndicatorProps) {
  const isCompleted = React.useCallback(
    (slug: StepSlug) => completedSteps.includes(slug),
    [completedSteps]
  );

  return (
    <nav className="w-full bg-white/70 backdrop-blur border-b border-gray-200">
      <ol className="container mx-auto px-4 py-3 flex items-center overflow-x-auto gap-3">
        {steps.map((slug, idx) => {
          const done = isCompleted(slug);
          const active = slug === currentStep;

          return (
            <li key={slug} className="flex items-center gap-2 shrink-0">
              <span
                className={[
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium border',
                  done
                    ? 'text-green-700 bg-green-50 border-green-200'
                    : active
                      ? 'text-blue-700 bg-blue-50 border-blue-200'
                      : 'text-gray-600 bg-gray-50 border-gray-200',
                ].join(' ')}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4" />}
                <span className="whitespace-nowrap">{STEP_LABEL[slug] ?? slug}</span>
              </span>

              {idx < steps.length - 1 && (
                <span className="text-gray-300">/</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
