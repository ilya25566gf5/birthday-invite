// /api/rsvp-plus-one.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ error: 'Server misconfigured: missing env' });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { id, plus_one_wants, plus_one_name } = req.body || {};

    if (typeof id !== 'number' || typeof plus_one_wants !== 'boolean') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const update = {
      plus_one_wants,
      plus_one_name: plus_one_wants
        ? (typeof plus_one_name === 'string' ? plus_one_name.trim() : null)
        : null
    };

    const { data, error } = await supabase
      .from('rsvp')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'DB update failed' });
    }

    return res.status(200).json({ ok: true, rsvp: data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
