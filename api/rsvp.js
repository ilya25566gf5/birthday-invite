// /api/rsvp.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS (минимально)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY; // <-- ВАЖНО

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Missing env', { hasUrl: !!SUPABASE_URL, hasKey: !!SERVICE_ROLE });
    return res.status(500).json({ error: 'Server misconfigured: missing env' });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { name, surname, going } = req.body || {};

    if (
      typeof name !== 'string' || name.trim().length === 0 ||
      typeof surname !== 'string' || surname.trim().length === 0 ||
      typeof going !== 'boolean'
    ) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const user_agent = req.headers['user-agent'] || null;
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      null;

    const { data, error } = await supabase
      .from('rsvp')
      .insert({
        name: name.trim(),
        surname: surname.trim(),
        going,
        user_agent,
        ip
      })
      .select()
      .single();

    if (error) {
      console.error('DB insert error', error);
      return res.status(500).json({ error: 'DB insert failed' });
    }

    return res.status(200).json({ ok: true, rsvp: data });
  } catch (e) {
    console.error('Unexpected', e);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
