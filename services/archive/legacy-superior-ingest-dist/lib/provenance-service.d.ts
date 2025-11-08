/**
 * Provenance Service
 *
 * Service for data lineage tracking and provenance management
 * Enables complete audit trails and data transformation replay
 */
import type { DataSource } from './types';
export interface RawDataRecord {
    id: string;
    retrieved_at: string;
    request_url: string;
    api_version?: string;
    etag?: string;
    payload: Record<string, any>;
    md5_hash?: string;
    response_status?: number;
    response_headers?: Record<string, any>;
    processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
    processing_started_at?: string;
    processing_completed_at?: string;
    processing_error?: string;
    retry_count: number;
    max_retries: number;
    data_type?: string;
    cycle?: string | number;
    jurisdiction?: string;
    address?: string;
    congress?: string | number;
    created_at: string;
    updated_at: string;
}
export interface DataLineageRecord {
    id: string;
    source_table: string;
    source_record_id: string;
    target_table: string;
    target_record_id: string;
    transformation_type: 'insert' | 'update' | 'delete' | 'merge' | 'deduplicate';
    transformation_version: string;
    transformation_params?: Record<string, any>;
    source_data_hash?: string;
    target_data_hash?: string;
    processing_started_at: string;
    processing_completed_at?: string;
    processing_duration_ms?: number;
    success: boolean;
    error_message?: string;
    retry_count: number;
    created_at: string;
}
export interface DataQualityCheck {
    id: string;
    check_name: string;
    check_type: 'schema' | 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'uniqueness' | 'referential_integrity';
    table_name: string;
    record_id?: string;
    check_params?: Record<string, any>;
    expected_result?: string;
    actual_result?: string;
    passed: boolean;
    severity: 'error' | 'warning' | 'info';
    error_message?: string;
    suggested_fix?: string;
    check_executed_at: string;
    check_version: string;
    created_at: string;
}
export interface DataTransformation {
    id: string;
    transformation_name: string;
    transformation_version: string;
    source_system: string;
    target_system: string;
    transformation_sql?: string;
    transformation_params?: Record<string, any>;
    input_records_count?: number;
    output_records_count?: number;
    error_records_count?: number;
    processing_started_at: string;
    processing_completed_at?: string;
    processing_duration_ms?: number;
    success: boolean;
    error_message?: string;
    retry_count: number;
    created_at: string;
}
export interface DataChecksum {
    id: string;
    table_name: string;
    record_id: string;
    checksum_type: 'md5' | 'sha256' | 'crc32';
    checksum_value: string;
    data_snapshot?: Record<string, any>;
    calculated_at: string;
    created_at: string;
}
export interface ProvenanceData {
    source_names: DataSource[];
    source_urls: string[];
    retrieved_at: string[];
    transform_version: string;
    api_version?: string;
    etag?: string;
    md5_hash?: string;
    processing_status?: string;
    processing_error?: string;
    retry_count?: number;
}
export declare class ProvenanceService {
    private _supabase;
    private get supabase();
    /**
     * Get the Supabase client for testing purposes
     */
    getSupabaseClient(): any;
    /**
     * Store raw API data in staging
     */
    storeRawData(source: DataSource, requestUrl: string, payload: Record<string, any>, options?: {
        apiVersion?: string;
        etag?: string;
        responseStatus?: number;
        responseHeaders?: Record<string, any>;
        dataType?: string;
        cycle?: number;
        jurisdiction?: string;
        address?: string;
        congress?: number;
    }): Promise<string>;
    /**
     * Update processing status for raw data
     */
    updateProcessingStatus(source: DataSource, recordId: string, status: 'processing' | 'completed' | 'failed' | 'skipped', error?: string): Promise<void>;
    /**
     * Track data lineage between source and target records
     */
    trackDataLineage(sourceTable: string, sourceRecordId: string, targetTable: string, targetRecordId: string, transformationType: 'insert' | 'update' | 'delete' | 'merge' | 'deduplicate', transformationVersion: string, options?: {
        transformationParams?: Record<string, any>;
        sourceDataHash?: string;
        targetDataHash?: string;
    }): Promise<string>;
    /**
     * Get data lineage trail for a record
     */
    getDataLineageTrail(tableName: string, recordId: string): Promise<DataLineageRecord[]>;
    /**
     * Calculate and store data checksum
     */
    calculateAndStoreChecksum(tableName: string, recordId: string, checksumType?: 'md5' | 'sha256' | 'crc32'): Promise<string>;
    /**
     * Validate data quality for a record
     */
    validateDataQuality(tableName: string, recordId: string, checkVersion?: string): Promise<DataQualityCheck[]>;
    /**
     * Get raw data by ID
     */
    getRawData(source: DataSource, recordId: string): Promise<RawDataRecord | null>;
    /**
     * Get processing summary for a source
     */
    getProcessingSummary(source: DataSource): Promise<{
        total_records: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        skipped: number;
        success_rate: number;
    }>;
    /**
     * Get data quality summary
     */
    getDataQualitySummary(): Promise<Array<{
        table_name: string;
        check_type: string;
        total_checks: number;
        passed_checks: number;
        failed_checks: number;
        pass_rate: number;
        error_count: number;
        warning_count: number;
        info_count: number;
        last_check: string;
    }>>;
    /**
     * Create provenance data for a record
     */
    createProvenanceData(sourceNames: DataSource[], sourceUrls: string[], retrievedAt: string[], transformVersion: string, options?: {
        apiVersion?: string;
        etag?: string;
        md5Hash?: string;
        processingStatus?: string;
        processingError?: string;
        retryCount?: number;
    }): ProvenanceData;
    /**
     * Get provenance data from a record
     */
    getProvenanceData(record: any): ProvenanceData | null;
    /**
     * Calculate MD5 hash
     */
    private calculateMD5;
    /**
     * Get all staging processing summaries
     */
    getAllStagingSummaries(): Promise<Array<{
        source: string;
        total_records: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        skipped: number;
        success_rate: number;
    }>>;
}
export declare const provenanceService: ProvenanceService;
//# sourceMappingURL=provenance-service.d.ts.map