import fs from 'fs';
import path from 'path';

/**
 * Load environment variables from .env.local if not already loaded
 * Vercel dev should load this automatically, but this ensures it works
 */
export function loadEnvFromLocal() {
  if (typeof process === 'undefined' || !process.env) {
    return;
  }

  // Only load if OPENAI_API_KEY is missing
  if (process.env.OPENAI_API_KEY) {
    return;
  }

  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (key === 'OPENAI_API_KEY' && !process.env.OPENAI_API_KEY) {
            process.env.OPENAI_API_KEY = value;
          }
        }
      });
    }
  } catch (e) {
    // Ignore errors - Vercel should handle env vars
    console.warn('Could not manually load .env.local:', e.message);
  }
}

