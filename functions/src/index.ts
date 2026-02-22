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
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';

admin.initializeApp();

const GHOST_API_URL = 'https://momswhotrade.co/ghost/api/admin';

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
  labels: Array<{ id: string; name: string }>;
}

/**
 * Callable function: addGhostLabel
 * Finds (or creates) a Ghost member by email and adds the given label.
 * Called client-side after a Whop purchase completes.
 */
export const addGhostLabel = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { email, label } = request.data as { email?: string; label?: string };
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
    throw new HttpsError('internal', `Ghost member search failed: ${searchRes.status}`);
  }

  const searchData = (await searchRes.json()) as { members: GhostMember[] };
  const existingMember = searchData.members[0] ?? null;

  // ── 2a. Member not found → create with label ─────────────────────────────
  if (!existingMember) {
    const createRes = await fetch(`${GHOST_API_URL}/members/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ members: [{ email, labels: [{ name: label }] }] }),
    });
    if (!createRes.ok) {
      throw new HttpsError('internal', `Ghost member create failed: ${createRes.status}`);
    }
    return { success: true, action: 'created' };
  }

  // ── 2b. Member exists → add label if not already present ─────────────────
  const existingLabels = existingMember.labels.map((l) => ({ name: l.name }));
  if (existingLabels.some((l) => l.name === label)) {
    return { success: true, action: 'already_tagged' };
  }

  const updateRes = await fetch(`${GHOST_API_URL}/members/${existingMember.id}/`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      members: [{ labels: [...existingLabels, { name: label }] }],
    }),
  });
  if (!updateRes.ok) {
    throw new HttpsError('internal', `Ghost member update failed: ${updateRes.status}`);
  }

  return { success: true, action: 'labelled' };
});

/**
 * Auth trigger: syncNewUserToGhost
 * Fires whenever a new Firebase user is created (email/password or Google).
 * Creates them as a Ghost member so they're always in Ghost from day one.
 * Errors are caught and logged — user creation is never blocked.
 */
export const syncNewUserToGhost = beforeUserCreated(async (event) => {
  const email = event.data?.email;
  if (!email) return;

  try {
    const apiKey = process.env.GHOST_ADMIN_API_KEY;
    if (!apiKey) {
      console.error('syncNewUserToGhost: GHOST_ADMIN_API_KEY is not set');
      return;
    }

    const [id, secret] = apiKey.split(':');
    const token = jwt.sign({}, Buffer.from(secret, 'hex'), {
      keyid: id,
      algorithm: 'HS256',
      expiresIn: '5m',
      audience: '/admin/',
    });

    const headers = {
      Authorization: `Ghost ${token}`,
      'Content-Type': 'application/json',
      'Accept-Version': 'v5.0',
    };

    const displayName = event.data?.displayName || '';

    // Check if member already exists first
    const searchRes = await fetch(
      `${GHOST_API_URL}/members/?filter=email:'${encodeURIComponent(email)}'`,
      { headers }
    );
    if (searchRes.ok) {
      const searchData = (await searchRes.json()) as { members: GhostMember[] };
      if (searchData.members.length > 0) {
        console.log(`syncNewUserToGhost: ${email} already in Ghost`);
        return;
      }
    }

    // Create the member
    const body: Record<string, unknown> = { email };
    if (displayName) body.name = displayName;

    const createRes = await fetch(`${GHOST_API_URL}/members/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ members: [body] }),
    });

    if (createRes.ok) {
      console.log(`syncNewUserToGhost: created Ghost member for ${email}`);
    } else {
      const errText = await createRes.text();
      console.error(`syncNewUserToGhost: Ghost create failed ${createRes.status}: ${errText}`);
    }
  } catch (err) {
    // Never block user creation — just log and move on
    console.error('syncNewUserToGhost: unexpected error', err);
  }
});
