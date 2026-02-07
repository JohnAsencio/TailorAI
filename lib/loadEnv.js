import fs from 'fs';
import path from 'path';

export function loadEnvFromLocal() {
  if (typeof process === 'undefined' || !process.env) {
    return;
  }
  try {
    let dir = process.cwd();
    let envPath = path.join(dir, '.env.local');
    for (let i = 0; i < 6 && !fs.existsSync(envPath); i += 1) {
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
      envPath = path.join(dir, '.env.local');
    }
    if (!fs.existsSync(envPath)) return;
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (e) {
    console.warn('Could not load .env.local:', e.message);
  }
}
