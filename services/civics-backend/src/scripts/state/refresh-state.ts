#!/usr/bin/env node
/**
 * Run the full OpenStates API refresh sequence (contacts → social → photos → committees → activity → data sources → Google Civic).
 *
 * Usage:
 *   npm run state:refresh [--states=CA,NY] [--limit=250] [--dry-run] [--skip=activity] [--only=contacts,social]
 */
import 'dotenv/config';

import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

type StepKey =
  | 'contacts'
  | 'social'
  | 'photos'
  | 'committees'
  | 'activity'
  | 'data-sources'
  | 'google-civic';

type CliOptions = {
  states?: string[];
  limit?: number;
  dryRun?: boolean;
  only?: Set<StepKey>;
  skip?: Set<StepKey>;
};

const ALL_STEPS: Array<{ key: StepKey; label: string; file: string }> = [
  { key: 'contacts', label: 'Contacts', file: './sync-contacts.js' },
  { key: 'social', label: 'Social', file: './sync-social.js' },
  { key: 'photos', label: 'Photos', file: './sync-photos.js' },
  { key: 'committees', label: 'Committees', file: './sync-committees.js' },
  { key: 'activity', label: 'Activity', file: './sync-activity.js' },
  { key: 'data-sources', label: 'Data Sources', file: './sync-data-sources.js' },
  { key: 'google-civic', label: 'Google Civic', file: './sync-google-civic.js' },
];

function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg || !arg.startsWith('--')) continue;

    const [flag, rawValue] = arg.includes('=')
      ? (arg.slice(2).split('=') as [string, string | undefined])
      : [arg.slice(2), args[i + 1]];
    const value = rawValue && !rawValue.startsWith('--') ? rawValue : undefined;

    switch (flag) {
      case 'states':
        if (value) {
          options.states = value
            .split(',')
            .map((state) => state.trim().toUpperCase())
            .filter(Boolean);
        }
        break;
      case 'limit':
        if (value) {
          options.limit = Number(value);
        }
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      case 'only':
        if (!options.only) options.only = new Set();
        if (value) {
          value
            .split(',')
            .map((entry) => entry.trim().toLowerCase() as StepKey)
            .filter((entry): entry is StepKey => ALL_STEPS.some((step) => step.key === entry))
            .forEach((entry) => options.only?.add(entry));
        }
        break;
      case 'skip':
        if (!options.skip) options.skip = new Set();
        if (value) {
          value
            .split(',')
            .map((entry) => entry.trim().toLowerCase() as StepKey)
            .filter((entry): entry is StepKey => ALL_STEPS.some((step) => step.key === entry))
            .forEach((entry) => options.skip?.add(entry));
        }
        break;
      default:
        break;
    }

    if (value && !arg.includes('=')) {
      i += 1;
    }
  }

  return options;
}

function selectSteps({ only, skip }: CliOptions) {
  let steps = ALL_STEPS;
  if (only && only.size > 0) {
    steps = steps.filter((step) => only.has(step.key));
  }
  if (skip && skip.size > 0) {
    steps = steps.filter((step) => !skip.has(step.key));
  }
  return steps;
}

function buildSharedArgs(options: CliOptions): string[] {
  const args: string[] = [];
  if (options.states && options.states.length > 0) {
    args.push(`--states=${options.states.join(',')}`);
  }
  if (typeof options.limit === 'number') {
    args.push(`--limit=${options.limit}`);
  }
  if (options.dryRun) {
    args.push('--dry-run');
  }
  return args;
}

async function runStep(file: string, args: string[]): Promise<void> {
  const scriptPath = fileURLToPath(new URL(file, import.meta.url));
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Subcommand exited with code ${code ?? 'unknown'}`));
      }
    });
    child.on('error', reject);
  });
}

async function main(): Promise<void> {
  const options = parseCliOptions();
  const steps = selectSteps(options);

  if (steps.length === 0) {
    console.log('No state refresh steps selected (all skipped). Nothing to do.');
    return;
  }

  const sharedArgs = buildSharedArgs(options);
  const summary: string[] = [];

  for (const step of steps) {
    const label = `state:sync:${step.key}`;
    console.log(`\n→ Running ${label}`);
    const start = performance.now();
    await runStep(step.file, sharedArgs);
    const durationMs = Math.round(performance.now() - start);
    summary.push(`${label} (${durationMs} ms)`);
  }

  console.log('\n✅ State refresh complete.');
  console.log(summary.map((line) => ` • ${line}`).join('\n'));
}

main().catch((error) => {
  console.error('State refresh failed:', error);
  process.exit(1);
});


