'use server'

import { z } from 'zod'

// Validation schema
const OnboardingSchema = z.object({
  notifications: z.string().transform(val => val === 'true'),
  dataSharing: z.string().transform(val => val === 'true'),
  theme: z.string().default('system')
})

// Simple onboarding completion action for testing
export const completeOnboarding = async (formData: FormData) => {
  console.log('completeOnboarding server action called with formData:', Object.fromEntries(formData.entries()));
  
  try {
    // Validate form data
    const validatedData = OnboardingSchema.parse({
      notifications: formData.get('notifications') === 'true',
      dataSharing: formData.get('dataSharing') === 'true',
      theme: formData.get('theme') as 'light' | 'dark' | 'system'
    });
    console.log('Validated data:', validatedData);
    
    // For now, just return success without database operations
    console.log('Onboarding completed successfully (simplified version)');
    return { success: true, message: 'Onboarding completed' };
    
  } catch (error) {
    console.log('Error in completeOnboarding:', error);
    throw new Error('Failed to complete onboarding');
  }
}
