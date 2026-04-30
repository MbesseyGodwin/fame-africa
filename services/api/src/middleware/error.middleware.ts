import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors'
import { logger } from '../utils/logger'
import { ApiResponse } from '../utils/response'

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // log error details
  logger.error(err)

  // Handle specific Prisma errors
  if (err.name === 'PrismaClientInitializationError' || err.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientUnknownRequestError') {
    logger.error('[Database Error]', { name: err.name, code: err.code, message: err.message })
    return ApiResponse.error(res, 'A database error occurred. Please try again later.', 503)
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
  const isDev = process.env.NODE_ENV === 'development'
  const message = isDev ? err.message : 'Internal server error'
  const errors = isDev ? { stack: err.stack, details: err } : undefined
  
  return ApiResponse.error(res, message, 500, errors)
}
