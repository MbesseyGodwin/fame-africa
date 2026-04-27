import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const SUPABASE_URL = `https://pkctjqtsisciblmihjvd.supabase.co`;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function listFiles() {
  try {
    const response = await axios.post(
      `${SUPABASE_URL}/storage/v1/object/list/agora-recordings`,
      {
        prefix: "",
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "desc" }
      },
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Files in agora-recordings:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Error listing files:', error.response?.data || error.message);
  }
}

listFiles();
