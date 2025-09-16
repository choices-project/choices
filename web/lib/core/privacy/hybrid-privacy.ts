// Import the proper PrivacyLevel enum from the main privacy module
import { PrivacyLevel } from '@/lib/privacy/hybrid-privacy';
export { PrivacyLevel };

export const getDefaultPrivacyLevel = (): PrivacyLevel => PrivacyLevel.STANDARD;

