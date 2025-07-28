import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

export function trackApiResponse(endpoint: string, duration: number, status: number) {
  logger.info('API Response', {
    endpoint,
    duration,
    status,
    timestamp: new Date().toISOString()
  })
}

export function trackChatResponse(chatbotId: string, responseTime: number, language: string) {
  logger.info('Chat Response', {
    chatbotId,
    responseTime,
    language,
    timestamp: new Date().toISOString()
  })
}

export function trackError(error: Error, context?: any) {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  })
}