import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors'
import { logger } from '../utils/logger'
import { ApiResponse } from '../utils/response'

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // log error details
  logger.error(err)

  // Handle specific Prisma errors
  if (err.name === 'PrismaClientInitializationError') {
    return ApiResponse.internalError(res, 'Database connection failed. Please check if your database is running.')
  }

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode, process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined)
  }

  // Prisma Unique constraint
  if (err.code === 'P2002') {
    return ApiResponse.error(res, 'A record with this value already exists', 409)
  }

  // Prisma Record not found
  if (err.code === 'P2025') {
    return ApiResponse.notFound(res, 'Record not found')
  }

  // Default error
  const message = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  const errors = process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  
  return ApiResponse.error(res, message, 500, errors)
}
