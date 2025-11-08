/**
 * OpenStates People Database Integration
 * Integrates 25,000+ YAML files with comprehensive representative data
 *
 * NOTE: This is NOT the OpenStates API (which has 250/day rate limits)
 * This is the OpenStates People Database - a comprehensive offline dataset
 *
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */
export interface OpenStatesPerson {
    id: string;
    name: string;
    given_name?: string;
    family_name?: string;
    middle_name?: string;
    suffix?: string;
    nickname?: string;
    birth_date?: string;
    death_date?: string;
    image?: string;
    gender?: string;
    biography?: string;
    party?: string;
    roles?: Array<{
        type: string;
        title: string;
        jurisdiction: string;
        start_date?: string;
        end_date?: string;
        district?: string;
        division?: string;
    }>;
    contact_details?: Array<{
        type: string;
        value: string;
        note?: string;
    }>;
    links?: Array<{
        url: string;
        note?: string;
    }>;
    sources?: Array<{
        url: string;
        note?: string;
    }>;
    other_identifiers?: Array<{
        scheme: string;
        identifier: string;
    }>;
    extras?: Record<string, any>;
}
export interface OpenStatesIntegrationConfig {
    dataPath: string;
    currentDate: Date;
}
export default class OpenStatesIntegration {
    private dataPath;
    private currentDate;
    private verifier;
    constructor(config: OpenStatesIntegrationConfig);
    /**
     * Map role type to appropriate title
     */
    private getRoleTitle;
    /**
     * Check if a person is currently in office
     */
    private isCurrentPerson;
    private isKnownNonCurrent;
    /**
     * Process state data and return only current representatives with comprehensive data
     */
    processStateData(stateCode: string, limit?: number): Promise<OpenStatesPerson[]>;
    private enhancePersonData;
    /**
     * Get all current representatives for a state
     */
    getCurrentRepresentatives(stateCode: string, limit?: number): Promise<OpenStatesPerson[]>;
    /**
     * Get representatives by role type
     */
    getRepresentativesByRole(stateCode: string, roleType: string): Promise<OpenStatesPerson[]>;
    /**
     * Get representatives by district
     */
    getRepresentativesByDistrict(stateCode: string, district: string): Promise<OpenStatesPerson[]>;
    /**
     * Get representatives by party
     */
    getRepresentativesByParty(stateCode: string, party: string): Promise<OpenStatesPerson[]>;
    /**
     * Search representatives by name
     */
    searchRepresentatives(stateCode: string, query: string): Promise<OpenStatesPerson[]>;
    /**
     * Get representative by ID
     */
    getRepresentativeById(stateCode: string, id: string): Promise<OpenStatesPerson | null>;
    /**
     * Get contact information for a representative
     */
    getContactInfo(person: OpenStatesPerson): Array<{
        type: string;
        value: string;
        note?: string;
    }>;
    /**
     * Get social media links for a representative
     */
    getSocialMediaLinks(person: OpenStatesPerson): Array<{
        url: string;
        note?: string;
    }>;
    /**
     * Get official sources for a representative
     */
    getOfficialSources(person: OpenStatesPerson): Array<{
        url: string;
        note?: string;
    }>;
    /**
     * Get current roles for a representative
     */
    getCurrentRoles(person: OpenStatesPerson): Array<{
        type: string;
        title: string;
        jurisdiction: string;
        start_date?: string;
        end_date?: string;
        district?: string;
        division?: string;
    }>;
    /**
     * Check if OpenStates People database is available
     */
    isDatabaseAvailable(): Promise<boolean>;
    /**
     * Get all available states
     */
    getAvailableStates(): Promise<string[]>;
    /**
     * Get statistics for a state
     */
    getStateStatistics(stateCode: string): Promise<{
        totalRepresentatives: number;
        byParty: Record<string, number>;
        byRole: Record<string, number>;
        byDistrict: Record<string, number>;
    }>;
    /**
     * Get integration status and capabilities
     */
    getIntegrationStatus(): Promise<{
        isAvailable: boolean;
        dataPath: string;
        currentDate: string;
        availableStates: string[];
        capabilities: string[];
        fallbackMode: boolean;
    }>;
    /**
     * Test the integration with a simple operation
     */
    testIntegration(): Promise<{
        success: boolean;
        message: string;
        details: any;
    }>;
}
//# sourceMappingURL=openstates-integration.d.ts.map