import { Response } from 'express'

export class ApiResponse {
  static success(res: Response, data: any, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    })
  }

  static created(res: Response, data: any, message = 'Created') {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    })
  }

  static paginated(res: Response, data: any[], total: number, page: number, limit: number, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString()
    })
  }

  static error(res: Response, message: string, statusCode = 400, errors?: any) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString()
    })
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return this.error(res, message, 401)
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return this.error(res, message, 403)
  }

  static notFound(res: Response, message = 'Not found') {
    return this.error(res, message, 404)
  }

  static badRequest(res: Response, message = 'Bad request') {
    return this.error(res, message, 400)
  }

  static internalError(res: Response, message = 'Internal server error') {
    return this.error(res, message, 500)
  }
}
