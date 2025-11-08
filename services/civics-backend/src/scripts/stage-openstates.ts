#!/usr/bin/env node
/**
 * Stage OpenStates YAML data into Supabase staging tables.
 *
 * This script loads the raw OpenStates People YAML files, normalises them,
 * and bulk upserts into the `openstates_people_*` tables. It is the first
 * step before running the SQL merge procedure
 * (`sync_representatives_from_openstates()`).
 */
import 'dotenv/config';

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

import { getSupabaseClient } from '../clients/supabase.js';

async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 3, delayMs = 500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        const wait = delayMs * attempt;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`${label} failed (attempt ${attempt}/${attempts}): ${message}. Retrying in ${wait}ms...`);
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

interface RawIdentifier {
  scheme?: string;
  identifier?: string;
  start_date?: string;
  end_date?: string;
}

interface RawOtherName {
  name?: string;
  start_date?: string;
  end_date?: string;
}

interface RawOffice {
  classification?: string;
  address?: string;
  voice?: string;
  fax?: string;
  email?: string;
  name?: string;
}

interface RawRole {
  type?: string;
  role?: string;
  jurisdiction?: string;
  district?: string;
  division_id?: string;
  start_date?: string;
  end_date?: string;
  end_reason?: string;
  title?: string;
}

interface RawSource {
  url?: string;
  note?: string;
}

interface RawContact {
  type?: string;
  value?: string;
  note?: string;
}

interface RawPerson {
  id: string;
  name: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  suffix?: string;
  gender?: string;
  birth_date?: string;
  death_date?: string;
  image?: string;
  biography?: string;
  party?: Array<{ name?: string }> | string;
  current_party?: boolean;
  extras?: Record<string, unknown>;
  updated_at?: string;
  other_names?: RawOtherName[];
  identifiers?: RawIdentifier[];
  roles?: RawRole[];
  sources?: RawSource[];
  contact_details?: RawContact[];
  links?: Array<{ url?: string; note?: string }>;
  ids?: Record<string, string>;
  social_media?: Array<{ platform?: string; username?: string }>;
  offices?: RawOffice[];
}

interface StagedPerson {
  openstatesId: string;
  person: {
    openstates_id: string;
    name: string;
    given_name: string | null;
    family_name: string | null;
    middle_name: string | null;
    nickname: string | null;
    suffix: string | null;
    gender: string | null;
    birth_date: string | null;
    death_date: string | null;
    biography: string | null;
    image_url: string | null;
    party: string | null;
    current_party: boolean | null;
    extras: Record<string, unknown> | null;
    updated_at: string | null;
  };
  contacts: Array<{
    contact_type: string;
    value: string;
    note: string | null;
  }>;
  roles: Array<{
    role_type: string;
    title: string | null;
    member_role: string | null;
    jurisdiction: string;
    district: string | null;
    division: string | null;
    start_date: string | null;
    end_date: string | null;
    end_reason: string | null;
    is_current: boolean;
  }>;
  identifiers: Array<{
    scheme: string;
    identifier: string;
    start_date: string | null;
    end_date: string | null;
  }>;
  otherNames: Array<{
    name: string;
    start_date: string | null;
    end_date: string | null;
  }>;
  socials: Array<{
    platform: string;
    username: string;
  }>;
  sources: Array<{
    source_type: string;
    url: string;
    note: string | null;
  }>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVICE_ROOT = path.resolve(__dirname, '../..');
const WORKSPACE_ROOT = path.resolve(SERVICE_ROOT, '..');
const DEFAULT_CANDIDATES = [
  path.resolve(SERVICE_ROOT, 'data/openstates-people/data'),
  path.resolve(WORKSPACE_ROOT, 'data/openstates-people/data'),
];

const UPSERT_BATCH_SIZE = Number(process.env.OPENSTATES_STAGE_UPSERT_SIZE ?? '50');
const SELECT_BATCH_SIZE = Number(process.env.OPENSTATES_STAGE_SELECT_SIZE ?? '50');
const INSERT_BATCH_SIZE = Number(process.env.OPENSTATES_STAGE_INSERT_SIZE ?? '200');

const CONTACT_TYPE_NORMALISATION: Record<string, string> = {
  voice: 'voice',
  phone: 'phone',
  telephone: 'phone',
  main: 'phone',
  fax: 'fax',
  email: 'email',
  'email address': 'email',
  url: 'url',
  website: 'url',
  'home page': 'url',
  address: 'address',
  office: 'address',
};

const SOCIAL_KEYS = ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'tiktok'];

const client = getSupabaseClient();

function truncate(value: unknown, max = 100): string | null {
  if (!value) return null;
  const stringValue = typeof value === 'string' ? value : String(value);
  const trimmed = stringValue.trim();
  if (trimmed.length <= max) return trimmed;
  if (max <= 1) return trimmed.slice(0, max);
  return `${trimmed.slice(0, max - 1)}…`;
}

function compressJurisdiction(jurisdiction: string | null | undefined): string | null {
  if (!jurisdiction) return null;
  const normalized = jurisdiction.trim();
  const match = normalized.match(/state:([a-z]{2})/i);
  if (match?.[1]) {
    const state = match[1].toLowerCase();
    return `state:${state}`;
  }
  return truncate(normalized, 48);
}
function normaliseParty(raw: RawPerson['party']): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw[0]?.name ?? null;
  }
  return null;
}

function extractIdentifiers(person: RawPerson): StagedPerson['identifiers'] {
  const rows: StagedPerson['identifiers'] = [];
  if (Array.isArray(person.identifiers)) {
    for (const entry of person.identifiers) {
      if (!entry.scheme || !entry.identifier) continue;
      rows.push({
        scheme: entry.scheme,
        identifier: String(entry.identifier),
        start_date: entry.start_date ?? null,
        end_date: entry.end_date ?? null,
      });
    }
  }
  if (person.ids && typeof person.ids === 'object') {
    for (const [scheme, value] of Object.entries(person.ids)) {
      if (!value) continue;
      rows.push({
        scheme,
        identifier: value,
        start_date: null,
        end_date: null,
      });
    }
  }
  return rows;
}

function extractOtherNames(person: RawPerson): StagedPerson['otherNames'] {
  if (!Array.isArray(person.other_names)) return [];
  return person.other_names
    .filter((entry): entry is RawOtherName & { name: string } => Boolean(entry?.name))
    .map((entry) => ({
      name: entry.name as string,
      start_date: entry.start_date ?? null,
      end_date: entry.end_date ?? null,
    }));
}

function isRoleCurrent(role: RawRole): boolean {
  if (!role) return false;
  if (!role.end_date) return true;
  const end = new Date(role.end_date);
  if (Number.isNaN(end.getTime())) return false;
  return end >= new Date();
}

function extractRoles(person: RawPerson): StagedPerson['roles'] {
  if (!Array.isArray(person.roles)) return [];
  return person.roles
    .filter((role): role is RawRole => Boolean(role?.jurisdiction))
    .map((role) => ({
      role_type: truncate(role.type ?? 'unknown', 50) ?? 'unknown',
      title: truncate(role.title ?? null, 100),
      member_role: truncate(role.role ?? null, 100),
      jurisdiction: compressJurisdiction(role.jurisdiction) ?? '',
      district: truncate(role.district ?? null, 50),
      division: truncate(role.division_id ?? null, 100),
      start_date: role.start_date ?? null,
      end_date: role.end_date ?? null,
      end_reason: truncate(role.end_reason ?? null, 100),
      is_current: isRoleCurrent(role),
    }));
}

function extractContacts(person: RawPerson): StagedPerson['contacts'] {
  const rows: StagedPerson['contacts'] = [];
  const pushContact = (type: string, value: string | null, note: string | null) => {
    if (!value) return;
    const normalised = CONTACT_TYPE_NORMALISATION[type] ?? type;
    rows.push({
      contact_type: normalised,
      value,
      note,
    });
  };

  if (Array.isArray(person.contact_details)) {
    for (const entry of person.contact_details) {
      if (!entry?.value) continue;
      const type = entry.type ? entry.type.toLowerCase() : 'other';
      pushContact(type, truncate(String(entry.value), 255), truncate(entry.note ?? null, 255));
    }
  }

  if (Array.isArray(person.offices)) {
    for (const office of person.offices) {
      const note = truncate(office.name ?? office.classification ?? null, 255);
      pushContact('address', truncate(office.address ?? null, 255), note);
      pushContact('phone', truncate(office.voice ?? null, 100), note);
      pushContact('fax', truncate(office.fax ?? null, 100), note);
      pushContact('email', truncate(office.email ?? null, 255), note);
    }
  }

  const deduped = new Map<string, StagedPerson['contacts'][number]>();
  for (const contact of rows) {
    const key = `${contact.contact_type}:${contact.value.toLowerCase()}`;
    if (!deduped.has(key)) {
      deduped.set(key, contact);
    }
  }

  return Array.from(deduped.values());
}

function extractSocials(person: RawPerson): StagedPerson['socials'] {
  const rows: StagedPerson['socials'] = [];
  if (Array.isArray(person.social_media)) {
    for (const entry of person.social_media) {
      if (!entry?.platform || !entry?.username) continue;
      rows.push({
        platform: entry.platform.toLowerCase(),
        username: entry.username,
      });
    }
  }
  if (person.ids && typeof person.ids === 'object') {
    for (const key of SOCIAL_KEYS) {
      const value = person.ids[key];
      if (!value) continue;
      rows.push({
        platform: key,
        username: value.replace(/^@/, ''),
      });
    }
  }
  return rows;
}

function extractSources(person: RawPerson): StagedPerson['sources'] {
  const rows: StagedPerson['sources'] = [];

  if (Array.isArray(person.sources)) {
    for (const source of person.sources) {
      if (!source?.url) continue;
      rows.push({
        source_type: source.note ? source.note.toLowerCase() : 'external',
        url: truncate(source.url, 255) ?? '',
        note: truncate(source.note ?? null, 255),
      });
    }
  }

  if (Array.isArray(person.links)) {
    for (const link of person.links) {
      if (!link?.url) continue;
      rows.push({
        source_type: 'link',
        url: truncate(link.url, 255) ?? '',
        note: truncate(link.note ?? null, 255),
      });
    }
  }

  return rows;
}

function parsePerson(filePath: string, raw: RawPerson): StagedPerson {
  const openstatesId = raw.id;
  if (!openstatesId || !raw.name) {
    throw new Error(`Invalid OpenStates record in ${filePath}`);
  }

  const person: StagedPerson = {
    openstatesId,
    person: {
      openstates_id: openstatesId,
      name: raw.name,
      given_name: raw.given_name ?? null,
      family_name: raw.family_name ?? null,
      middle_name: raw.middle_name ?? null,
      nickname: raw.nickname ?? null,
      suffix: raw.suffix ?? null,
      gender: raw.gender ?? null,
      birth_date: raw.birth_date ?? null,
      death_date: raw.death_date ?? null,
      biography: raw.biography ?? null,
      image_url: raw.image ?? null,
      party: normaliseParty(raw.party),
      current_party: raw.current_party ?? null,
      extras: raw.extras ?? null,
      updated_at: raw.updated_at ?? null,
    },
    contacts: extractContacts(raw),
    roles: extractRoles(raw),
    identifiers: extractIdentifiers(raw),
    otherNames: extractOtherNames(raw),
    socials: extractSocials(raw),
    sources: extractSources(raw),
  };

  return person;
}

async function resolvePeopleRoot(): Promise<string> {
  const explicitPath = process.env.OPENSTATES_PEOPLE_DIR ?? process.env.OPENSTATES_PEOPLE_PATH;
  const candidates = explicitPath
    ? [explicitPath, ...DEFAULT_CANDIDATES]
    : DEFAULT_CANDIDATES;

  for (const candidate of candidates) {
    try {
      const stats = await stat(candidate);
      if (stats.isDirectory()) {
        return candidate;
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `Unable to locate OpenStates People dataset. Checked:\n` +
      candidates.map((p) => `  - ${p}`).join('\n') +
      `\nSet the OPENSTATES_PEOPLE_DIR environment variable to the directory containing the YAML files.`,
  );
}

async function loadAllPeople(peopleRoot: string): Promise<StagedPerson[]> {
  const states = await readdir(peopleRoot, { withFileTypes: true });
  const records: StagedPerson[] = [];

  for (const stateDir of states) {
    if (!stateDir.isDirectory()) continue;
    const statePath = path.join(peopleRoot, stateDir.name);

    const categories = await readdir(statePath, { withFileTypes: true }).catch(() => []);
    for (const categoryDir of categories) {
      if (!categoryDir.isDirectory()) continue;
      const categoryPath = path.join(statePath, categoryDir.name);
      const files = await readdir(categoryPath, { withFileTypes: true }).catch(() => []);

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith('.yml')) continue;
        const filePath = path.join(categoryPath, file.name);
        const rawYaml = await readFile(filePath, 'utf8');
        const parsed = yaml.load(rawYaml) as RawPerson | undefined;
        if (!parsed || typeof parsed !== 'object') continue;

        try {
          records.push(parsePerson(filePath, parsed));
        } catch (error) {
          console.warn(`Skipping ${filePath}: ${(error as Error).message}`);
        }
      }
    }
  }

  return records;
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

async function upsertPeopleData(people: StagedPerson[]) {
  const rows = people.map((entry) => entry.person);
  const chunks = chunk(rows, UPSERT_BATCH_SIZE);
  const idMap = new Map<string, number>();

  for (const batch of chunks) {
    await withRetry(async () => {
      const { error: upsertError } = await client
        .from('openstates_people_data')
        .upsert(batch, { onConflict: 'openstates_id' });
      if (upsertError) {
        throw upsertError;
      }
    }, 'upsert people_data');

    const idChunks = chunk(batch.map((item) => item.openstates_id), SELECT_BATCH_SIZE);
    for (const idChunk of idChunks) {
      await withRetry(async () => {
        const { data, error: selectError } = await client
          .from('openstates_people_data')
          .select('id, openstates_id')
          .in('openstates_id', idChunk);
        if (selectError) {
          throw selectError;
        }
        for (const row of data ?? []) {
          idMap.set(row.openstates_id, row.id);
        }
      }, 'select people_data ids');
    }
  }

  return idMap;
}

async function replaceChildRows<T extends { openstates_person_id: number }>(
  table: string,
  rows: T[],
  representativeIds: number[],
) {
  const idChunks = chunk(representativeIds, 100);
  for (const ids of idChunks) {
    const { error } = await client.from(table).delete().in('openstates_person_id', ids);
    if (error) {
      throw new Error(`Failed to clear ${table}: ${error.message}`);
    }
  }

  const rowChunks = chunk(rows, INSERT_BATCH_SIZE);
  for (const batch of rowChunks) {
    if (batch.length === 0) continue;
    const { error } = await client.from(table).insert(batch);
    if (error) {
      const sample = batch[0] ?? {};
      throw new Error(
        `Failed to insert into ${table}: ${error.message}\nSample row: ${JSON.stringify(sample).slice(0, 500)}`,
      );
    }
  }
}

async function stageContacts(people: StagedPerson[], idMap: Map<string, number>) {
  const rows: Array<{ openstates_person_id: number; contact_type: string; value: string; note: string | null }> = [];
  for (const person of people) {
    const personId = idMap.get(person.openstatesId);
    if (!personId) continue;

    const seen = new Set<string>();
    for (const contact of person.contacts) {
      if (!contact.value) continue;
      const key = `${contact.contact_type}:${contact.value.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        openstates_person_id: personId,
        contact_type: contact.contact_type,
        value: contact.value,
        note: contact.note,
      });
    }
  }

  await replaceChildRows('openstates_people_contacts', rows, Array.from(idMap.values()));
}

async function stageRoles(people: StagedPerson[], idMap: Map<string, number>) {
  const rows: Array<{
    openstates_person_id: number;
    role_type: string;
    title: string | null;
    member_role: string | null;
    jurisdiction: string;
    district: string | null;
    division: string | null;
    start_date: string | null;
    end_date: string | null;
    end_reason: string | null;
    is_current: boolean | null;
  }> = [];

  for (const person of people) {
    const personId = idMap.get(person.openstatesId);
    if (!personId) continue;

    for (const role of person.roles) {
      rows.push({
        openstates_person_id: personId,
        role_type: role.role_type,
        title: role.title,
        member_role: role.member_role,
        jurisdiction: role.jurisdiction,
        district: role.district,
        division: role.division,
        start_date: role.start_date,
        end_date: role.end_date,
        end_reason: role.end_reason,
        is_current: role.is_current,
      });
    }
  }

  await replaceChildRows('openstates_people_roles', rows, Array.from(idMap.values()));
}

async function stageIdentifiers(people: StagedPerson[], idMap: Map<string, number>) {
  const rows: Array<{
    openstates_person_id: number;
    scheme: string;
    identifier: string;
    start_date: string | null;
    end_date: string | null;
  }> = [];

  for (const person of people) {
    const personId = idMap.get(person.openstatesId);
    if (!personId) continue;

    const seen = new Set<string>();
    for (const identifier of person.identifiers) {
      const key = `${identifier.scheme}:${identifier.identifier}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        openstates_person_id: personId,
        scheme: identifier.scheme,
        identifier: identifier.identifier,
        start_date: identifier.start_date,
        end_date: identifier.end_date,
      });
    }
  }

  await replaceChildRows('openstates_people_identifiers', rows, Array.from(idMap.values()));
}

async function stageOtherNames(people: StagedPerson[], idMap: Map<string, number>) {
  const rows: Array<{
    openstates_person_id: number;
    name: string;
    start_date: string | null;
    end_date: string | null;
  }> = [];

  for (const person of people) {
    const personId = idMap.get(person.openstatesId);
    if (!personId) continue;

    for (const entry of person.otherNames) {
      rows.push({
        openstates_person_id: personId,
        name: entry.name,
        start_date: entry.start_date,
        end_date: entry.end_date,
      });
    }
  }

  await replaceChildRows('openstates_people_other_names', rows, Array.from(idMap.values()));
}

async function stageSocials(people: StagedPerson[], idMap: Map<string, number>) {
  const rows: Array<{
    openstates_person_id: number;
    platform: string;
    username: string;
  }> = [];

  for (const person of people) {
    const personId = idMap.get(person.openstatesId);
    if (!personId) continue;

    const seen = new Set<string>();
    for (const social of person.socials) {
      if (!social.username) continue;
      const platform = social.platform.toLowerCase();
      const key = `${platform}:${social.username}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        openstates_person_id: personId,
        platform,
        username: social.username,
      });
    }
  }

  await replaceChildRows('openstates_people_social_media', rows, Array.from(idMap.values()));
}

async function stageSources(people: StagedPerson[], idMap: Map<string, number>) {
  const rows: Array<{
    openstates_person_id: number;
    source_type: string;
    url: string;
    note: string | null;
  }> = [];

  for (const person of people) {
    const personId = idMap.get(person.openstatesId);
    if (!personId) continue;

    const seen = new Set<string>();
    for (const source of person.sources) {
      const key = source.url;
      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        openstates_person_id: personId,
        source_type: source.source_type,
        url: source.url,
        note: source.note,
      });
    }
  }

  await replaceChildRows('openstates_people_sources', rows, Array.from(idMap.values()));
}

async function main() {
  let peopleRoot: string;
  try {
    peopleRoot = await resolvePeopleRoot();
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
    return;
  }

  console.log(`Loading OpenStates YAML from ${peopleRoot}...`);
  const people = await loadAllPeople(peopleRoot);
  console.log(`Loaded ${people.length} OpenStates person records.`);

  if (people.length === 0) {
    console.log('No records found. Exiting.');
    return;
  }

  console.log('Upserting openstates_people_data...');
  const idMap = await upsertPeopleData(people);
  console.log(`Mapped ${idMap.size} OpenStates IDs to Supabase IDs.`);

  console.log('Syncing contacts...');
  await stageContacts(people, idMap);
  console.log('Contacts staged.');

  console.log('Syncing roles...');
  await stageRoles(people, idMap);
  console.log('Roles staged.');

  console.log('Syncing identifiers...');
  await stageIdentifiers(people, idMap);
  console.log('Identifiers staged.');

  console.log('Syncing alternate names...');
  await stageOtherNames(people, idMap);
  console.log('Other names staged.');

  console.log('Syncing social media handles...');
  await stageSocials(people, idMap);
  console.log('Social media staged.');

  console.log('Syncing source references...');
  await stageSources(people, idMap);
  console.log('Sources staged.');

  console.log('OpenStates staging complete. You can now run:');
  console.log('  select sync_representatives_from_openstates();');
}

main().catch((error) => {
  console.error('OpenStates staging failed:', error);
  process.exit(1);
});

