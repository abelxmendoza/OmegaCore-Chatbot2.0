# 🔒 Security Documentation

Comprehensive security measures implemented in Omega-Core to protect users and data while maintaining accessibility.

## Security Layers

### 1. Authentication & Authorization

- **NextAuth.js v5** with JWT sessions
- **Secure cookies** with HttpOnly, Secure, and SameSite flags
- **Session management** with 30-day expiration and 24-hour update age
- **Guest user support** with limited permissions
- **User isolation** - users can only access their own data

### 2. Input Validation & Sanitization

- **Zod schemas** for all API inputs (prevents injection attacks)
- **String sanitization** - removes control characters and limits length
- **HTML sanitization** - removes script tags and event handlers
- **URL validation** - blocks localhost/private IPs in production
- **UUID validation** - ensures valid UUID format
- **File name sanitization** - prevents path traversal attacks
- **Request size limits** - prevents DoS via large payloads

### 3. Rate Limiting

- **Token bucket algorithm** (O(1) complexity)
- **Per-route limits**:
  - Chat API: 50 requests, 5/sec
  - File uploads: 20 requests, 2/sec
  - Other APIs: 100 requests, 10/sec
- **Per-user and per-IP** tracking
- **Automatic cleanup** to prevent memory leaks

### 4. Security Headers

All responses include:
- **Content-Security-Policy** - Prevents XSS attacks
- **X-Content-Type-Options: nosniff** - Prevents MIME sniffing
- **X-Frame-Options: SAMEORIGIN** - Prevents clickjacking
- **X-XSS-Protection: 1; mode=block** - Browser XSS protection
- **Referrer-Policy** - Controls referrer information
- **Permissions-Policy** - Restricts browser features
- **Strict-Transport-Security** - Forces HTTPS in production

### 5. Database Security

- **Drizzle ORM** - Parameterized queries (prevents SQL injection)
- **User isolation** - All queries filtered by userId
- **Input validation** - All inputs validated before database operations
- **Connection pooling** - Reuses secure connections
- **SSL required** - Database connections use SSL

### 6. File Upload Security

- **File type validation** - Only JPEG and PNG allowed
- **Magic byte verification** - Validates actual file type (not just extension)
- **File size limits** - 5MB maximum
- **Filename sanitization** - Prevents path traversal
- **User isolation** - Files stored in user-specific directories
- **Content-Type validation** - Zod schema validation

### 7. API Route Security

- **Authentication required** - All protected routes check session
- **Authorization checks** - Users can only access their own resources
- **Request size limits** - Prevents DoS attacks
- **Error message sanitization** - Doesn't leak sensitive information
- **UUID validation** - All IDs validated before use
- **Input sanitization** - All inputs sanitized before processing

### 8. Tool Security

#### Shell Execution
- **Command blacklist** - Blocks dangerous commands
- **Timeout protection** - 1-30 second timeouts
- **Output sanitization** - Redacts sensitive information
- **Production disabled** - Requires `ENABLE_SHELL_TOOL=true`
- **Rate limiting** - Prevents abuse

#### Web Browser
- **URL validation** - Only http/https allowed
- **Localhost blocking** - Blocks localhost in production
- **Content sanitization** - Removes scripts and dangerous content
- **Timeout protection** - 10 second timeout
- **Output limits** - Maximum content length enforced

#### Memory Tools
- **User isolation** - Users can only access their own memories
- **Input sanitization** - All content sanitized
- **Rate limiting** - Prevents abuse
- **Vector search** - Secure database queries

### 9. XSS Prevention

- **React automatic escaping** - React escapes by default
- **HTML sanitization** - Removes dangerous HTML
- **Content Security Policy** - Restricts script execution
- **Input validation** - Prevents malicious input

### 10. CSRF Protection

- **SameSite cookies** - Prevents CSRF attacks
- **Secure cookies** - HTTPS only in production
- **NextAuth CSRF tokens** - Built-in CSRF protection

## Security Best Practices

### For Developers

1. **Never commit secrets** - All secrets in `.env.local` (gitignored)
2. **Validate all inputs** - Use Zod schemas
3. **Sanitize outputs** - Use sanitization utilities
4. **Check authorization** - Always verify user ownership
5. **Rate limit APIs** - Prevent abuse
6. **Log security events** - Monitor for attacks

### For Deployment

1. **Set strong AUTH_SECRET** - Use `openssl rand -base64 32`
2. **Use HTTPS** - Always in production
3. **Enable security headers** - Already configured
4. **Monitor rate limits** - Watch for abuse
5. **Keep dependencies updated** - Regular security updates
6. **Use environment variables** - Never hardcode secrets

## Security Features by Route

### `/api/chat`
- ✅ Authentication required
- ✅ Rate limiting (50 req, 5/sec)
- ✅ Input validation (Zod)
- ✅ Request size limit (5MB)
- ✅ User isolation
- ✅ Error sanitization

### `/api/document`
- ✅ Authentication required
- ✅ UUID validation
- ✅ Input sanitization
- ✅ Request size limit (10MB)
- ✅ User ownership checks

### `/api/files/upload`
- ✅ Authentication required
- ✅ File type validation
- ✅ Magic byte verification
- ✅ Filename sanitization
- ✅ User isolation
- ✅ Rate limiting (20 req, 2/sec)

### `/api/history`
- ✅ Authentication required
- ✅ UUID validation
- ✅ Input sanitization
- ✅ Parameter limits
- ✅ User isolation

### `/api/vote`
- ✅ Authentication required
- ✅ UUID validation
- ✅ Input validation (Zod)
- ✅ User ownership checks

## Privacy Protection

- **No data leakage** - Error messages don't expose sensitive info
- **User data isolation** - Users can't access other users' data
- **Secure storage** - All sensitive data encrypted
- **Environment variables** - All secrets in environment
- **Git ignore** - Sensitive files never committed

## Monitoring & Logging

- **Security events logged** - Failed auth, rate limits, etc.
- **Error logging** - Server-side only (not exposed to clients)
- **Rate limit headers** - X-RateLimit-* headers for monitoring

## Compliance

- **GDPR ready** - User data isolation and deletion support
- **Security best practices** - OWASP Top 10 covered
- **Industry standards** - Follows Next.js and NextAuth security guidelines

## Reporting Security Issues

If you discover a security vulnerability, please:
1. **Do not** open a public issue
2. Email security concerns privately
3. Include steps to reproduce
4. Allow time for fix before disclosure

## Security Checklist

- [x] Authentication on all protected routes
- [x] Input validation with Zod
- [x] Output sanitization
- [x] Rate limiting
- [x] Security headers
- [x] SQL injection prevention (Drizzle ORM)
- [x] XSS prevention
- [x] CSRF protection
- [x] File upload security
- [x] Error message sanitization
- [x] Request size limits
- [x] Secure cookies
- [x] User data isolation
- [x] UUID validation
- [x] URL validation
- [x] Content Security Policy

## Future Enhancements

- [ ] Web Application Firewall (WAF)
- [ ] Advanced threat detection
- [ ] Security audit logging
- [ ] Penetration testing
- [ ] Automated security scanning

---

**Remember**: Security is an ongoing process. Always keep dependencies updated and monitor for new threats.

