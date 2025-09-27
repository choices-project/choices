/**
 * Voting Method Type Mapping
 * 
 * Maps between database enum values and UI display values to resolve
 * the drift between DB schema and code expectations.
 */

export type DbVotingMethod = 'single'|'approval'|'ranked'|'range'|'quadratic'|'multiple';
export type UiVotingMethod = 'single_choice'|'approval'|'ranked_choice'|'range'|'quadratic';

export const mapDbToUi: Record<DbVotingMethod, UiVotingMethod> = {
  single: 'single_choice',
  approval: 'approval',
  ranked: 'ranked_choice',
  range: 'range',
  quadratic: 'quadratic',
  multiple: 'single_choice', // TODO: split if multi-select lands
};

export const mapUiToDb: Record<UiVotingMethod, DbVotingMethod> = {
  single_choice: 'single',
  approval: 'approval',
  ranked_choice: 'ranked',
  range: 'range',
  quadratic: 'quadratic',
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
