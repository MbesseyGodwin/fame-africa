import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

// Ensure logs directory exists
const LOGS_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Capture request data
  const requestData = {
    method: req.method,
    path: req.originalUrl || req.url,
    query: req.query,
    body: { ...req.body }, // Clone to avoid mutating
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  };

  // Sanitize passwords
  if (requestData.body && requestData.body.password) {
    requestData.body.password = '[REDACTED]';
  }

  // Intercept response
  const originalSend = res.send;
  let responseBody: any;

  res.send = function (body: any): Response {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Parse response body if it's a string, or cap it if too large
    let parsedResponseBody = responseBody;
    try {
      if (typeof responseBody === 'string') {
        parsedResponseBody = JSON.parse(responseBody);
      }
    } catch (e) {
      // Keep as string if it's not JSON
    }

    // Limit response body size to ~10KB stringified to avoid huge logs (e.g. leaderboard arrays)
    let finalResponseBodyStr = '';
    try {
      finalResponseBodyStr = JSON.stringify(parsedResponseBody);
      if (finalResponseBodyStr.length > 10000) {
        parsedResponseBody = { _message: '[Response body truncated due to size]', preview: finalResponseBodyStr.substring(0, 500) };
      }
    } catch (e) {
      parsedResponseBody = '[Unserializable]';
    }

    const logEntry = {
      timestamp,
      method: requestData.method,
      path: requestData.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: requestData.ip,
      userAgent: requestData.userAgent,
      requestQuery: requestData.query,
      requestBody: requestData.body,
      responseBody: parsedResponseBody,
    };

    // 1. Console Log
    logger.info(`[API LOG] ${logEntry.method} ${logEntry.path} - ${logEntry.statusCode} (${duration}ms)`);

    // 2. File Log (append as JSONL)
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFilePath = path.join(LOGS_DIR, `api-traffic-${dateStr}.jsonl`);
    
    fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n', (err) => {
      if (err) {
        logger.error(`Failed to write to API log file: ${err.message}`);
      }
    });
  });

  next();
}
