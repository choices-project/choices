/**
 * Congress.gov Data Transformers
 * 
 * Transform raw Congress.gov API responses into normalized data structures
 */

import { CongressGovMember, CongressGovBill, CongressGovVote } from './client';

export interface NormalizedRepresentative {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  party: string;
  state: string;
  district?: string;
  chamber: 'house' | 'senate';
  url: string;
  source: 'congress-gov';
  lastUpdated: string;
}

export interface NormalizedBill {
  id: string;
  title: string;
  shortTitle?: string;
  billType: string;
  number: string;
  congress: number;
  introducedDate: string;
  sponsor: {
    id: string;
    name: string;
    party: string;
    state: string;
  };
  subjects: string[];
  summary?: string;
  url: string;
  source: 'congress-gov';
  lastUpdated: string;
}

export interface NormalizedVote {
  id: string;
  billId?: string;
  chamber: 'house' | 'senate';
  congress: number;
  session: number;
  question: string;
  description: string;
  voteType: string;
  date: string;
  result: string;
  url: string;
  source: 'congress-gov';
  lastUpdated: string;
}

/**
 * Transform Congress.gov member data to normalized format
 */
export function transformCongressGovMember(member: CongressGovMember): NormalizedRepresentative {
  return {
    id: member.bioguideId,
    name: member.fullName,
    firstName: member.firstName,
    lastName: member.lastName,
    party: member.party,
    state: member.state,
    district: member.district,
    chamber: member.chamber.toLowerCase() as 'house' | 'senate',
    url: member.url,
    source: 'congress-gov',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Transform Congress.gov bill data to normalized format
 */
export function transformCongressGovBill(bill: CongressGovBill): NormalizedBill {
  return {
    id: bill.billId,
    title: bill.title,
    shortTitle: bill.shortTitle,
    billType: bill.billType,
    number: bill.number,
    congress: bill.congress,
    introducedDate: bill.introducedDate,
    sponsor: {
      id: bill.sponsor.bioguideId,
      name: bill.sponsor.fullName,
      party: bill.sponsor.party,
      state: bill.sponsor.state
    },
    subjects: bill.subjects,
    summary: bill.summary?.text,
    url: bill.url,
    source: 'congress-gov',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Transform Congress.gov vote data to normalized format
 */
export function transformCongressGovVote(vote: CongressGovVote): NormalizedVote {
  return {
    id: `${vote.congress}-${vote.session}-${vote.rollCall}`,
    chamber: vote.chamber.toLowerCase() as 'house' | 'senate',
    congress: vote.congress,
    session: vote.session,
    question: vote.question,
    description: vote.description,
    voteType: vote.voteType,
    date: vote.date,
    result: vote.result,
    url: vote.url,
    source: 'congress-gov',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Transform multiple Congress.gov members
 */
export function transformCongressGovMembers(members: CongressGovMember[]): NormalizedRepresentative[] {
  return members.map(transformCongressGovMember);
}

/**
 * Transform multiple Congress.gov bills
 */
export function transformCongressGovBills(bills: CongressGovBill[]): NormalizedBill[] {
  return bills.map(transformCongressGovBill);
}

/**
 * Transform multiple Congress.gov votes
 */
export function transformCongressGovVotes(votes: CongressGovVote[]): NormalizedVote[] {
  return votes.map(transformCongressGovVote);
}
