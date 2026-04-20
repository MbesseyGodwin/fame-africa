import sharp from 'sharp';
import QRCode from 'qrcode';
import axios from 'axios';
import { logger } from './logger';

interface CardOptions {
  displayName: string;
  photoUrl: string; // Temporary link from Dropbox
  voteUrl: string;  // Web URL for voting
}

/**
 * Generate a viral campaign card for a contestant.
 * Uses sharp for image manipulation and qrcode for linking.
 */
export async function generateCampaignCard(options: CardOptions): Promise<Buffer> {
  const { displayName, photoUrl, voteUrl } = options;
  logger.info('[CardGenerator] Starting generation', { displayName });

  try {
    // 1. Fetch the user's photo
    logger.debug('[CardGenerator] Fetching user photo', { photoUrl });
    const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
    const basePhoto = Buffer.from(response.data);

    // 2. Generate the QR Code
    logger.debug('[CardGenerator] Generating QR code', { voteUrl });
    const qrBuffer = await QRCode.toBuffer(voteUrl, {
      margin: 1,
      color: {
        dark: '#A32D2D', // Primary Brand Color
        light: '#FFFFFF',
      },
      width: 250,
    });

    // 3. Define the overlays
    
    // Gradient overlay for text legibility at the bottom
    const gradientOverlay = Buffer.from(
      `<svg width="1000" height="1200">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="60%" style="stop-color:rgba(0,0,0,0);stop-opacity:0" />
            <stop offset="90%" style="stop-color:rgba(0,0,0,0.8);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1000" height="1200" fill="url(#grad)" />
      </svg>`
    );

    // Text Overlay
    // We'll use a clean font and the brand color
    const textSvg = Buffer.from(
      `<svg width="1000" height="1200">
        <style>
          .title { fill: white; font-size: 80px; font-weight: bold; font-family: Arial, sans-serif; text-transform: uppercase; }
          .name { fill: #FFD700; font-size: 120px; font-weight: bold; font-family: Arial, sans-serif; text-transform: uppercase; }
          .cta { fill: white; font-size: 40px; font-family: Arial, sans-serif; font-weight: bold; }
        </style>
        <text x="50" y="1000" class="title">VOTE FOR</text>
        <text x="50" y="1120" class="name">${displayName.slice(0, 15)}</text>
        <text x="730" y="900" class="cta">SCAN TO VOTE</text>
      </svg>`
    );

    // 4. Compose everything with Sharp
    const finalBuffer = await sharp(basePhoto)
      .resize(1000, 1200, { fit: 'cover' }) // Consistent size
      .composite([
        { input: gradientOverlay, top: 0, left: 0 },
        { input: qrBuffer, top: 920, left: 700 }, // Corner QR code
        { input: textSvg, top: 0, left: 0 }
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    logger.info('[CardGenerator] Generation complete ✓');
    return finalBuffer;
  } catch (error: any) {
    logger.error('[CardGenerator] Generation failed', { error: error.message });
    throw error;
  }
}
