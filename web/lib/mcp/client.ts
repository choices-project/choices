/**
 * MCP (Model Context Protocol) Client
 * 
 * Provides a typed interface for calling MCP tools
 * 
 * ⚠️ SERVER-ONLY: This client MUST only be used in API routes and server actions.
 * MCP tools are not accessible from client components.
 * 
 * @author Choices Platform Team
 * @date 2026-01-25
 */

'use server';

// Runtime assertion to prevent client-side usage
function assertServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'MCP client is server-only and cannot be used in client components. ' +
      'Use API routes or server actions instead.'
    );
  }
}

// Import the actual MCP tool function (this will be available in server context)
// Using dynamic import to ensure it's only loaded server-side
// This file is kept for type compatibility but actual MCP calls
// are handled by GovInfoRestClient in govinfo-mcp-service.ts
// MCP tools are only available in agent context, so we use REST API directly
