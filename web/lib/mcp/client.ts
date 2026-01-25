/**
 * MCP (Model Context Protocol) Client
 * 
 * Provides a typed interface for calling MCP tools
 * 
 * ⚠️ SERVER-ONLY: This client MUST only be used in API routes and server actions.
 * MCP tools are not accessible from client components.
 * 
 * Note: This file is kept for type compatibility but actual MCP calls
 * are handled by GovInfoRestClient in govinfo-mcp-service.ts
 * MCP tools are only available in agent context, so we use REST API directly
 * 
 * @author Choices Platform Team
 * @date 2026-01-25
 */

// This file is kept for type compatibility but actual MCP calls
// are handled by GovInfoRestClient in govinfo-mcp-service.ts
// MCP tools are only available in agent context, so we use REST API directly

// Placeholder export for type compatibility
export async function call_mcp_tool<T = unknown>(_params: {
  server: string;
  toolName: string;
  arguments: Record<string, unknown>;
}): Promise<{ result?: T }> {
  throw new Error(
    'MCP tool calls must be made through govInfoMCPService methods. ' +
    'This function is for type compatibility only.'
  );
}
