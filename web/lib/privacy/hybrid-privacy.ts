// PrivacyLevel enum definition
export enum PrivacyLevel {
  MINIMAL = 'minimal',
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  MAXIMUM = 'maximum'
}

export const getDefaultPrivacyLevel = (): PrivacyLevel => PrivacyLevel.STANDARD;

