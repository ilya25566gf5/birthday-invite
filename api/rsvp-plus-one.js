// /api/rsvp-plus-one.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Missing env', { hasUrl: !!SUPABASE_URL, hasKey: !!SERVICE_ROLE });
    return res.status(500).json({ ok: false, error: 'Server misconfigured: missing env' });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { id, plus_one_wants, plus_one_name } = req.body || {};

    // допускаем и число, и строку
    const parsedId = Number(id);

    if (!Number.isFinite(parsedId) || typeof plus_one_wants !== 'boolean') {
      console.error('Invalid payload in /rsvp-plus-one', {
        id,
        parsedId,
        plus_one_wants,
        plus_one_name,
      });
      return res.status(400).json({ ok: false, error: 'Invalid payload' });
    }

    const update = {
      plus_one_wants,
      plus_one_name: plus_one_wants
        ? (typeof plus_one_name === 'string' ? plus_one_name.trim() : null)
        : null,
    };

    const { data, error } = await supabase
      .from('rsvp')
      .update(update)
      .eq('id', parsedId)
      .select();

    if (error) {
      console.error('DB update error in /rsvp-plus-one', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'DB update failed',
        details: error,         // ← чтобы увидеть код/детали
      });
    }

    if (!data || data.length === 0) {
      console.error('No row found for id in /rsvp-plus-one', parsedId);
      return res.status(404).json({ ok: false, error: 'RSVP not found' });
    }

    return res.status(200).json({ ok: true, rsvp: data[0] });
  } catch (e) {
    console.error('Unexpected error in /rsvp-plus-one', e);
    return res.status(500).json({ ok: false, error: 'Unexpected server error' });
  }
}
