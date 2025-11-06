/**
 * Test User Configuration
 *
 * CONFIGURED TEST USERS (Already exist in database):
 * - Admin: michaeltempesta@gmail.com (is_admin: true)
 * - Regular: anonysendlol@gmail.com (is_admin: false)
 *
 * These users are already created and configured in .env.test.local
 *
 * Last Updated: November 6, 2025
 */

/**
 * Get admin credentials from environment
 */
function getAdminCredentials() {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set in .env.test.local\n' +
      'Current users: michaeltempesta@gmail.com, anonysendlol@gmail.com'
    );
  }

  return { email, password };
}

/**
 * Admin test user
 */
export const TEST_ADMIN_USERS = {
  primary: {
    get email() {
      return getAdminCredentials().email;
    },
    get password() {
      return getAdminCredentials().password;
    },
    username: 'testadmin',
    description: 'Admin test user - already exists in database'
  }
};

/**
 * Regular test user
 */
export const TEST_REGULAR_USERS = {
  user1: {
    email: process.env.E2E_USER_EMAIL || 'anonysendlol@gmail.com',
    get password() {
      const password = process.env.E2E_USER_PASSWORD;
      if (!password) {
        throw new Error('E2E_USER_PASSWORD not set in .env.test.local');
      }
      return password;
    },
    username: 'testuser',
    description: 'Regular test user - already exists in database'
  }
};
