/**
 * GovInfo unit test setup.
 * Sets GOVINFO_API_KEY before govinfo-mcp-service is imported (singleton reads it at load).
 */
process.env.GOVINFO_API_KEY = process.env.GOVINFO_API_KEY || 'test-key';
