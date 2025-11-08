/**
 * Legacy E2E flows expected an administrator account to exist ahead of time.
 * Our rebuilt suite mocks authentication, so simply surface a friendly reminder.
 */

if (process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD) {
  console.log(`✅ Admin credentials present for ${process.env.E2E_ADMIN_EMAIL}`);
} else {
  console.log('ℹ️ No dedicated admin credentials required for the current E2E suite.');
  console.log('   Provide E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD if future tests need them.');
}

