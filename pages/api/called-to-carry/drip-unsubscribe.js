// pages/api/called-to-carry/drip-unsubscribe.js
// One-click unsubscribe for drip_queue emails.
// GET ?email=<email>&token=<hmac> → sets stopped=true on all matching drip_queue rows.

import { createClient } from '@supabase/supabase-js';
import { signToken } from '../../../lib/called-to-carry/auth/tokens';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send(errorPage('Method not allowed.'));
  }

  const { email, token } = req.query;

  if (!email || !token) {
    return res.status(400).send(errorPage('Invalid unsubscribe link.'));
  }

  // Verify HMAC token against email
  const expected = signToken(decodeURIComponent(email));
  if (token !== expected) {
    return res.status(403).send(errorPage('This unsubscribe link is invalid or has expired.'));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase
    .from('drip_queue')
    .update({ stopped: true })
    .eq('email', decodeURIComponent(email))
    .eq('stopped', false);

  if (error) {
    console.error('drip-unsubscribe error:', error.message);
    return res.status(500).send(errorPage('Something went wrong. Please email will@awakeningdestiny.global to unsubscribe manually.'));
  }

  return res.status(200).send(successPage(decodeURIComponent(email)));
}

function successPage(email) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribed — Awakening Destiny Global</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; background: #021A35; color: #FDF8F0;
           min-height: 100vh; display: flex; align-items: center; justify-content: center;
           padding: 2rem; text-align: center; }
    .card { max-width: 480px; }
    .label { color: #C8A951; letter-spacing: 0.12em; font-size: 0.8rem;
             text-transform: uppercase; margin-bottom: 1.5rem; font-family: sans-serif; }
    h1 { font-size: 2rem; font-weight: 400; margin-bottom: 1rem; line-height: 1.3; }
    p { opacity: 0.75; line-height: 1.7; margin-bottom: 1rem; font-size: 0.95rem; }
    a { color: #C8A951; }
  </style>
</head>
<body>
  <div class="card">
    <p class="label">Awakening Destiny Global</p>
    <h1>You have been unsubscribed.</h1>
    <p><strong>${email}</strong> has been removed from all Called to Carry email sequences.</p>
    <p>If this was a mistake, reply to any email you received or contact <a href="mailto:will@awakeningdestiny.global">will@awakeningdestiny.global</a>.</p>
  </div>
</body>
</html>`;
}

function errorPage(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribe Error — Awakening Destiny Global</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; background: #021A35; color: #FDF8F0;
           min-height: 100vh; display: flex; align-items: center; justify-content: center;
           padding: 2rem; text-align: center; }
    .card { max-width: 480px; }
    h1 { font-size: 1.8rem; font-weight: 400; margin-bottom: 1rem; }
    p { opacity: 0.75; line-height: 1.7; font-size: 0.95rem; }
    a { color: #C8A951; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Something went wrong.</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}