# Vytaniq Compliance Platform - API Documentation

Complete OpenAPI 3.0.0 specification for the Vytaniq Compliance Platform REST API.

## Overview

The API provides endpoints for:
- **Authentication**: User registration, OTP-based login, token refresh
- **Onboarding**: Organization setup with license configuration
- **Obligations**: Compliance obligation tracking with evidence management
- **Circulars**: Regulatory circular distribution and acknowledgment
- **Calendar**: Compliance deadline management
- **Readiness**: Compliance scoring and report generation
- **Admin**: Administrative controls for obligations and circulars

## API Endpoints Summary

### Authentication (4 routes)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new organization and user |
| POST | `/auth/login` | Request OTP for login |
| POST | `/auth/verify-otp` | Verify OTP and get tokens |
| POST | `/auth/refresh` | Refresh access token |

### Onboarding (1 route)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/onboarding/complete` | Complete org setup and initialize obligations |

### Obligations (5 routes)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/obligations` | List all obligations |
| GET | `/obligations/{id}` | Get obligation details |
| PATCH | `/obligations/{id}` | Update obligation status |
| POST | `/obligations/{id}/evidence` | Get S3 upload URL for evidence |
| DELETE | `/obligations/{id}/evidence/{fileId}` | Delete evidence file |

### Circulars (5 routes)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/circulars` | List applicable circulars |
| GET | `/circulars/{id}` | Get circular details |
| PATCH | `/circulars/{id}/acknowledge` | Mark circular as reviewed |
| POST | `/circulars/{id}/dispute` | File relevance dispute |
| PATCH | `/circulars/{id}/dispute/{disputeId}` | Admin: Resolve dispute |

### Calendar (2 routes)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendar` | List compliance deadlines |
| POST | `/calendar` | Create new deadline |
| GET | `/calendar/{id}` | Get deadline details |
| PATCH | `/calendar/{id}` | Update deadline |
| DELETE | `/calendar/{id}` | Delete deadline (admin) |

### Readiness (2 routes)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/readiness` | Get current compliance score |
| POST | `/readiness/report` | Generate readiness report |

### Admin (4 routes)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/obligations` | Create new obligation |
| PATCH | `/admin/obligations/{id}` | Update obligation |
| DELETE | `/admin/obligations/{id}` | Archive obligation |
| POST | `/admin/circulars/ingest` | Ingest new circular |
| PATCH | `/admin/circulars/{id}` | Curate circular tags |

**Total: 25 API routes**

## Authentication

All endpoints (except auth) require a JWT bearer token:

```bash
Authorization: Bearer {accessToken}
```

Obtain tokens via:
1. `POST /auth/login` with email
2. `POST /auth/verify-otp` with OTP code
3. Response includes `accessToken` (expires in 1 hour) and `refreshToken`

## Security

- **JWT Authentication**: Standard bearer token scheme
- **Role-Based Access**: Admin endpoints require `ADMIN` role
- **Organization Isolation**: All operations scoped to user's organization
- **Audit Logging**: All mutations logged for compliance

## Using the Swagger UI

### Option 1: Swagger Editor Online
Visit [editor.swagger.io](https://editor.swagger.io) and:
1. Click `File > Import URL`
2. Enter your server URL with path to `openapi.json`
3. OR copy-paste the JSON content

### Option 2: Local Swagger UI
```bash
# Install globally
npm install -g swagger-ui-dist

# Or use Docker
docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.json -v $(pwd)/openapi.json:/openapi.json swaggerapi/swagger-ui

# Visit http://localhost:8080
```

### Option 3: ReDoc Documentation
```bash
npm install -g redoc-cli

# Generate static HTML docs
redoc-cli bundle openapi.json -o docs.html

# Open in browser
open docs.html
```

## Common Request/Response Patterns

### Success Response (2xx)
```json
{
  "message": "Operation successful",
  "data": { /* operation-specific data */ }
}
```

### Error Response (4xx, 5xx)
```json
{
  "error": "Error description",
  "details": [ /* validation errors */ ]
}
```

### Pagination (where applicable)
```json
{
  "items": [ /* results */ ],
  "total": 42,
  "page": 1,
  "pageSize": 10
}
```

## Key Features

- **JWT Tokens**: HTTP-only, secure, OAuth 2.0 compatible
- **OTP Login**: No passwords, SMS-based OTP verification
- **S3 Presigned URLs**: Direct browser uploads to S3, 15-minute expiry
- **Versioning**: Obligation versions tracked for audit trail
- **Scoring**: 4-band compliance readiness scale (INVESTOR_READY, AUDIT_READY, WORK_REQUIRED, AT_RISK)
- **Audit Logging**: Append-only immutable audit trail

## Rate Limiting

- Authenticated requests: 1000 requests/hour
- Admin endpoints: 500 requests/hour

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict (e.g., duplicate) |
| 500 | Server Error - Internal error |

## Environment Setup

Development:
```
Base URL: http://localhost:3000/api/v1
```

Production:
```
Base URL: https://api.vytaniq.com/api/v1
```

## Support

For API issues or questions:
- Documentation: https://docs.vytaniq.com
- Support: support@vytaniq.com
- Status: https://status.vytaniq.com
