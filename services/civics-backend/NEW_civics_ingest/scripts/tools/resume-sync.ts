#!/usr/bin/env node
/**
 * Resume interrupted sync operations from checkpoints.
 * 
 * Lists available checkpoints and allows resuming operations:
 * - OpenStates activity sync
 * - OpenStates committees sync
 * - FEC enrichment
 * 
 * Usage:
 *   npm run tools:resume:sync [operation] [--checkpoint=path]
 */
import { loadEnv } from '../../utils/load-env.js';
loadEnv();

import { listCheckpoints, loadCheckpoint, getProgress, estimateTimeRemaining } from '../../utils/checkpoint.js';

async function listAvailableCheckpoints(): Promise<void> {
  console.log('\n📋 Available Checkpoints');
  console.log('='.repeat(60));
  
  const checkpoints = await listCheckpoints();
  
  if (checkpoints.length === 0) {
    console.log('No checkpoints found.');
    return;
  }
  
  for (const checkpoint of checkpoints) {
    const progress = getProgress(checkpoint);
    const timeRemaining = estimateTimeRemaining(checkpoint);
    const elapsed = new Date(checkpoint.lastUpdated).getTime() - new Date(checkpoint.startedAt).getTime();
    const elapsedMinutes = Math.round(elapsed / 60000);
    
    console.log(`\n   ${checkpoint.operation}:`);
    console.log(`     Progress: ${checkpoint.processed}/${checkpoint.total} (${progress}%)`);
    console.log(`     Failed: ${checkpoint.failed}`);
    if (checkpoint.lastProcessedId) {
      console.log(`     Last processed ID: ${checkpoint.lastProcessedId}`);
    }
    console.log(`     Started: ${new Date(checkpoint.startedAt).toLocaleString()}`);
    console.log(`     Last updated: ${new Date(checkpoint.lastUpdated).toLocaleString()} (${elapsedMinutes}m ago)`);
    if (timeRemaining) {
      console.log(`     Estimated remaining: ${timeRemaining}`);
    }
  }
  
  console.log('\n💡 To resume an operation:');
  console.log('   npm run openstates:sync:activity -- --resume');
  console.log('   npm run openstates:sync:committees -- --resume');
  console.log('   npm run federal:enrich:finance -- --resume');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--list' || args[0] === 'list') {
    await listAvailableCheckpoints();
    return;
  }
  
  const operation = args[0];
  const checkpoint = await loadCheckpoint(operation);
  
  if (!checkpoint) {
    console.error(`❌ No checkpoint found for operation: ${operation}`);
    console.log('\nAvailable operations:');
    const allCheckpoints = await listCheckpoints();
    for (const cp of allCheckpoints) {
      console.log(`   - ${cp.operation}`);
    }
    process.exit(1);
  }
  
  console.log(`\n📋 Checkpoint for ${operation}:`);
  console.log('='.repeat(60));
  console.log(`   Progress: ${checkpoint.processed}/${checkpoint.total} (${getProgress(checkpoint)}%)`);
  console.log(`   Failed: ${checkpoint.failed}`);
  if (checkpoint.lastProcessedId) {
    console.log(`   Last processed ID: ${checkpoint.lastProcessedId}`);
  }
  console.log(`   Started: ${new Date(checkpoint.startedAt).toLocaleString()}`);
  console.log(`   Last updated: ${new Date(checkpoint.lastUpdated).toLocaleString()}`);
  
  const timeRemaining = estimateTimeRemaining(checkpoint);
  if (timeRemaining) {
    console.log(`   Estimated remaining: ${timeRemaining}`);
  }
  
  if (checkpoint.metadata) {
    console.log(`\n   Metadata:`);
    for (const [key, value] of Object.entries(checkpoint.metadata)) {
      if (key !== 'startedAt') {
        console.log(`     ${key}: ${JSON.stringify(value)}`);
      }
    }
  }
  
  console.log('\n💡 To resume this operation, use the --resume flag:');
  console.log(`   npm run ${operation} -- --resume`);
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
