/**
 * Current Electorate Verifier
 * Ensures all data ingestion uses system date for accurate current representative filtering
 *
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */
export interface CurrentElectorateVerification {
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
export interface RepresentativeCheck {
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
export declare class CurrentElectorateVerifier {
    private systemDate;
    constructor();
    /**
     * Verify that a representative is current using system date
     */
    verifyCurrentRepresentative(rep: any): RepresentativeCheck;
    /**
     * Verify multiple representatives and return summary
     */
    verifyRepresentatives(representatives: any[]): CurrentElectorateVerification;
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
    };
}
export default CurrentElectorateVerifier;
//# sourceMappingURL=current-electorate-verifier.d.ts.map