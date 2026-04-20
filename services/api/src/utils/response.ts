import { Response } from 'express'

export class ApiResponse {
  static success(res: Response, data: any, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data })
  }

  static created(res: Response, data: any, message = 'Created') {
    return res.status(201).json({ success: true, message, data })
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
    })
  }

  static error(res: Response, message: string, statusCode = 400, errors?: any) {
    return res.status(statusCode).json({ success: false, message, ...(errors && { errors }) })
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return res.status(401).json({ success: false, message })
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return res.status(403).json({ success: false, message })
  }

  static notFound(res: Response, message = 'Not found') {
    return res.status(404).json({ success: false, message })
  }
}
