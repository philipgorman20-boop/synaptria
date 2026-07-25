# System Architecture

The platform begins as a modular monolith.

Core components:

- Next.js web application
- PostgreSQL database
- Prisma data access
- S3-compatible document storage
- Background job infrastructure
- AI integration layer
- Audit logging
- Notification services

Services may be separated later only when scale or operational boundaries justify it.
