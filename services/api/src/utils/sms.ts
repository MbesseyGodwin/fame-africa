import { logger } from './logger'

export async function sendSms(phone: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.TERMII_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone,
        from: process.env.TERMII_SENDER_ID || 'FameAfrica',
        sms: message,
        type: 'plain',
        channel: 'dnd',
        api_key: process.env.TERMII_API_KEY,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error(`SMS send failed to ${phone}: ${error}`)
      return false
    }

    logger.info(`SMS sent to ${phone}`)
    return true
  } catch (error) {
    logger.error(`SMS utility error for ${phone}:`, error)
    return false
  }
}
