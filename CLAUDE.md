# 3D Farm Admin - Claude Development Guide

## Project Overview
This is a comprehensive 3D printing farm management system built with Next.js, TypeScript, PostgreSQL, and modern web technologies.

## Development Commands

### Setup
```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Start development environment
pnpm run docker:up

# Setup database
pnpm run db:generate
pnpm run db:push
pnpm run db:seed
```

### Development
```bash
# Start development server
pnpm run dev

# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Testing
pnpm run test
pnpm run test:watch
pnpm run test:coverage
```

### Database
```bash
# Generate Prisma client
pnpm run db:generate

# Push schema changes (development)
pnpm run db:push

# Create migration (production)
pnpm run db:migrate

# View database
pnpm run db:studio

# Seed database with demo data
pnpm run db:seed
```

### Docker
```bash
# Start all services
pnpm run docker:up

# Stop all services
pnpm run docker:down

# View logs
pnpm run docker:logs
```

## Architecture

### Tech Stack
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with JWT
- **UI:** Tailwind CSS + Radix UI
- **State Management:** Zustand
- **Testing:** Jest + Testing Library
- **Deployment:** Docker + Dokku

### Project Structure
```
src/
├── app/                    # Next.js app router pages
├── components/
│   ├── ui/                # Reusable UI components (Radix-based)
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── store/                 # Zustand stores
└── types/                 # TypeScript type definitions
```

### Database Schema
The application uses a multi-tenant architecture with the following main entities:
- **Tenants:** Isolated workspaces for different organizations
- **Users:** With roles (ADMIN, OPERATOR, VIEWER)
- **Filaments:** Global type/color library + tenant-specific spools
- **Projects:** Container for parts and print specifications
- **Orders:** Client orders with tracking and status
- **Printers:** Printer management and queue
- **Print Jobs:** Individual print queue items

### Authentication & Authorization
- NextAuth.js with JWT strategy
- Role-based access control (RBAC)
- Multi-tenant isolation
- Protected API routes with middleware

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions
- Use Prettier for formatting
- Use ESLint for code quality

### Components
- Use Radix UI primitives for complex components
- Follow shadcn/ui patterns for component structure
- Keep components small and focused
- Use proper TypeScript interfaces

### State Management
- Use Zustand for global state
- Keep stores focused on specific domains
- Use React state for local component state
- Implement proper error handling

### API Development
- Use Next.js API routes
- Implement proper error handling
- Use Zod for request validation
- Follow REST conventions

### Database
- Use Prisma for all database operations
- Keep migrations reversible
- Use proper indexing
- Follow naming conventions

## Testing Strategy
- Unit tests for utilities and hooks
- Component tests with Testing Library
- Integration tests for API routes
- End-to-end tests for critical flows

## Deployment

### Development
1. Start Docker services: `pnpm run docker:up`
2. Run migrations: `pnpm run db:push`
3. Seed database: `pnpm run db:seed`
4. Start dev server: `pnpm run dev`

### Production (Dokku)
1. Build Docker image
2. Deploy to Dokku server
3. Run database migrations
4. Configure environment variables

## Environment Variables

Required environment variables (see .env.example):
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Application URL
- `JWT_SECRET` - JWT signing secret


## Common Tasks

### Adding New Features
1. Update database schema in `prisma/schema.prisma`
2. Generate and apply migrations
3. Create API routes in `src/app/api/`
4. Create UI components
5. Add to navigation/routing
6. Write tests

### Debugging
- Use `pnpm run db:studio` to inspect database
- Check logs with `pnpm run docker:logs`
- Use browser dev tools for frontend debugging
- Use VS Code debugger for backend debugging

## Performance Considerations
- Use Next.js SSR/SSG where appropriate
- Implement proper caching strategies
- Optimize database queries
- Use React.memo for expensive components
- Implement proper loading states

## Security Best Practices
- Never commit secrets to repository
- Use environment variables for configuration
- Implement proper input validation
- Use CSRF protection
- Follow OWASP guidelines