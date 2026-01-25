# GovInfo MCP Implementation Notes

**Date:** 2026-01-25  
**Status:** ⚠️ Implementation In Progress

## Security Architecture

### Server-Only Design

All GovInfo MCP services are **server-only** and **NOT accessible to end users**:

1. **`'use server'` directive** - Next.js server-only marker
2. **Runtime assertions** - Throws error if accessed from client (`typeof window !== 'undefined'`)
3. **API routes only** - Services only used in `/app/api/` routes
4. **No client exports** - Services are not exported to client bundles

### File Locations

- **Services:** `/web/lib/services/govinfo-mcp-service.ts` (server-only)
- **API Routes:** `/web/app/api/accountability/*` (server-only)
- **MCP Tools:** Only available in agent context, not to users

## MCP Tool Calling Implementation

### Current Status

The GovInfo MCP service is structured and ready, but **MCP tool calls need implementation**:

```typescript
// Current: Placeholder that returns null
async function callMCPTool(params) {
  // TODO: Implement actual MCP tool calling
  return { result: null };
}
```

### Implementation Options

#### Option 1: Server-Side MCP Client (Recommended)

Create a server-side MCP client that can call MCP tools from API routes:

```typescript
// web/lib/mcp/server-client.ts
import { MCPClient } from '@modelcontextprotocol/sdk/client';

export async function getMCPClient(serverName: string) {
  // Connect to MCP server via stdio/HTTP/WebSocket
  const client = new MCPClient({
    server: serverName,
    transport: /* ... */
  });
  return client;
}
```

#### Option 2: Agent API Endpoint

Create an API endpoint that uses agent context to call MCP tools:

```typescript
// web/app/api/mcp/call/route.ts
export async function POST(request: NextRequest) {
  // This endpoint would have agent access
  // Calls MCP tools on behalf of other services
}
```

#### Option 3: Direct MCP Server Connection

Connect directly to the MCP server from Node.js:

```typescript
// Use the MCP server's HTTP/WebSocket interface
// Requires MCP server to expose HTTP endpoint
```

### Recommended Approach

**Use Option 1** - Create a server-side MCP client that:
- Connects to MCP servers via stdio (for local) or HTTP/WebSocket (for remote)
- Can be used in API routes and server actions
- Maintains security (server-only, no client access)
- Handles authentication and rate limiting

## Current Implementation

### Services Created

1. ✅ **GovInfo MCP Service** (`govinfo-mcp-service.ts`)
   - Server-only with runtime checks
   - Type-safe interface for all GovInfo MCP tools
   - Ready for MCP client implementation

2. ✅ **Promise Fulfillment Service** (`promise-fulfillment-service.ts`)
   - Analyzes campaign promise fulfillment
   - Compares promises to actual votes and bill text
   - Server-only with runtime checks

3. ✅ **API Routes**
   - `/api/accountability/constituent-will` - Compare poll results to votes
   - `/api/accountability/promise-fulfillment` - Analyze promise fulfillment

### Next Steps

1. **Implement MCP Client** - Create server-side MCP client library
2. **Update callMCPTool** - Replace placeholder with actual MCP calls
3. **Test Integration** - Verify MCP tools work from API routes
4. **Add Poll Integration** - Connect to poll creation for constituent will polls
5. **Create UI** - Build accountability dashboard

## Security Guarantees

✅ **Users CANNOT access MCP tools directly:**
- Services have `'use server'` directive
- Runtime checks prevent client usage
- Only accessible through API routes
- API routes require authentication

✅ **MCP tools are server-only:**
- No client-side bundling
- No exposure to browser
- Server-side execution only

## Usage Pattern

```typescript
// ✅ CORRECT: Use in API route
// web/app/api/accountability/constituent-will/route.ts
export const GET = async (request: NextRequest) => {
  const analysis = await promiseFulfillmentService.analyzeConstituentWill(
    representativeId,
    billId,
    pollId
  );
  return successResponse(analysis);
};

// ❌ WRONG: Cannot use in client component
// 'use client'
// import { govInfoMCPService } from '@/lib/services/govinfo-mcp-service';
// This will throw: "GovInfo MCP Service is server-only..."
```

## Testing

To test the implementation:

1. **Verify server-only:** Try importing in a client component (should fail)
2. **Test API routes:** Call `/api/accountability/*` endpoints
3. **Verify MCP calls:** Check logs for MCP tool calls
4. **Test error handling:** Verify graceful degradation if MCP unavailable

## Conclusion

The services are **architecturally correct** and **secure**:
- ✅ Server-only design
- ✅ Runtime protection
- ✅ No client access
- ⏳ MCP client implementation needed

Once the MCP client is implemented, the services will be fully functional while maintaining security guarantees.
