import { logger } from './logger'

interface SmsProvider {
  name: string
  send(phone: string, message: string): Promise<boolean>
}

class SendchampProvider implements SmsProvider {
  name = 'Sendchamp'
  async send(phone: string, message: string): Promise<boolean> {
    const apiKey = process.env.SENDCHAMP_API_KEY
    if (!apiKey) throw new Error('SENDCHAMP_API_KEY is missing')

    const response = await fetch('https://api.sendchamp.com/api/v1/sms/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        to: [phone],
        message: message,
        sender_name: process.env.SENDCHAMP_SENDER_ID || 'Sendchamp',
        route: 'dnd'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Sendchamp API Error: ${error}`)
    }
    return true
  }
}

class TermiiProvider implements SmsProvider {
  name = 'Termii'
  async send(phone: string, message: string): Promise<boolean> {
    const apiKey = process.env.TERMII_API_KEY
    const baseUrl = process.env.TERMII_BASE_URL || 'https://api.ng.termii.com/api'
    if (!apiKey) throw new Error('TERMII_API_KEY is missing')

    const response = await fetch(`${baseUrl}/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone,
        from: process.env.TERMII_SENDER_ID || 'FameAfrica',
        sms: message,
        type: 'plain',
        channel: 'dnd',
        api_key: apiKey,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Termii API Error: ${error}`)
    }
    return true
  }
}

class SmartSMSProvider implements SmsProvider {
  name = 'SmartSMSSolutions'
  async send(phone: string, message: string): Promise<boolean> {
    const apiKey = process.env.SMARTSMS_API_KEY
    if (!apiKey) throw new Error('SMARTSMS_API_KEY is missing')

    const sender = process.env.SMARTSMS_SENDER_ID || 'FameAfrica'
    const params = new URLSearchParams({
      token: apiKey,
      sender: sender,
      to: phone,
      message: message,
      type: '0',
      routing: '3'
    })

    const response = await fetch(`https://app.smartsmssolutions.com/io/api/client/v1/sms/?${params.toString()}`, {
      method: 'GET'
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SmartSMS API Error: ${error}`)
    }
    const result = await response.text()
    if (!result.includes('successful')) {
      throw new Error(`SmartSMS API Error: ${result}`)
    }
    return true
  }
}

class AfricasTalkingProvider implements SmsProvider {
  name = 'AfricasTalking'
  async send(phone: string, message: string): Promise<boolean> {
    const apiKey = process.env.AFRICASTALKING_API_KEY
    const username = process.env.AFRICASTALKING_USERNAME || 'sandbox'
    if (!apiKey) throw new Error('AFRICASTALKING_API_KEY is missing')

    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey
      },
      body: new URLSearchParams({
        username: username,
        to: phone,
        message: message
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AfricasTalking API Error: ${error}`)
    }
    return true
  }
}

class EbulkSMSProvider implements SmsProvider {
  name = 'EbulkSMS'
  async send(phone: string, message: string): Promise<boolean> {
    const apiKey = process.env.EBULKSMS_API_KEY
    const email = process.env.EBULKSMS_EMAIL
    if (!apiKey || !email) throw new Error('EBULKSMS_API_KEY or EBULKSMS_EMAIL is missing')

    const response = await fetch('https://api.ebulksms.com/sendsms.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        SMS: {
          auth: {
            username: email,
            apikey: apiKey
          },
          message: {
            sender: process.env.EBULKSMS_SENDER_ID || 'FameAfrica',
            messagetext: message,
            flash: '0'
          },
          recipients: {
            gsm: [
              {
                msidn: phone,
                msgid: Date.now().toString()
              }
            ]
          },
          dndsender: 1
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`EbulkSMS API Error: ${error}`)
    }
    return true
  }
}

class ArkeselProvider implements SmsProvider {
  name = 'Arkesel'
  async send(phone: string, message: string): Promise<boolean> {
    const apiKey = process.env.ARKESEL_API_KEY
    if (!apiKey) throw new Error('ARKESEL_API_KEY is missing')

    const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: process.env.ARKESEL_SENDER_ID || 'FameAfrica',
        message: message,
        recipients: [phone]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Arkesel API Error: ${error}`)
    }
    return true
  }
}

// Ordered list of providers for fallback
const providers: SmsProvider[] = [
  new SendchampProvider(),
  new TermiiProvider(),
  new SmartSMSProvider(),
  new AfricasTalkingProvider(),
  new EbulkSMSProvider(),
  new ArkeselProvider()
]

export async function sendSms(phone: string, message: string): Promise<boolean> {
  logger.info(`[SMS] Starting SMS delivery for ${phone}`)
  
  for (const provider of providers) {
    try {
      logger.info(`[SMS] Attempting delivery via ${provider.name}...`)
      const success = await provider.send(phone, message)
      if (success) {
        logger.info(`[SMS] ✅ SUCCESS! Delivered to ${phone} using ${provider.name}.`)
        return true
      }
    } catch (error: any) {
      // Detailed logging for debugging
      logger.warn(`[SMS] ❌ FAILED delivery via ${provider.name}. Error: ${error?.message || error}`)
      logger.info(`[SMS] Falling back to the next provider...`)
    }
  }

  logger.error(`[SMS] 🛑 CRITICAL FAILURE: All 6 SMS providers failed to deliver message to ${phone}.`)
  return false
}
