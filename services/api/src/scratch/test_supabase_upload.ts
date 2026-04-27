
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const ACCESS_KEY = process.env.AGORA_S3_ACCESS_KEY;
const SECRET_KEY = process.env.AGORA_S3_SECRET_KEY;
const BUCKET = process.env.AGORA_S3_BUCKET;
const ENDPOINT = process.env.AGORA_S3_ENDPOINT; // pkctjqtsisciblmihjvd.supabase.co/storage/v1/s3

async function testUpload() {
  const fileName = 'test_connection.txt';
  const content = 'Agora connection test';
  const date = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const region = 'us-east-1';
  const service = 's3';
  
  // This is a simplified S3-style upload via Supabase Storage API directly 
  // since generating AWS SigV4 in a scratch script is complex.
  // We'll use the SUPABASE_SERVICE_ROLE_KEY to see if we can reach the bucket at all.
  
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const PROJECT_ID = 'pkctjqtsisciblmihjvd';

  try {
    console.log(`Attempting to upload to: https://${PROJECT_ID}.supabase.co/storage/v1/object/${BUCKET}/${fileName}`);
    const response = await axios.post(
      `https://${PROJECT_ID}.supabase.co/storage/v1/object/${BUCKET}/${fileName}`,
      content,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': 'text/plain'
        }
      }
    );
    console.log('Manual upload SUCCESS:', response.data);
  } catch (error: any) {
    console.error('Manual upload FAILED:', error.response?.data || error.message);
  }
}

testUpload();
