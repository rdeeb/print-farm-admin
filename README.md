# 3D Farm Admin

A comprehensive web application for managing a 3D printing farm with multi-tenant support, order tracking, filament management, and print queue optimization.

## 🚀 Features

### Multi-Tenant Architecture
- **Tenant Isolation**: Complete data separation between organizations
- **User Roles**: Admin, Operator, and Viewer permissions
- **Tenant Settings**: Customizable configurations per organization

### Filament Management
- **Global Library**: Shared filament types and colors across tenants
- **Spool Tracking**: Individual spool inventory with remaining amounts
- **Cost Tracking**: Purchase history and cost-per-kg tracking
- **Low Stock Alerts**: Automatic notifications for reorder points

### Project & Parts Management
- **Project Organization**: Group related parts together
- **Part Specifications**: Weight, print time, and quantity tracking
- **Filament Assignment**: Link parts to specific filament spools
- **Project Status**: Draft, Active, Completed, Archived states

### Order Management
- **Client Information**: Name, contact details, and source tracking
- **Order Status**: Pending, In Progress, Completed, Cancelled, On Hold
- **Priority Levels**: Low, Medium, High, Urgent
- **Progress Tracking**: Printed vs. required quantities

### Printer Management
- **Printer Fleet**: Track multiple printers with specifications
- **Status Monitoring**: Idle, Printing, Paused, Error, Maintenance, Offline
- **Build Volume**: Physical constraints for part sizing
- **Nozzle Configuration**: Different nozzle sizes and capabilities

### Print Queue
- **Job Scheduling**: Automatic and manual job queuing
- **Priority System**: Urgent jobs processed first
- **Time Estimation**: Predict completion times
- **Failure Tracking**: Record and analyze print failures

### Dashboard & Analytics
- **Real-time Updates**: Live status updates via Server-Sent Events
- **Key Metrics**: Pending orders, filament levels, printer status
- **Notifications**: System alerts and low stock warnings
- **Progress Overview**: Visual representation of farm status

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: Zustand
- **Authentication**: JWT with role-based access control
- **Real-time**: Server-Sent Events for live updates
- **Testing**: Jest, Testing Library
- **Deployment**: Docker, Dokku

## 📋 Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Docker and Docker Compose
- PostgreSQL (via Docker or local installation)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd 3d-farm-admin
pnpm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://farm_user:farm_password@localhost:5432/farm_admin?schema=public"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-jwt-secret-here"

# Redis (for caching and SSE)
REDIS_URL="redis://localhost:6379"
```

### 3. Start Development Environment

```bash
# Start PostgreSQL and Redis
pnpm run docker:up

# Setup database
pnpm run db:generate
pnpm run db:push
pnpm run db:seed

# Start development server
pnpm run dev
```

### 4. Access the Application

- **Application**: http://localhost:3000
- **Database Studio**: `pnpm run db:studio`


## 📁 Project Structure

```
3d-farm-admin/
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Prisma schema definition
│   └── seed.ts            # Database seeding script
├── src/
│   ├── app/               # Next.js app router
│   │   ├── api/           # API routes
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Protected dashboard pages
│   │   └── globals.css    # Global styles
│   ├── components/        # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── forms/         # Form components
│   │   └── layout/        # Layout components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── store/             # Zustand state stores
│   └── types/             # TypeScript definitions
├── docker-compose.yml     # Development services
├── Dockerfile             # Production container
└── package.json           # Dependencies and scripts
```

## 🧪 Testing

```bash
# Run tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:coverage
```

## 🏗️ Development

### Database Management

```bash
# Generate Prisma client
pnpm run db:generate

# Apply schema changes (development)
pnpm run db:push

# Create migration (production)
pnpm run db:migrate

# View database
pnpm run db:studio

# Reset database
pnpm run db:reset

# Seed with demo data
pnpm run db:seed
```

### Code Quality

```bash
# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Linting with fixes
pnpm run lint:fix
```

## 🚀 Production Deployment

### Docker Build

```bash
docker build -t 3d-farm-admin .
docker run -p 3000:3000 3d-farm-admin
```

### Dokku Deployment

1. **Server Setup**:
```bash
# On your server
dokku apps:create 3d-farm-admin
dokku postgres:create farm-db
dokku postgres:link farm-db 3d-farm-admin
dokku redis:create farm-redis
dokku redis:link farm-redis 3d-farm-admin
```

2. **Environment Variables**:
```bash
dokku config:set 3d-farm-admin NEXTAUTH_SECRET="your-production-secret"
dokku config:set 3d-farm-admin JWT_SECRET="your-jwt-secret"
dokku config:set 3d-farm-admin NEXTAUTH_URL="https://your-domain.com"
```

3. **Deploy**:
```bash
# Local machine
git remote add dokku dokku@your-server:3d-farm-admin
git push dokku main
```

4. **Database Setup**:
```bash
dokku run 3d-farm-admin pnpm dlx prisma migrate deploy
dokku run 3d-farm-admin pnpm run db:seed
```

## 🔧 Configuration

### Tenant Settings

Each tenant can configure:
- Default currency
- Timezone
- Filament reorder thresholds
- Email notifications
- Custom branding

### User Roles

- **Admin**: Full access to all features
- **Operator**: Manage orders, printers, and queue
- **Viewer**: Read-only access to data

### Notification Types

- Filament low stock alerts
- Order deadline warnings
- Printer error notifications
- Job completion updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 API Documentation

### Authentication

All API routes require authentication except `/api/auth/*`.

**Headers**:
```
Authorization: Bearer <jwt-token>
```

### Key Endpoints

- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/filament/spools` - List filament spools
- `POST /api/orders` - Create new order
- `GET /api/printers` - List printers
- `POST /api/print-jobs` - Queue print job

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env
   - Verify database exists

2. **Authentication Issues**:
   - Check NEXTAUTH_SECRET is set
   - Verify JWT_SECRET configuration
   - Clear browser cookies/localStorage

3. **Development Environment**:
   - Restart Docker services: `pnpm run docker:down && pnpm run docker:up`
   - Rebuild database: `pnpm run db:reset && pnpm run db:seed`

### Logs

```bash
# Application logs
pnpm run dev

# Database logs
pnpm run docker:logs

# Production logs (Dokku)
dokku logs 3d-farm-admin
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database toolkit
- [Radix UI](https://www.radix-ui.com/) - UI primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Zustand](https://zustand-demo.pmnd.rs/) - State management