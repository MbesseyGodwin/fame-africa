import axios from 'axios';
import { logger } from './logger';

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

export const verifyFlutterwaveTransaction = async (transactionId: string) => {
  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    logger.error(`[Flutterwave] Verification failed for ID: ${transactionId}`, error.response?.data || error.message);
    throw error;
  }
};

export const validateWebhookHash = (receivedHash: string | string[] | undefined) => {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!receivedHash || !secretHash) return false;
  return receivedHash === secretHash;
};
