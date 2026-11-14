import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const KEY = 'likes';

/**
 * The like counter lives in a small database that only exists on Vercel
 * (the KV_ variables come from the Vercel integration). On a laptop those
 * variables are missing, so the counter is simply unavailable there.
 */
function connect(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

type Reply = { likes: number } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Reply>) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  const redis = connect();
  if (!redis) {
    res.status(503).json({ error: 'The like counter is not set up in this environment.' });
    return;
  }

  try {
    // GET reads the count (0 if nobody has liked yet); POST adds one atomically
    const likes = req.method === 'GET' ? (await redis.get<number>(KEY)) || 0 : await redis.incr(KEY);
    res.status(200).json({ likes });
  } catch {
    res.status(502).json({ error: 'The like counter could not be reached.' });
  }
}
