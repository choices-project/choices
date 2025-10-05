/**
 * Data Pipelines Module
 * 
 * Complete data pipeline system for government data ingestion, transformation,
 * and validation. Designed for batch processing with proper rate limiting
 * and API citizenship.
 */

export { 
  DataIngestionPipeline,
  createDataIngestionPipeline,
  defaultIngestionConfig,
  type IngestionConfig,
  type IngestionJob,
  type IngestionResult
} from './data-ingestion';

export { 
  DataTransformationPipeline,
  createDataTransformationPipeline,
  PRIORITY_STATES,
  GOVERNMENT_LEVELS,
  type GovernmentLevel,
  type DataTarget,
  type TransformationResult,
  type NormalizedRepresentative,
  type NormalizedBill
} from './data-transformation';

export { 
  DataValidationPipeline,
  createDataValidationPipeline,
  type ValidationRule,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ValidationFix,
  type DeduplicationResult
} from './data-validation';
