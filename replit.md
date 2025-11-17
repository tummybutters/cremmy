# Overview

Cremmy is a single-user CRM (Customer Relationship Management) application designed for freelancers or solo consultants managing client relationships, sales pipelines, and project delivery. The system combines a Next.js frontend with a Fastify backend API, implementing a deterministic pipeline state machine for tracking client lifecycle stages from cold lead through maintenance.

The application provides comprehensive tracking for clients, engagements, tasks, activities, documents, and templates, with planned integrations for external services like Gmail, Google Drive, and calendars.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: Next.js 16 with App Router and React Server Components
- **Reasoning**: Enables modern React patterns with built-in routing, SSR capabilities, and optimal performance through automatic code splitting
- **UI Pattern**: Page-based architecture with reusable component library
- **Styling**: Tailwind CSS v4 with custom design tokens for theming
- **Dark Mode**: Implemented via next-themes for synchronized light/dark theme switching

**Component Structure**:
- Atomic design pattern with shared components in `src/components/`
- Page-level components in `src/pages/` consumed by route files
- Layout wrapper (`AppLayout`) provides navigation sidebar and theme toggle
- All components are TypeScript with strict type checking

**State Management**: Currently client-side only (no global state library)
- Local component state via React hooks
- Custom hooks for UI patterns (e.g., `useSidebarToggle`)
- Backend integration planned but not yet implemented

## Backend Architecture

**Framework**: Fastify 5.x with TypeScript
- **Reasoning**: High-performance HTTP server with excellent TypeScript support and plugin ecosystem
- **Validation**: Zod schemas for request/response validation
- **Logging**: Pino structured logger for production-ready observability
- **CORS**: Configured via @fastify/cors for frontend integration

**Domain-Driven Design**:
- Service layer pattern in `src/server/domain/` encapsulates business logic
- Separation between domain services, validation rules, and data access
- Transaction-based operations ensure data consistency

**Pipeline State Machine**:
- 14 distinct pipeline stages modeling complete sales and delivery lifecycle
- Deterministic transitions with validation rules preventing invalid state jumps
- Shortcuts allowed for specific transitions (e.g., proposal → closed_won)
- Stage history tracking for audit trail and analytics
- Post-win stages (onboarding, delivering, maintenance) separated from pre-sales flow

**Business Rules** (`src/server/domain/rules.ts`):
- Stage transition validation with force-override capability
- Lifecycle stage enforcement (prospect, active, churned, disqualified)
- Staleness detection by stage bands (documented but not yet implemented)
- Terminal state protection (closed_lost, maintenance)

## Data Storage

**Database**: PostgreSQL via node-postgres (pg) driver
- **Schema**: Relational tables for clients, engagements, tasks, activities, documents, templates, external accounts, and stage history
- **Connection Pooling**: Implemented via pg.Pool for connection reuse
- **Transactions**: All write operations wrapped in transactions via custom abstraction layer
- **Environment**: Uses Replit's built-in PostgreSQL database (DATABASE_URL)

**Data Access Layer** (`src/server/infra/db.ts`):
- Custom transaction context interface (`TransactionContext`)
- Table mapping between TypeScript types and database tables (camelCase to snake_case)
- Transformation layer for nested objects:
  - Client.contact (nested object) → email/phone (flat columns)
  - StageHistory.from/to (reserved keywords) → from_stage/to_stage (safe column names)
- UUID-based primary keys via `generateId()` utility
- All CRUD operations use parameterized queries to prevent SQL injection
- ID preservation: Caller-provided UUIDs are correctly persisted for relational integrity

**Recent Changes (November 2024)**:
- Migrated from in-memory Map storage to PostgreSQL
- Created production database schema matching domain model
- Implemented proper connection pooling and transaction management
- Added transformation functions for nested object mapping

## External Dependencies

**Third-Party Services** (Planned):
1. **Gmail Integration**: Email sync and send capabilities
2. **Google Drive**: Document storage and retrieval
3. **Google Calendar**: Meeting scheduling and sync
4. **PandaDoc**: Document e-signature webhooks (`PANDADOC_WEBHOOK_SECRET`)
5. **Stripe**: Payment processing webhooks (`STRIPE_WEBHOOK_SECRET`)

**Configuration**: Environment-based secrets via `src/server/config/env.ts`
- Webhook verification secrets configured for production security
- CORS origin configuration for frontend-backend separation
- Port configuration (defaults: frontend 5000, backend 4000)

**API Integrations**:
- External account status tracking (connected, disconnected, error states)
- Last sync timestamps for monitoring data freshness
- Activity logging for all external events via unified activity stream

**Template Engine** (Documented but not implemented):
- Markdown-based templates with YAML front matter
- Variable interpolation with dot-notation paths
- Filters for formatting (upper, lower, currency, date, number)
- Conditional blocks and iteration support
- Six template categories: SOW_Retainer, SOW_Build, Proposal, Contract, Onboarding, FollowUp
- Metadata-driven validation for required variables and typing

**Development Dependencies**:
- tsx: TypeScript execution for running backend server in development
- ESLint: Code quality and consistency enforcement
- Tailwind CSS PostCSS plugin: CSS processing and optimization