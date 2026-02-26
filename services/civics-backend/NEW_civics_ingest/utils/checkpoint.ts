/**
 * Checkpoint system for long-running sync operations.
 */

import { readFile, writeFile, mkdir, unlink, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CHECKPOINT_DIR =
  process.env.CHECKPOINT_DIR ||
  (process.env.CI === 'true' ? '.civics-checkpoints' : '/tmp/civics-checkpoints');

interface Checkpoint {
  operation: string;
  startedAt: string;
  lastUpdated: string;
  total: number;
  processed: number;
  failed: number;
  lastProcessedId?: number;
  metadata?: Record<string, unknown>;
}

function getCheckpointPath(operation: string): string {
  const safeName = operation.replace(/[^a-zA-Z0-9-_]/g, '_');
  return path.join(CHECKPOINT_DIR, `${safeName}.json`);
}

async function ensureCheckpointDir(): Promise<void> {
  if (!existsSync(CHECKPOINT_DIR)) {
    await mkdir(CHECKPOINT_DIR, { recursive: true });
  }
}

export async function saveCheckpoint(
  operation: string,
  data: {
    total: number;
    processed: number;
    failed: number;
    rateLimited?: number;
    lastProcessedId?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await ensureCheckpointDir();
  
  const checkpoint: Checkpoint = {
    operation,
    startedAt: data.metadata?.startedAt as string || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    total: data.total,
    processed: data.processed,
    failed: data.failed,
    lastProcessedId: data.lastProcessedId,
    metadata: { ...data.metadata, rateLimited: data.rateLimited },
  };
  
  const filePath = getCheckpointPath(operation);
  await writeFile(filePath, JSON.stringify(checkpoint, null, 2), 'utf-8');
}

export async function loadCheckpoint(operation: string): Promise<Checkpoint | null> {
  const filePath = getCheckpointPath(operation);
  
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as Checkpoint;
  } catch (error) {
    console.warn(`Failed to load checkpoint for ${operation}: ${(error as Error).message}`);
    return null;
  }
}

export async function deleteCheckpoint(operation: string): Promise<void> {
  const filePath = getCheckpointPath(operation);
  
  if (existsSync(filePath)) {
    try {
      await unlink(filePath);
    } catch (error) {
      console.warn(`Failed to delete checkpoint for ${operation}: ${(error as Error).message}`);
    }
  }
}

export async function listCheckpoints(): Promise<Checkpoint[]> {
  await ensureCheckpointDir();
  
  const checkpoints: Checkpoint[] = [];
  
  try {
    const files = await readdir(CHECKPOINT_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await readFile(path.join(CHECKPOINT_DIR, file), 'utf-8');
          const checkpoint = JSON.parse(content) as Checkpoint;
          checkpoints.push(checkpoint);
        } catch (error) {
          continue;
        }
      }
    }
  } catch (error) {
    return [];
  }
  
  return checkpoints;
}

export function getProgress(checkpoint: Checkpoint): number {
  if (checkpoint.total === 0) return 0;
  return Math.round((checkpoint.processed / checkpoint.total) * 100);
}

export function estimateTimeRemaining(checkpoint: Checkpoint): string | null {
  if (checkpoint.processed === 0) return null;
  
  const elapsed = new Date(checkpoint.lastUpdated).getTime() - new Date(checkpoint.startedAt).getTime();
  const rate = checkpoint.processed / elapsed;
  const remaining = checkpoint.total - checkpoint.processed;
  const remainingMs = remaining / rate;
  
  if (remainingMs < 60000) {
    return `${Math.round(remainingMs / 1000)}s`;
  } else if (remainingMs < 3600000) {
    return `${Math.round(remainingMs / 60000)}m`;
  } else {
    return `${Math.round(remainingMs / 3600000)}h`;
  }
}
