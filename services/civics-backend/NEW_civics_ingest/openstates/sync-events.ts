#!/usr/bin/env node
/**
 * Sync legislative events (hearings, floor sessions, etc.) from OpenStates API.
 * 
 * Usage:
 *   npm run openstates:sync:events [--states=CA,NY] [--start-date=2024-01-01] [--end-date=2024-12-31] [--dry-run]
 */
import 'dotenv/config';

import { fetchEvents, getOpenStatesUsageStats } from '../clients/openstates.js';
import { deriveJurisdictionFilter } from '../enrich/state.js';
import { collectActiveRepresentatives, type CollectOptions } from '../ingest/openstates/index.js';
import { getSupabaseClient } from '../clients/supabase.js';

type CliOptions = {
  states?: string[];
  startDate?: string;
  endDate?: string;
  dryRun?: boolean;
};

function parseArgs(): CliOptions {
  const options: CliOptions = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg || !arg.startsWith('--')) continue;

    const [flag, raw] = arg.includes('=') ? arg.slice(2).split('=') : [arg.slice(2), args[i + 1]];
    const value = raw && !raw.startsWith('--') ? raw : undefined;

    switch (flag) {
      case 'states':
        if (value) {
          options.states = value
            .split(',')
            .map((state) => state.trim().toUpperCase())
            .filter(Boolean);
        }
        break;
      case 'start-date':
        if (value) options.startDate = value;
        break;
      case 'end-date':
        if (value) options.endDate = value;
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      default:
        break;
    }

    if (raw && !arg.includes('=')) {
      i += 1;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  
  // Default to next 30 days if no dates provided
  const today = new Date();
  const endDate = options.endDate || new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const startDate = options.startDate || today.toISOString().split('T')[0];

  console.log(
    `\n📅 Syncing legislative events from ${startDate} to ${endDate}${
      options.states?.length ? ` for ${options.states.join(', ')}` : ''
    }${options.dryRun ? ' (DRY RUN)' : ''}...\n`,
  );

  // Check API usage
  const stats = getOpenStatesUsageStats();
  if (stats.remaining <= 0) {
    console.warn(`OpenStates API daily limit reached (${stats.dailyRequests}/${stats.dailyLimit}). Cannot proceed.`);
    return;
  }

  console.log(`API usage: ${stats.dailyRequests}/${stats.dailyLimit} (${stats.remaining} remaining)\n`);

  const jurisdictions = new Set<string>();
  
  // If states specified, get jurisdictions
  if (options.states && options.states.length > 0) {
    const stateOptions: CollectOptions = { states: options.states };
    const reps = await collectActiveRepresentatives(stateOptions);
    for (const rep of reps) {
      const jurisdiction = deriveJurisdictionFilter(rep);
      if (jurisdiction) {
        jurisdictions.add(jurisdiction);
      }
    }
  }

  let totalEvents = 0;
  let totalStored = 0;
  let totalSkipped = 0;

  // Fetch events for each jurisdiction
  const client = getSupabaseClient();
  const timestamp = new Date().toISOString();
  const seenEvents = new Set<string>(); // Deduplicate across jurisdictions

  // If no jurisdictions found and no states specified, we need to fetch all jurisdictions
  // OpenStates API requires jurisdiction parameter, so we can't fetch without it
  if (jurisdictions.size === 0 && (!options.states || options.states.length === 0)) {
    console.warn('⚠️  No jurisdictions found. Events sync requires either --states parameter or representatives with jurisdictions.');
    console.warn('   Skipping events sync. Use --states=CA,NY to specify states.');
    console.log(`\n✅ Events sync complete (skipped - no jurisdictions).\n`);
    return;
  }

  for (const jurisdiction of Array.from(jurisdictions)) {
    let jurisdictionSkipped = 0;
    try {
      const events = await fetchEvents({
        jurisdiction,
        startDate,
        endDate,
      });

      totalEvents += events.length;

      if (options.dryRun) {
        let wouldStore = 0;
        for (const event of events) {
          const participants = event.participants || [];
          for (const participant of participants) {
            if (participant.person?.id) {
              wouldStore += 1;
            }
          }
        }
        console.log(`[dry-run] Would store ${wouldStore} event assignments for ${events.length} events (${jurisdiction || 'all jurisdictions'})`);
        continue;
      }

      // Store events in representative_activity table
      for (const event of events) {
        // Deduplicate events by ID
        if (seenEvents.has(event.id)) {
          continue;
        }
        seenEvents.add(event.id);

        // Find participants who are representatives
        const participants = event.participants || [];
        for (const participant of participants) {
          if (!participant.person?.id) continue;

          // Find representative by openstates_id
          const { data: rep } = await client
            .from('representatives_core')
            .select('id')
            .eq('openstates_id', participant.person.id)
            .eq('status', 'active')
            .limit(1)
            .single();

          if (!rep) {
            jurisdictionSkipped += 1;
            continue;
          }

          // Store as activity
          // Use metadata.openstates_event_id + representative_id for deduplication
          const { error } = await client.from('representative_activity').upsert({
            representative_id: rep.id,
            type: 'event',
            title: event.name,
            description: event.description || null,
            date: event.start_date || null,
            source: 'openstates',
            source_url: event.id ? `https://openstates.org/events/${event.id}` : null,
            url: event.id ? `https://openstates.org/events/${event.id}` : null,
            metadata: {
              openstates_event_id: event.id,
              event_type: event.extras?.event_type || null,
              location: event.location || null,
              participant_role: participant.role || null,
              agenda: event.agenda || null,
            },
            created_at: timestamp,
            updated_at: timestamp,
          }, {
            onConflict: 'representative_id,type,date,source',
            ignoreDuplicates: false, // Update existing records
          });

          if (!error) {
            totalStored += 1;
          } else {
            console.warn(`Failed to store event for rep ${rep.id}:`, error.message);
          }
        }
      }
      totalSkipped += jurisdictionSkipped;
    } catch (error) {
      console.error(`Failed to fetch events for ${jurisdiction}:`, (error as Error).message);
    }
  }

  const finalStats = getOpenStatesUsageStats();
  console.log(`\n✅ Events sync complete.`);
  console.log(`   Events fetched: ${totalEvents}`);
  console.log(`   Event assignments stored: ${totalStored}`);
  if (totalSkipped > 0) {
    console.log(`   Skipped (no matching rep): ${totalSkipped}`);
  }
  console.log(`   Final API usage: ${finalStats.dailyRequests}/${finalStats.dailyLimit} (${finalStats.remaining} remaining)\n`);
}

main().catch((error) => {
  console.error('Events sync failed:', error);
  process.exit(1);
});
