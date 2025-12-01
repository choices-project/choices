#!/usr/bin/env tsx

import { getAllCacheStats } from '@/lib/cache/analytics-cache';
import { logger } from '@/lib/utils/logger';

type TableRow = {
  prefix: string;
  hits: number;
  misses: number;
  errors: number;
  'hit rate (%)': string;
  'last accessed': string;
};

async function main() {
  const stats = await getAllCacheStats();
  const rows: TableRow[] = Object.entries(stats).map(([prefix, metrics]) => {
    const hits = metrics?.hits ?? 0;
    const misses = metrics?.misses ?? 0;
    const errors = metrics?.errors ?? 0;
    const total = hits + misses;
    const rate = total === 0 ? 0 : (hits / total) * 100;

    return {
      prefix,
      hits,
      misses,
      errors,
      'hit rate (%)': rate.toFixed(2),
      'last accessed': metrics?.lastAccessed ?? '—',
    };
  });

  if (rows.length === 0) {
    logger.warn('[cache-report] No cache statistics available yet. Exercise analytics routes to populate metrics.');
    return;
  }

  printRows(rows);
}

main().catch((error) => {
  console.error('Cache report failed', error);
  process.exit(1);
});

function printRows(rows: TableRow[]) {
  const firstRow = rows[0];
  if (!firstRow) {
    logger.warn('[cache-report] No rows to print.');
    return;
  }

  const headers = Object.keys(firstRow) as Array<keyof TableRow>;
  const headerLine = headers.join('\t');
  logger.info(`[cache-report]\n${headerLine}`);

  rows.forEach((row) => {
    const line = headers.map((key) => String(row[key])).join('\t');
    logger.info(line);
  });
}

