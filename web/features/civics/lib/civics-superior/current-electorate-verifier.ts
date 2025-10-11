/**
 * Current Electorate Verifier
 * Ensures all data ingestion uses system date for accurate current representative filtering
 * 
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */

export type CurrentElectorateVerification = {
  systemDate: Date;
  verificationTimestamp: string;
  representativeChecks: RepresentativeCheck[];
  summary: {
    totalChecked: number;
    currentCount: number;
    nonCurrentCount: number;
    accuracy: number;
  };
}

export type RepresentativeCheck = {
  name: string;
  office: string;
  isCurrent: boolean;
  reason: string;
  termStartDate?: string;
  termEndDate?: string;
  nextElectionDate?: string;
  lastUpdated?: string;
  systemDateUsed: Date;
}

export class CurrentElectorateVerifier {
  private systemDate: Date;
  
  constructor() {
    this.systemDate = new Date();
  }
  
  /**
   * Verify that a representative is current using system date
   */
  verifyCurrentRepresentative(rep: any): RepresentativeCheck {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    console.log(`🔍 VERIFYING: ${rep.name} is current representative...`);
    console.log(`   System Date: ${currentDate.toISOString()}`);
    console.log(`   Term Start: ${rep.termStartDate || rep.term_start_date}`);
    console.log(`   Term End: ${rep.termEndDate || rep.term_end_date}`);
    console.log(`   Next Election: ${rep.nextElectionDate || rep.next_election_date}`);
    console.log(`   Last Updated: ${rep.lastUpdated || rep.last_updated}`);
    
    // Check if representative has current term dates
    if (rep.termStartDate || rep.term_start_date) {
      const termStart = new Date(rep.termStartDate || rep.term_start_date);
      const termEnd = new Date(rep.termEndDate || rep.term_end_date);
      
      console.log(`   Term Start Date: ${termStart.toISOString()}`);
      console.log(`   Term End Date: ${termEnd.toISOString()}`);
      
      // Term must be current (started and not ended)
      if (termStart > currentDate) {
        console.log(`   ❌ Term hasn't started yet (${termStart.toISOString()} > ${currentDate.toISOString()})`);
        return {
          name: rep.name,
          office: rep.office || rep.office_name,
          isCurrent: false,
          reason: `Term hasn't started yet (${termStart.toISOString()} > ${currentDate.toISOString()})`,
          termStartDate: rep.termStartDate || rep.term_start_date,
          termEndDate: rep.termEndDate || rep.term_end_date,
          nextElectionDate: rep.nextElectionDate || rep.next_election_date,
          lastUpdated: rep.lastUpdated || rep.last_updated,
          systemDateUsed: currentDate
        };
      }
      if (termEnd < currentDate) {
        console.log(`   ❌ Term has expired (${termEnd.toISOString()} < ${currentDate.toISOString()})`);
        return {
          name: rep.name,
          office: rep.office || rep.office_name,
          isCurrent: false,
          reason: `Term has expired (${termEnd.toISOString()} < ${currentDate.toISOString()})`,
          termStartDate: rep.termStartDate || rep.term_start_date,
          termEndDate: rep.termEndDate || rep.term_end_date,
          nextElectionDate: rep.nextElectionDate || rep.next_election_date,
          lastUpdated: rep.lastUpdated || rep.last_updated,
          systemDateUsed: currentDate
        };
      }
      
      console.log(`   ✅ Term is current (${termStart.toISOString()} <= ${currentDate.toISOString()} <= ${termEnd.toISOString()})`);
    }
    
    // Check if representative has upcoming elections (indicates current)
    if (rep.nextElectionDate || rep.next_election_date) {
      const nextElection = new Date(rep.nextElectionDate || rep.next_election_date);
      console.log(`   Next Election: ${nextElection.toISOString()}`);
      // If next election is more than 2 years away, might be historical
      if (nextElection > new Date(currentYear + 2, 11, 31)) {
        console.log(`   ❌ Next election too far in future (${nextElection.toISOString()})`);
        return {
          name: rep.name,
          office: rep.office || rep.office_name,
          isCurrent: false,
          reason: `Next election too far in future (${nextElection.toISOString()})`,
          termStartDate: rep.termStartDate || rep.term_start_date,
          termEndDate: rep.termEndDate || rep.term_end_date,
          nextElectionDate: rep.nextElectionDate || rep.next_election_date,
          lastUpdated: rep.lastUpdated || rep.last_updated,
          systemDateUsed: currentDate
        };
      }
      console.log(`   ✅ Next election is reasonable (${nextElection.toISOString()})`);
    }
    
    // Check if representative has recent activity (within last 2 years)
    if (rep.lastUpdated || rep.last_updated) {
      const lastUpdated = new Date(rep.lastUpdated || rep.last_updated);
      const twoYearsAgo = new Date(currentYear - 2, 0, 1);
      console.log(`   Last Updated: ${lastUpdated.toISOString()}`);
      console.log(`   Two Years Ago: ${twoYearsAgo.toISOString()}`);
      if (lastUpdated < twoYearsAgo) {
        console.log(`   ❌ Last updated too long ago (${lastUpdated.toISOString()} < ${twoYearsAgo.toISOString()})`);
        return {
          name: rep.name,
          office: rep.office || rep.office_name,
          isCurrent: false,
          reason: `Last updated too long ago (${lastUpdated.toISOString()} < ${twoYearsAgo.toISOString()})`,
          termStartDate: rep.termStartDate || rep.term_start_date,
          termEndDate: rep.termEndDate || rep.term_end_date,
          nextElectionDate: rep.nextElectionDate || rep.next_election_date,
          lastUpdated: rep.lastUpdated || rep.last_updated,
          systemDateUsed: currentDate
        };
      }
      console.log(`   ✅ Last updated recently (${lastUpdated.toISOString()} >= ${twoYearsAgo.toISOString()})`);
    }
    
    // Check for known non-current officials
    const nonCurrentNames = [
      'Dianne Feinstein', // Deceased 2023
      'Kevin McCarthy',   // Resigned 2023
      'Kamala Harris'     // No longer VP
    ];
    
    if (nonCurrentNames.includes(rep.name)) {
      console.log(`   ❌ Known non-current official: ${rep.name}`);
      return {
        name: rep.name,
        office: rep.office || rep.office_name,
        isCurrent: false,
        reason: `Known non-current official: ${rep.name}`,
        termStartDate: rep.termStartDate || rep.term_start_date,
        termEndDate: rep.termEndDate || rep.term_end_date,
        nextElectionDate: rep.nextElectionDate || rep.next_election_date,
        lastUpdated: rep.lastUpdated || rep.last_updated,
        systemDateUsed: currentDate
      };
    }
    
    // If we get here, the representative passed all date checks
    console.log(`   ✅ Representative passed all current checks`);
    return {
      name: rep.name,
      office: rep.office || rep.office_name,
      isCurrent: true,
      reason: 'Passed all current representative checks',
      termStartDate: rep.termStartDate || rep.term_start_date,
      termEndDate: rep.termEndDate || rep.term_end_date,
      nextElectionDate: rep.nextElectionDate || rep.next_election_date,
      lastUpdated: rep.lastUpdated || rep.last_updated,
      systemDateUsed: currentDate
    };
  }
  
  /**
   * Verify multiple representatives and return summary
   */
  verifyRepresentatives(representatives: any[]): CurrentElectorateVerification {
    const representativeChecks: RepresentativeCheck[] = [];
    
    console.log(`🔍 VERIFYING ${representatives.length} representatives using system date...`);
    console.log(`   System Date: ${this.systemDate.toISOString()}`);
    
    for (const rep of representatives) {
      const check = this.verifyCurrentRepresentative(rep);
      representativeChecks.push(check);
    }
    
    const currentCount = representativeChecks.filter(check => check.isCurrent).length;
    const nonCurrentCount = representativeChecks.filter(check => !check.isCurrent).length;
    
    const verification: CurrentElectorateVerification = {
      systemDate: this.systemDate,
      verificationTimestamp: new Date().toISOString(),
      representativeChecks,
      summary: {
        totalChecked: representatives.length,
        currentCount,
        nonCurrentCount,
        accuracy: representatives.length > 0 ? (currentCount / representatives.length) * 100 : 0
      }
    };
    
    console.log(`📊 VERIFICATION SUMMARY:`);
    console.log(`   Total Checked: ${verification.summary.totalChecked}`);
    console.log(`   Current: ${verification.summary.currentCount}`);
    console.log(`   Non-Current: ${verification.summary.nonCurrentCount}`);
    console.log(`   Accuracy: ${verification.summary.accuracy.toFixed(2)}%`);
    
    return verification;
  }
  
  /**
   * Get system date information
   */
  getSystemDateInfo(): {
    systemDate: Date;
    isoString: string;
    year: number;
    month: number;
    day: number;
    timezone: string;
  } {
    return {
      systemDate: this.systemDate,
      isoString: this.systemDate.toISOString(),
      year: this.systemDate.getFullYear(),
      month: this.systemDate.getMonth() + 1,
      day: this.systemDate.getDate(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
}

export default CurrentElectorateVerifier;
