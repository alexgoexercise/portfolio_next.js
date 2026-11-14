import type { NextApiRequest, NextApiResponse } from 'next';
// import { Redis } from '@upstash/redis';

// const KEY = 'likes';

/**
 * Redis-backed like counter (commented out).
 * The contacts page now uses session-only likes that reset on reload.
 * Re-enable by uncommenting below and restoring the fetch calls in contacts.tsx.
 * Needs KV_REST_API_URL + KV_REST_API_TOKEN from the Vercel Redis integration.
 */
// function connect(): Redis | null {
//   const url = process.env.KV_REST_API_URL;
//   const token = process.env.KV_REST_API_TOKEN;
//   return url && token ? new Redis({ url, token }) : null;
// }

type Reply = { likes: number } | { error: string };

export default async function handler(_req: NextApiRequest, res: NextApiResponse<Reply>) {
  // Redis path commented out — contacts.tsx keeps likes in React state for this session only.
  // if (_req.method !== 'GET' && _req.method !== 'POST') {
  //   res.setHeader('Allow', ['GET', 'POST']);
  //   res.status(405).json({ error: `Method ${_req.method} not allowed` });
  //   return;
  // }
  // const redis = connect();
  // if (!redis) {
  //   res.status(503).json({ error: 'The like counter is not set up in this environment.' });
  //   return;
  // }
  // try {
  //   const likes = _req.method === 'GET' ? (await redis.get<number>(KEY)) || 0 : await redis.incr(KEY);
  //   res.status(200).json({ likes });
  // } catch {
  //   res.status(502).json({ error: 'The like counter could not be reached.' });
  // }

  res.status(503).json({ error: 'The Redis like counter is disabled; likes are session-only on the client.' });
}
