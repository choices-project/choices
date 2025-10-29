/**
 * Root Jest Configuration
 * 
 * Points to the main Jest configuration in the testing suite directory.
 * This maintains consistency with Playwright configs being in tests/playwright/configs/
 */

const path = require('path');

module.exports = {
  ...require('./tests/jest/configs/jest.config.main.js'),
  // Override rootDir to be the project root, not the configs directory
  rootDir: path.resolve(__dirname),
};