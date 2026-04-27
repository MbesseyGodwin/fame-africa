import axios from 'axios';
import { logger } from './logger';

/**
 * Dropbox Uploader Utility
 * 
 * Access token lifecycle:
 *   The Dropbox OAuth2 refresh token (never expires) is used to obtain
 *   short-lived access tokens (4 hours). Tokens are cached in memory and
 *   refreshed automatically 60 seconds before expiry.
 */

// ── In-memory access token cache ──────────────────────────────────────────────
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0; // Unix ms

// ── Refresh the short-lived access token ─────────────────────────────────────
async function refreshAccessToken(): Promise<string> {
  logger.info('[Dropbox] Refreshing access token...');

  const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;
  const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID;
  const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET;

  if (!DROPBOX_REFRESH_TOKEN || !DROPBOX_CLIENT_ID || !DROPBOX_CLIENT_SECRET) {
    logger.error('[Dropbox] Credentials missing in environment');
    throw new Error('Dropbox credentials missing in environment');
  }

  const res = await axios.post(
    'https://api.dropbox.com/oauth2/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: DROPBOX_REFRESH_TOKEN,
      client_id: DROPBOX_CLIENT_ID,
      client_secret: DROPBOX_CLIENT_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, expires_in } = res.data;

  cachedAccessToken = access_token;
  tokenExpiresAt = Date.now() + (expires_in - 60) * 1000; // 1-min safety buffer

  logger.info('[Dropbox] Access token refreshed ✓', { expiresIn: `${expires_in}s` });
  return access_token;
}

// ── Get a valid access token (refresh if expired) ────────────────────────────
export async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }
  return refreshAccessToken();
}

/**
 * Upload a Buffer (or string) to Dropbox.
 *
 * Returns the DROPBOX FILE PATH — store this value in the DB.
 * The path is permanent and never expires.
 *
 * @param content      Buffer or UTF-8 string to upload
 * @param dropboxPath  Full Dropbox destination path e.g. "/contestants/photos/1234.jpg"
 * @returns            The same dropboxPath — confirming the file was stored there
 */
export async function uploadToDropbox(
  content: Buffer | string,
  dropboxPath: string
): Promise<string> {
  logger.info('[Dropbox] Starting upload', { path: dropboxPath });

  const token = await getAccessToken();
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');

  await axios.post(
    'https://content.dropboxapi.com/2/files/upload',
    buffer,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: dropboxPath,
          mode: 'overwrite',
          autorename: false,
          mute: false,
        }),
      },
      maxBodyLength: Infinity, // allow large files
      timeout: 600_000,  // 10-minute timeout for large video files
    }
  );

  logger.info('[Dropbox] File uploaded ✓', { path: dropboxPath });

  return dropboxPath;
}

/**
 * Get a fresh Dropbox direct-stream URL for a stored file path.
 *
 * The returned URL:
 *   - Requires NO login
 *   - Streams raw bytes directly
 *   - Valid for 4 hours
 *
 * @param dropboxPath  The path stored in DB e.g. "/contestants/photos/1234.jpg"
 * @returns            A fresh direct-stream URL
 */
export async function getTemporaryLink(dropboxPath: string): Promise<string> {
  if (!dropboxPath) return '';
  if (dropboxPath.startsWith('http')) return dropboxPath;

  logger.info('[Dropbox] Fetching temporary link', { path: dropboxPath });

  try {
    const token = await getAccessToken();

    const res = await axios.post(
      'https://api.dropboxapi.com/2/files/get_temporary_link',
      { path: dropboxPath },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const link: string = res.data.link;
    logger.info('[Dropbox] Temporary link fetched ✓', { path: dropboxPath });
    return link;
  } catch (error: any) {
    logger.error('[Dropbox] Failed to get temporary link', { 
      path: dropboxPath, 
      error: error.response?.data || error.message 
    });
    return '';
  }
}
