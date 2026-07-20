# Backend Architecture

Route handlers validate, authorize, invoke services, and serialize responses.

Business logic belongs in domain services. Database access belongs in repository or service layers using Prisma.
