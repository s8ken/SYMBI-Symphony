import type { NextRequest } from "next/server"
import {
  withApiMiddleware,
  createSuccessResponse,
  createErrorResponse,
  type ApiContext,
} from "../../../lib/api-middleware"

async function healthCheck(req: NextRequest, context: ApiContext) {
  const startTime = Date.now()
  
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "unknown",
    environment: process.env.NODE_ENV || "unknown",
    services: {} as Record<string, any>,
    performance: {} as Record<string, any>
  }

  // Database connection check
  try {
    if (context.db) {
      const dbStart = Date.now()
      await context.db.admin().ping()
      healthStatus.services.database = {
        status: "healthy",
        responseTime: Date.now() - dbStart + "ms"
      }
    } else {
      healthStatus.services.database = {
        status: "unavailable",
        error: "Database connection not available"
      }
    }
  } catch (error) {
    healthStatus.services.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown database error"
    }
  }

  // Check environment variables
  const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI"]
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  healthStatus.services.environment = {
    status: missingEnvVars.length === 0 ? "healthy" : "degraded",
    missingVariables: missingEnvVars.length > 0 ? missingEnvVars : undefined
  }

  // Memory usage
  const memUsage = process.memoryUsage()
  healthStatus.performance.memory = {
    rss: Math.round(memUsage.rss / 1024 / 1024) + "MB",
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + "MB",
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + "MB",
    external: Math.round(memUsage.external / 1024 / 1024) + "MB"
  }

  // Response time
  healthStatus.performance.responseTime = Date.now() - startTime + "ms"

  // Determine overall health
  const unhealthyServices = Object.values(healthStatus.services).filter(
    service => service.status === "unhealthy"
  )
  
  if (unhealthyServices.length > 0) {
    healthStatus.status = "unhealthy"
    return createErrorResponse(503, "Service Unhealthy", "One or more services are unhealthy", healthStatus, context.requestId)
  }

  const degradedServices = Object.values(healthStatus.services).filter(
    service => service.status === "degraded"
  )
  
  if (degradedServices.length > 0) {
    healthStatus.status = "degraded"
  }

  return createSuccessResponse(healthStatus, "Health check completed", context.requestId)
}

// Export GET handler with minimal middleware (no auth required for health checks)
export const GET = withApiMiddleware(healthCheck, {
  auth: "none",
  methods: ["GET"],
  rateLimit: "default"
})