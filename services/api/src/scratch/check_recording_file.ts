
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkFile() {
  // Use the path from the LATEST session
  const filePath = 'stream_mbessey_1777095483752/b59b3965f94c0b1439b60cb5283226a1_stream_mbessey_1777095483752.m3u8';
  const bucket = 'agora-recordings';
  const project = 'pkctjqtsisciblmihjvd';
  
  const url = `https://${project}.supabase.co/storage/v1/object/public/${bucket}/${filePath}`;
  
  console.log(`Checking file at: ${url}`);
  
  try {
    const response = await axios.get(url);
    console.log('FILE FOUND! Content snippet:', response.data.substring(0, 100));
  } catch (error: any) {
    console.error('FILE NOT FOUND:', error.response?.status || error.message);
    
    // Try without the prefix folder
    const fallbackPath = '98bc98378b4cb343a5aa02b34ef098e4_stream_mbessey_1777094598501.m3u8';
    const fallbackUrl = `https://${project}.supabase.co/storage/v1/object/public/${bucket}/${fallbackPath}`;
    console.log(`Checking fallback at: ${fallbackUrl}`);
    try {
      const fbResponse = await axios.get(fallbackUrl);
      console.log('FILE FOUND AT FALLBACK! Content:', fbResponse.data.substring(0, 100));
    } catch (fbError: any) {
       console.log('FALLBACK ALSO FAILED.');
    }
  }
}

checkFile();
