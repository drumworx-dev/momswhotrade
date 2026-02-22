/**
 * Moms Who Trade — Firebase Cloud Functions
 *
 * SETUP (one-time):
 *
 *   1. Get your Ghost Admin API key:
 *      Go to momswhotrade.co/ghost/#/settings/integrations
 *      → Create a custom integration → copy the "Admin API Key"
 *      It looks like: 6863a5c...d5:4a9f2c8...e7  (id:hex-secret)
 *
 *   2. Add it to functions/.env  (this file is gitignored, never committed):
 *      GHOST_ADMIN_API_KEY=paste_your_key_here
 *
 *   3. Install function dependencies (run once from project root):
 *      cd functions && npm install && cd ..
 *
 *   4. Deploy:
 *      firebase deploy --only functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';

admin.initializeApp();

// Use the canonical Ghost host (moms.ghost.io) rather than the custom domain
// (momswhotrade.co) which redirects — Node.js fetch drops the Authorization
// header on cross-origin redirects, causing Ghost to return 403.
const GHOST_API_URL = 'https://moms.ghost.io/ghost/api/admin';

/** Creates a short-lived Ghost Admin API JWT from the key in functions/.env */
function ghostToken(): string {
  const apiKey = process.env.GHOST_ADMIN_API_KEY;
  if (!apiKey) throw new HttpsError('internal', 'GHOST_ADMIN_API_KEY is not set.');
  const [id, secret] = apiKey.split(':');
  return jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: '/admin/',
  });
}

interface GhostMember {
  id: string;
  name: string;
  labels: Array<{ id: string; name: string }>;
  newsletters: Array<{ id: string }>;
}

/** Fetches the default (first) newsletter ID from Ghost, or null if none found. */
async function fetchDefaultNewsletterId(headers: Record<string, string>): Promise<string | null> {
  const res = await fetch(`${GHOST_API_URL}/newsletters/?limit=1`, { headers });
  if (!res.ok) return null;
  const data = (await res.json()) as { newsletters: Array<{ id: string }> };
  return data.newsletters[0]?.id ?? null;
}

/**
 * Callable function: addGhostLabel
 * Finds (or creates) a Ghost member by email, adds the given label, and
 * optionally subscribes them to the default newsletter (when subscribeToNewsletter=true).
 * Handles both actions server-side to avoid client-side CORS issues.
 */
export const addGhostLabel = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { email, label, subscribeToNewsletter, name } = request.data as {
    email?: string;
    label?: string;
    subscribeToNewsletter?: boolean;
    name?: string;
  };
  if (!email || !label) {
    throw new HttpsError('invalid-argument', 'email and label are required.');
  }

  const token = ghostToken();
  const headers = {
    Authorization: `Ghost ${token}`,
    'Content-Type': 'application/json',
    'Accept-Version': 'v5.0',
  };

  // ── 1. Find member by email ───────────────────────────────────────────────
  const searchRes = await fetch(
    `${GHOST_API_URL}/members/?filter=email:'${encodeURIComponent(email)}'`,
    { headers }
  );
  if (!searchRes.ok) {
    const body = await searchRes.text().catch(() => '');
    console.error(`Ghost member search failed ${searchRes.status}: ${body}`);
    throw new HttpsError('internal', `Ghost member search failed: ${searchRes.status} — ${body}`);
  }

  const searchData = (await searchRes.json()) as { members: GhostMember[] };
  const existingMember = searchData.members[0] ?? null;

  // Fetch newsletter ID now if we need it (one request, reused below)
  const newsletterId = subscribeToNewsletter ? await fetchDefaultNewsletterId(headers) : null;

  // ── 2a. Member not found → create with label (and newsletter if consented) ─
  if (!existingMember) {
    const newMember: Record<string, unknown> = { email, labels: [{ name: label }] };
    if (name) newMember.name = name;
    if (newsletterId) newMember.newsletters = [{ id: newsletterId }];

    const createRes = await fetch(`${GHOST_API_URL}/members/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ members: [newMember] }),
    });
    if (!createRes.ok) {
      const body = await createRes.text().catch(() => '');
      console.error(`Ghost member create failed ${createRes.status}: ${body}`);
      throw new HttpsError('internal', `Ghost member create failed: ${createRes.status} — ${body}`);
    }
    return { success: true, action: 'created' };
  }

  // ── 2b. Member exists → patch label + newsletter if needed ────────────────
  const existingLabels = existingMember.labels.map((l) => ({ name: l.name }));
  const needsLabel = !existingLabels.some((l) => l.name === label);
  const alreadySubscribed = newsletterId
    ? existingMember.newsletters.some((n) => n.id === newsletterId)
    : true;

  const needsName = !!name && !existingMember.name;

  if (!needsLabel && alreadySubscribed && !needsName) {
    return { success: true, action: 'already_tagged' };
  }

  const patch: Record<string, unknown> = {};
  if (needsName) patch.name = name;
  if (needsLabel) patch.labels = [...existingLabels, { name: label }];
  if (!alreadySubscribed && newsletterId) {
    patch.newsletters = [...existingMember.newsletters.map((n) => ({ id: n.id })), { id: newsletterId }];
  }

  const updateRes = await fetch(`${GHOST_API_URL}/members/${existingMember.id}/`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ members: [patch] }),
  });
  if (!updateRes.ok) {
    const body = await updateRes.text().catch(() => '');
    console.error(`Ghost member update failed ${updateRes.status}: ${body}`);
    throw new HttpsError('internal', `Ghost member update failed: ${updateRes.status} — ${body}`);
  }

  return { success: true, action: 'labelled' };
});
