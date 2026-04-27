
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID;
const AGORA_CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET;

const resourceId = process.argv[2];
const sid = process.argv[3];

if (!resourceId || !sid) {
  console.log('Usage: npx ts-node query_recording.ts <resourceId> <sid>');
  process.exit(1);
}

const auth = Buffer.from(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`).toString('base64');
console.log('Auth header:', auth.substring(0, 10) + '...');

async function queryStatus() {
  try {
    const response = await axios.get(
      `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    console.log('Recording Status:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Error querying status Error:', error);
    console.error('Error querying status:', error.response?.data || error.message);
  }
}

queryStatus();
