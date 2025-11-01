/**
 * Voting Method Type Mapping
 * 
 * Maps between database enum values and UI display values to resolve
 * the drift between DB schema and code expectations.
 */

export type DbVotingMethod = 'single'|'multiple'|'approval'|'ranked'|'range'|'quadratic';
export type UiVotingMethod = 'single'|'multiple'|'approval'|'ranked'|'range'|'quadratic';

export const mapDbToUi: Record<DbVotingMethod, UiVotingMethod> = {
  single: 'single',
  multiple: 'multiple',
  approval: 'approval',
  ranked: 'ranked',
  range: 'range',
  quadratic: 'quadratic'
};

export const mapUiToDb: Record<UiVotingMethod, DbVotingMethod> = {
  single: 'single',
  multiple: 'multiple',
  approval: 'approval',
  ranked: 'ranked',
  range: 'range',
  quadratic: 'quadratic'
};

/**
 * Utility functions for type-safe mapping
 */
export function toUiVotingMethod(dbMethod: DbVotingMethod): UiVotingMethod {
  return mapDbToUi[dbMethod];
}

export function toDbVotingMethod(uiMethod: UiVotingMethod): DbVotingMethod {
  return mapUiToDb[uiMethod];
}

/**
 * Type guards for runtime validation
 */
export function isDbVotingMethod(value: string): value is DbVotingMethod {
  return value in mapDbToUi;
}

export function isUiVotingMethod(value: string): value is UiVotingMethod {
  return value in mapUiToDb;
}
