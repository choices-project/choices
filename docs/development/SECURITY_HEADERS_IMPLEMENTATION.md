# Security Headers Implementation

## Overview
Comprehensive security headers implementation for the Choices platform, providing defense against XSS, clickjacking, MIME sniffing, and other web vulnerabilities.

## Implemented Security Headers

### 1. Content Security Policy (CSP)
**Purpose**: Prevents XSS attacks by controlling which resources can be loaded and executed.

**Configuration**:
- **Production Profile**: Strict CSP with Supabase and Vercel domains
- **Development Profile**: Relaxed CSP with localhost support
- **Report-Only Mode**: Configurable via `CSP_REPORT_ONLY=true` environment variable

**Directives**:
```javascript
{
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://vercel.live"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com", "data:"],
  'img-src': ["'self'", "data:", "blob:", "https:"],
  'connect-src': ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
}
```

### 2. Trusted Types
**Purpose**: Prevents DOM-based XSS by controlling dangerous DOM APIs.

**Configuration**:
```http
Trusted-Types: 'none'
```

### 3. HTTP Strict Transport Security (HSTS)
**Purpose**: Forces HTTPS connections and prevents protocol downgrade attacks.

**Configuration**:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
```
- Only enabled in production
- 1-year max-age
- Includes subdomains

### 4. X-Content-Type-Options
**Purpose**: Prevents MIME type sniffing attacks.

**Configuration**:
```http
X-Content-Type-Options: nosniff
```

### 5. X-Frame-Options
**Purpose**: Prevents clickjacking attacks.

**Configuration**:
```http
X-Frame-Options: DENY
```

### 6. X-XSS-Protection
**Purpose**: Enables browser XSS filtering.

**Configuration**:
```http
X-XSS-Protection: 1; mode=block
```

### 7. Referrer Policy
**Purpose**: Controls referrer information sent with requests.

**Configuration**:
```http
Referrer-Policy: strict-origin-when-cross-origin
```

### 8. Permissions Policy
**Purpose**: Controls browser features and APIs.

**Configuration**:
```http
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()
```

### 9. Cross-Origin Policies
**Purpose**: Controls cross-origin resource sharing and isolation.

**Configuration**:
```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### 10. Origin Agent Cluster
**Purpose**: Enables origin isolation for enhanced security.

**Configuration**:
```http
Origin-Agent-Cluster: ?1
```

## API Route Security

### Cache Control
```http
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
```

### Vary Header
```http
Vary: Cookie, Authorization
```

## Environment Configuration

### Development
- Relaxed CSP with localhost support
- No HSTS header
- Debug-friendly settings

### Production
- Strict CSP with production domains
- HSTS enabled
- Maximum security settings

### Report-Only Mode
Set `CSP_REPORT_ONLY=true` to enable CSP reporting without blocking:
```bash
export CSP_REPORT_ONLY=true
npm run dev
```

## Testing

### Automated Testing
Run the security headers test script:
```bash
npm run test:security-headers
```

### Manual Testing
1. **Browser Developer Tools**:
   - Check Network tab for security headers
   - Verify CSP violations in Console

2. **Online Tools**:
   - [Security Headers](https://securityheaders.com/)
   - [Mozilla Observatory](https://observatory.mozilla.org/)

3. **CSP Testing**:
   - Test CSP violations in browser console
   - Verify report-only mode functionality

## CSP Violation Reporting

### Setup Reporting Endpoint
Create an API route to collect CSP violation reports:

```typescript
// app/api/csp-report/route.ts
export async function POST(request: Request) {
  const report = await request.json();
  
  // Log CSP violation
  console.error('CSP Violation:', report);
  
  // Store in database or send to monitoring service
  // await storeCSPViolation(report);
  
  return new Response('OK', { status: 200 });
}
```

### Configure CSP Reporting
Add to CSP directives:
```javascript
'report-uri': ['/api/csp-report'],
'report-to': ['csp-endpoint']
```

## Security Considerations

### CSP Unsafe Directives
- `'unsafe-inline'`: Required for Next.js and Tailwind CSS
- `'unsafe-eval'`: Required for Next.js development mode
- Consider using nonces or hashes for production

### HSTS Considerations
- Only enable in production
- Start with shorter max-age for testing
- Consider preload list for maximum security

### Cross-Origin Policies
- `require-corp` may break some third-party integrations
- Test thoroughly with all external resources
- Consider relaxing for development

## Monitoring and Maintenance

### Regular Checks
1. **Security Headers Test**: Run `npm run test:security-headers` regularly
2. **CSP Violations**: Monitor CSP violation reports
3. **Browser Compatibility**: Test across different browsers
4. **Performance Impact**: Monitor header size and processing time

### Updates
1. **CSP Directives**: Update when adding new external resources
2. **HSTS Max-Age**: Consider increasing after initial deployment
3. **Permissions Policy**: Add new features as needed

## Troubleshooting

### Common Issues

1. **CSP Violations**:
   - Check browser console for violation reports
   - Add necessary domains to CSP directives
   - Use report-only mode for testing

2. **HSTS Issues**:
   - Ensure HTTPS is properly configured
   - Start with shorter max-age for testing
   - Clear browser cache if needed

3. **Cross-Origin Issues**:
   - Check CORS configuration
   - Verify external resource domains
   - Test with different browsers

### Debug Mode
Enable debug logging:
```bash
DEBUG=security-headers npm run dev
```

## Future Enhancements

### Phase 4 Improvements
1. **CSP Nonces**: Implement nonce-based CSP for better security
2. **HSTS Preload**: Add to HSTS preload list
3. **Subresource Integrity**: Add SRI for external resources
4. **Certificate Transparency**: Implement CT monitoring

### Advanced Features
1. **CSP Level 3**: Upgrade to latest CSP features
2. **Feature Policy**: Migrate to Permissions Policy
3. **Origin Trials**: Test new security features
4. **Security Monitoring**: Implement automated security monitoring

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HSTS Best Practices](https://hstspreload.org/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
