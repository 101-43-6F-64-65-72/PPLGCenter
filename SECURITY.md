# Security Policy — StudentCenter

## Supported Versions

| Version | Supported |
|---|---|
| 1.0.0 | ✅ Active |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues by emailing:

**security@smkn2surakarta.sch.id**

Include in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive an acknowledgment within **48 hours** and a full response within **7 business days**.

## Security Measures

- JWT HS256 authentication with short expiry (60 min)
- Role-based authorization on all protected endpoints
- Rate limiting to prevent brute force
- HTTPS enforced via HSTS (1 year)
- CSP, X-Frame-Options, and other OWASP headers
- SQL injection protection via EF Core parameterized queries
- Input validation on all API endpoints
- Non-root Docker containers with `no-new-privileges`
- Docker Secrets for credentials (no plaintext in compose files)

## Dependency Security

Dependencies are scanned weekly via GitHub Dependabot.  
Run manual audit: `npm audit` and `dotnet list package --vulnerable`
