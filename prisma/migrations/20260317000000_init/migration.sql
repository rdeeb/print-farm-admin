-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('TRIAL', 'SOLO', 'SHOP', 'FARM');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'WAITING', 'IN_PROGRESS', 'ASSEMBLED', 'DELIVERED', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "OrderPartStatus" AS ENUM ('WAITING', 'QUEUED', 'PRINTING', 'PRINTED');

-- CreateEnum
CREATE TYPE "ClientSource" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'DIRECT', 'WEBSITE', 'REFERRAL');

-- CreateEnum
CREATE TYPE "PrinterStatus" AS ENUM ('IDLE', 'PRINTING', 'PAUSED', 'ERROR', 'MAINTENANCE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "PrintJobStatus" AS ENUM ('QUEUED', 'PRINTING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FILAMENT_LOW', 'FILAMENT_OUT', 'ORDER_OVERDUE', 'PRINTER_ERROR', 'JOB_COMPLETED', 'JOB_FAILED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "HardwareUnit" AS ENUM ('ITEMS', 'ML', 'GRAMS', 'CM', 'UNITS');

-- CreateEnum
CREATE TYPE "PrinterTechnology" AS ENUM ('FDM', 'SLA', 'SLS');

-- CreateEnum
CREATE TYPE "MaterialUnit" AS ENUM ('GRAM', 'MILLILITER');

-- CreateEnum
CREATE TYPE "SoftExpensePostingMode" AS ENUM ('SOFT_ONLY', 'POST_AS_EXPENSE');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('INCOME', 'EXPENSE', 'SOFT_EXPENSE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LedgerSource" AS ENUM ('ORDER_DELIVERY', 'CONTAINER_INTAKE', 'SOFT_COST_ALLOCATION', 'MANUAL', 'MATERIAL_WASTE');

-- CreateEnum
CREATE TYPE "PrinterPlatform" AS ENUM ('BAMBU_LAB');

-- CreateEnum
CREATE TYPE "ConnectorRuntime" AS ENUM ('WEB_APP', 'CHROME_EXTENSION', 'GO_AGENT');

-- CreateEnum
CREATE TYPE "ConnectorAuthType" AS ENUM ('SESSION', 'API_TOKEN');

-- CreateEnum
CREATE TYPE "PrinterEventType" AS ENUM ('STATUS_CHANGED', 'PRINT_STARTED', 'PRINT_PROGRESS', 'PRINT_PAUSED', 'PRINT_RESUMED', 'PRINT_COMPLETED', 'PRINT_FAILED', 'PRINT_CANCELLED', 'CONNECTOR_CONNECTED', 'CONNECTOR_DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "ConnectionState" AS ENUM ('CONNECTED', 'DISCONNECTED', 'RECONNECTING', 'UNHEALTHY');

-- CreateEnum
CREATE TYPE "BambuAccessMode" AS ENUM ('LOCAL_FULL', 'READ_ONLY_FALLBACK');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "tier" "PlanTier" NOT NULL DEFAULT 'TRIAL',
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "tenantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filament_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "technology" "PrinterTechnology" NOT NULL DEFAULT 'FDM',

    CONSTRAINT "filament_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filament_colors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,

    CONSTRAINT "filament_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filaments" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "costPerKg" DOUBLE PRECISION,
    "baseLandedCostPerUnit" DOUBLE PRECISION,
    "technology" "PrinterTechnology" NOT NULL DEFAULT 'FDM',
    "defaultUnit" "MaterialUnit" NOT NULL DEFAULT 'GRAM',
    "supplier" TEXT,
    "notes" TEXT,
    "tenantId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filament_spools" (
    "id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "remainingWeight" DOUBLE PRECISION NOT NULL,
    "capacity" DOUBLE PRECISION,
    "remainingQuantity" DOUBLE PRECISION,
    "landedCostTotal" DOUBLE PRECISION,
    "remainingPercent" INTEGER NOT NULL,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 20,
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "filamentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filament_spools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "assemblyTime" INTEGER,
    "salesPrice" DOUBLE PRECISION,
    "tenantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_parts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filamentWeight" DOUBLE PRECISION NOT NULL,
    "materialUsagePerUnit" DOUBLE PRECISION,
    "printTime" INTEGER,
    "quantity" INTEGER NOT NULL,
    "projectId" TEXT NOT NULL,
    "filamentColorId" TEXT,
    "spoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "source" "ClientSource" NOT NULL DEFAULT 'DIRECT',
    "address" TEXT,
    "notes" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "OrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "paymentStatus" "PaymentStatus",
    "clientId" TEXT NOT NULL,
    "printedCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_parts" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "OrderPartStatus" NOT NULL DEFAULT 'WAITING',
    "filamentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printer_models" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "technology" "PrinterTechnology" NOT NULL DEFAULT 'FDM',
    "buildVolumeX" INTEGER NOT NULL,
    "buildVolumeY" INTEGER NOT NULL,
    "buildVolumeZ" INTEGER NOT NULL,
    "defaultNozzle" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "avgPowerConsumption" DOUBLE PRECISION,
    "releaseYear" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "printer_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "brand" TEXT,
    "technology" "PrinterTechnology" NOT NULL DEFAULT 'FDM',
    "status" "PrinterStatus" NOT NULL DEFAULT 'IDLE',
    "buildVolume" JSONB,
    "nozzleSize" DOUBLE PRECISION,
    "powerConsumption" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "maintenanceIntervalDays" INTEGER,
    "nextMaintenanceDue" TIMESTAMP(3),

    CONSTRAINT "printers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printer_maintenance_logs" (
    "id" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "printer_maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_jobs" (
    "id" TEXT NOT NULL,
    "status" "PrintJobStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" "JobPriority" NOT NULL DEFAULT 'MEDIUM',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "estimatedTime" INTEGER,
    "actualTime" INTEGER,
    "failureReason" TEXT,
    "failureNotes" TEXT,
    "notes" TEXT,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "printerId" TEXT,
    "spoolId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ledger_entries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "LedgerEntryType" NOT NULL,
    "source" "LedgerSource" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isNonCash" BOOLEAN NOT NULL DEFAULT false,
    "autoKey" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "orderId" TEXT,
    "spoolId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "printingHoursDay" DOUBLE PRECISION NOT NULL DEFAULT 24.0,
    "printingDays" JSONB,
    "costPerKwh" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "laborCostPerHour" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "filamentMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "printerLaborCostMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "hardwareMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "softExpensePostingMode" "SoftExpensePostingMode" NOT NULL DEFAULT 'SOFT_ONLY',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "defaultLowStockThreshold" INTEGER NOT NULL DEFAULT 20,
    "notifyFilamentLow" BOOLEAN NOT NULL DEFAULT true,
    "notifyJobFailed" BOOLEAN NOT NULL DEFAULT true,
    "notifyOrderOverdue" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "packPrice" DOUBLE PRECISION NOT NULL,
    "packQuantity" DOUBLE PRECISION NOT NULL,
    "packUnit" "HardwareUnit" NOT NULL,
    "description" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hardware_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_hardware" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "hardwareId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_hardware_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_registrations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printerCountAndMonitoring" TEXT,
    "biggestProblem" TEXT,
    "toolsTried" TEXT,
    "doublePrintersBreak" TEXT,
    "worthPerMonth" TEXT,

    CONSTRAINT "wishlist_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "durationMonths" INTEGER,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "redeemedByTenantId" TEXT,
    "stripeCouponId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "wishlistRegistrationId" TEXT,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printer_connections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "platform" "PrinterPlatform" NOT NULL,
    "host" TEXT,
    "port" INTEGER,
    "path" TEXT,
    "useTls" BOOLEAN NOT NULL DEFAULT false,
    "authType" "ConnectorAuthType",
    "accessMode" "BambuAccessMode",
    "credentialsEncrypted" JSONB,
    "capabilities" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastValidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "printer_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_agents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runtime" "ConnectorRuntime" NOT NULL,
    "name" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "version" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connector_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "connectorAgentId" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "disconnectReason" TEXT,
    "remoteAddr" TEXT,
    "userAgent" TEXT,
    "state" "ConnectionState" NOT NULL DEFAULT 'CONNECTED',
    "stats" JSONB,

    CONSTRAINT "connector_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printer_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "connectorSessionId" TEXT,
    "eventType" "PrinterEventType" NOT NULL,
    "printerStatus" "PrinterStatus",
    "platformJobId" TEXT,
    "fileName" TEXT,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "printer_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printer_live_states" (
    "printerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "PrinterStatus" NOT NULL DEFAULT 'OFFLINE',
    "platformJobId" TEXT,
    "fileName" TEXT,
    "progressPercent" INTEGER,
    "remainingSeconds" INTEGER,
    "lastHeartbeatAt" TIMESTAMP(3),
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "printer_live_states_pkey" PRIMARY KEY ("printerId")
);

-- CreateTable
CREATE TABLE "connector_tokens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "connectorAgentId" TEXT,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connector_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printer_reporter_leases" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "activeConnectorAgentId" TEXT NOT NULL,
    "leaseVersion" INTEGER NOT NULL DEFAULT 1,
    "leaseExpiresAt" TIMESTAMP(3) NOT NULL,
    "lastSwitchReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "printer_reporter_leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_files" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storageType" TEXT NOT NULL,
    "storageRef" TEXT NOT NULL,
    "platform" "PrinterPlatform",
    "externalFileId" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_print_files" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "printFileId" TEXT NOT NULL,
    "unitsPerRun" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_print_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_tenantId_key" ON "subscriptions"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "filament_types_name_key" ON "filament_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "filament_types_code_key" ON "filament_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "filament_colors_name_typeId_key" ON "filament_colors"("name", "typeId");

-- CreateIndex
CREATE UNIQUE INDEX "filaments_brand_typeId_colorId_tenantId_key" ON "filaments"("brand", "typeId", "colorId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_tenantId_key" ON "clients"("email", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "order_parts_orderId_partId_key" ON "order_parts"("orderId", "partId");

-- CreateIndex
CREATE UNIQUE INDEX "printer_models_brand_model_technology_key" ON "printer_models"("brand", "model", "technology");

-- CreateIndex
CREATE INDEX "printers_tenantId_nextMaintenanceDue_idx" ON "printers"("tenantId", "nextMaintenanceDue");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ledger_entries_autoKey_key" ON "finance_ledger_entries"("autoKey");

-- CreateIndex
CREATE INDEX "finance_ledger_entries_tenantId_date_idx" ON "finance_ledger_entries"("tenantId", "date");

-- CreateIndex
CREATE INDEX "finance_ledger_entries_tenantId_type_idx" ON "finance_ledger_entries"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_tenantId_key" ON "tenant_settings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "project_hardware_projectId_hardwareId_key" ON "project_hardware"("projectId", "hardwareId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_registrations_email_key" ON "wishlist_registrations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_wishlistRegistrationId_key" ON "discount_codes"("wishlistRegistrationId");

-- CreateIndex
CREATE INDEX "printer_connections_tenantId_platform_isEnabled_idx" ON "printer_connections"("tenantId", "platform", "isEnabled");

-- CreateIndex
CREATE INDEX "printer_connections_printerId_idx" ON "printer_connections"("printerId");

-- CreateIndex
CREATE UNIQUE INDEX "printer_connections_printerId_platform_key" ON "printer_connections"("printerId", "platform");

-- CreateIndex
CREATE INDEX "connector_agents_tenantId_runtime_isRevoked_idx" ON "connector_agents"("tenantId", "runtime", "isRevoked");

-- CreateIndex
CREATE UNIQUE INDEX "connector_agents_tenantId_fingerprint_key" ON "connector_agents"("tenantId", "fingerprint");

-- CreateIndex
CREATE INDEX "connector_sessions_tenantId_connectedAt_idx" ON "connector_sessions"("tenantId", "connectedAt" DESC);

-- CreateIndex
CREATE INDEX "connector_sessions_connectorAgentId_connectedAt_idx" ON "connector_sessions"("connectorAgentId", "connectedAt" DESC);

-- CreateIndex
CREATE INDEX "connector_sessions_tenantId_connectorAgentId_connectedAt_idx" ON "connector_sessions"("tenantId", "connectorAgentId", "connectedAt" DESC);

-- CreateIndex
CREATE INDEX "printer_events_tenantId_printerId_occurredAt_idx" ON "printer_events"("tenantId", "printerId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "printer_events_tenantId_eventType_occurredAt_idx" ON "printer_events"("tenantId", "eventType", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "printer_events_platformJobId_idx" ON "printer_events"("platformJobId");

-- CreateIndex
CREATE INDEX "printer_live_states_tenantId_status_idx" ON "printer_live_states"("tenantId", "status");

-- CreateIndex
CREATE INDEX "printer_live_states_tenantId_updatedAt_idx" ON "printer_live_states"("tenantId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "connector_tokens_tenantId_expiresAt_idx" ON "connector_tokens"("tenantId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "connector_tokens_tokenHash_key" ON "connector_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "printer_reporter_leases_tenantId_leaseExpiresAt_idx" ON "printer_reporter_leases"("tenantId", "leaseExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "printer_reporter_leases_printerId_key" ON "printer_reporter_leases"("printerId");

-- CreateIndex
CREATE INDEX "print_files_tenantId_isActive_updatedAt_idx" ON "print_files"("tenantId", "isActive", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "print_files_tenantId_platform_externalFileId_idx" ON "print_files"("tenantId", "platform", "externalFileId");

-- CreateIndex
CREATE INDEX "part_print_files_tenantId_partId_idx" ON "part_print_files"("tenantId", "partId");

-- CreateIndex
CREATE INDEX "part_print_files_tenantId_printFileId_idx" ON "part_print_files"("tenantId", "printFileId");

-- CreateIndex
CREATE UNIQUE INDEX "part_print_files_partId_printFileId_key" ON "part_print_files"("partId", "printFileId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filament_colors" ADD CONSTRAINT "filament_colors_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "filament_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filaments" ADD CONSTRAINT "filaments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filaments" ADD CONSTRAINT "filaments_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "filament_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filaments" ADD CONSTRAINT "filaments_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "filament_colors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filament_spools" ADD CONSTRAINT "filament_spools_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "filaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_parts" ADD CONSTRAINT "project_parts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_parts" ADD CONSTRAINT "project_parts_filamentColorId_fkey" FOREIGN KEY ("filamentColorId") REFERENCES "filament_colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_parts" ADD CONSTRAINT "project_parts_spoolId_fkey" FOREIGN KEY ("spoolId") REFERENCES "filament_spools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_parts" ADD CONSTRAINT "order_parts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_parts" ADD CONSTRAINT "order_parts_partId_fkey" FOREIGN KEY ("partId") REFERENCES "project_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_parts" ADD CONSTRAINT "order_parts_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "filaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printers" ADD CONSTRAINT "printers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_maintenance_logs" ADD CONSTRAINT "printer_maintenance_logs_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "printers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_partId_fkey" FOREIGN KEY ("partId") REFERENCES "project_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "printers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_spoolId_fkey" FOREIGN KEY ("spoolId") REFERENCES "filament_spools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_spoolId_fkey" FOREIGN KEY ("spoolId") REFERENCES "filament_spools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware" ADD CONSTRAINT "hardware_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_hardware" ADD CONSTRAINT "project_hardware_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_hardware" ADD CONSTRAINT "project_hardware_hardwareId_fkey" FOREIGN KEY ("hardwareId") REFERENCES "hardware"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_wishlistRegistrationId_fkey" FOREIGN KEY ("wishlistRegistrationId") REFERENCES "wishlist_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_connections" ADD CONSTRAINT "printer_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_connections" ADD CONSTRAINT "printer_connections_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "printers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_agents" ADD CONSTRAINT "connector_agents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_sessions" ADD CONSTRAINT "connector_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_sessions" ADD CONSTRAINT "connector_sessions_connectorAgentId_fkey" FOREIGN KEY ("connectorAgentId") REFERENCES "connector_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_events" ADD CONSTRAINT "printer_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_events" ADD CONSTRAINT "printer_events_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "printers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_events" ADD CONSTRAINT "printer_events_connectorSessionId_fkey" FOREIGN KEY ("connectorSessionId") REFERENCES "connector_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_live_states" ADD CONSTRAINT "printer_live_states_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "printers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_live_states" ADD CONSTRAINT "printer_live_states_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_tokens" ADD CONSTRAINT "connector_tokens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_tokens" ADD CONSTRAINT "connector_tokens_connectorAgentId_fkey" FOREIGN KEY ("connectorAgentId") REFERENCES "connector_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_tokens" ADD CONSTRAINT "connector_tokens_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_reporter_leases" ADD CONSTRAINT "printer_reporter_leases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_reporter_leases" ADD CONSTRAINT "printer_reporter_leases_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "printers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_reporter_leases" ADD CONSTRAINT "printer_reporter_leases_activeConnectorAgentId_fkey" FOREIGN KEY ("activeConnectorAgentId") REFERENCES "connector_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_files" ADD CONSTRAINT "print_files_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_print_files" ADD CONSTRAINT "part_print_files_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_print_files" ADD CONSTRAINT "part_print_files_partId_fkey" FOREIGN KEY ("partId") REFERENCES "project_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_print_files" ADD CONSTRAINT "part_print_files_printFileId_fkey" FOREIGN KEY ("printFileId") REFERENCES "print_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

