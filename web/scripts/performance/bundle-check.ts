import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import { bundleMonitor } from '@/lib/performance/bundle-monitor';
import logger from '@/lib/utils/logger';

const REPORTS_DIR = path.resolve(process.cwd(), '_reports');
const REPORT_FILE = path.join(REPORTS_DIR, 'bundle-monitor.json');
const NEXT_BUILD_DIR = path.resolve(process.cwd(), '.next');
const CHUNKS_DIR = path.join(NEXT_BUILD_DIR, 'static', 'chunks');

async function ensureBuildArtifacts(): Promise<void> {
  try {
    const stat = await fs.stat(CHUNKS_DIR);
    if (!stat.isDirectory()) {
      throw new Error(`Chunks directory is not a directory: ${CHUNKS_DIR}`);
    }
  } catch (error) {
    throw new Error(
      `Unable to locate Next.js chunk output at ${CHUNKS_DIR}. Did you run "npm run build" first?`,
      { cause: error }
    );
  }
}

async function collectChunkFiles(dir: string, relativeRoot = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectChunkFiles(absolutePath, relativeRoot);
      files.push(...nested);
      return;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      const relativePath = path.relative(relativeRoot, absolutePath);
      files.push(relativePath);
    }
  }));

  return files;
}

async function analyzeBundleSizes(): Promise<void> {
  await ensureBuildArtifacts();

  const chunkFiles = await collectChunkFiles(CHUNKS_DIR);
  if (chunkFiles.length === 0) {
    logger.warn('[Bundle Monitor] No chunk files found to analyze.');
    return;
  }

  await Promise.all(chunkFiles.map(async (relativePath) => {
    const filePath = path.join(CHUNKS_DIR, relativePath);
    const fileBuffer = await fs.readFile(filePath);
    const gzipSize = gzipSync(fileBuffer).length;

    bundleMonitor.addMetrics({
      name: relativePath,
      size: fileBuffer.length,
      gzipSize,
      chunks: [relativePath],
      dependencies: [],
    });
  }));
}

async function writeReport(): Promise<void> {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  await fs.writeFile(REPORT_FILE, bundleMonitor.exportMetrics(), 'utf-8');
  logger.info(`[Bundle Monitor] wrote report to ${path.relative(process.cwd(), REPORT_FILE)}`);
}

async function main() {
  try {
    await analyzeBundleSizes();
    await writeReport();

    const summary = bundleMonitor.getSummary();
    logger.info(
      `[Bundle Monitor] Processed ${summary.totalBundles} bundles (${Math.round(summary.totalSize / 1024)} KB total)`
    );

    const alerts = bundleMonitor.getAlerts();
    const errorAlerts = alerts.filter((alert) => alert.type === 'error');

    if (errorAlerts.length > 0) {
      logger.error(`[Bundle Monitor] ${errorAlerts.length} blocking bundle issues detected`);
      errorAlerts.forEach((alert) => {
        logger.error(
          `${alert.message}: ${alert.bundle} (${Math.round(alert.size / 1024)} KB) > ${Math.round(alert.threshold / 1024)} KB`
        );
      });
      process.exitCode = 1;
      return;
    }

    const warningAlerts = alerts.filter((alert) => alert.type === 'warning');
    if (warningAlerts.length > 0) {
      warningAlerts.forEach((alert) => {
        logger.warn(
          `${alert.message}: ${alert.bundle} (${Math.round(alert.size / 1024)} KB) > ${Math.round(alert.threshold / 1024)} KB`
        );
      });
    } else {
      logger.info('[Bundle Monitor] All bundles with-in configured thresholds.');
    }
  } catch (error) {
    logger.error('[Bundle Monitor] Failed to analyze bundles', error as Error);
    process.exitCode = 1;
  }
}

void main();

