/**
 * Moms Who Trade — Firebase Cloud Functions
 *
 * SETUP (one-time, run from project root):
 *
 *   npm install -g firebase-tools
 *   firebase login
 *
 *   # Store your Ghost Admin API key as a Firebase secret:
 *   # Get it from: momswhotrade.co/ghost/#/settings/integrations
 *   # It looks like: 6863a5c...d5:4a9f2c8...e7 (id:hex-secret)
 *   firebase functions:secrets:set GHOST_ADMIN_API_KEY
 *
 *   # Install function dependencies:
 *   cd functions && npm install && cd ..
 *
 *   # Deploy:
 *   firebase deploy --only functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';

admin.initializeApp();

const GHOST_ADMIN_API_KEY = defineSecret('GHOST_ADMIN_API_KEY');
const GHOST_API_URL = 'https://momswhotrade.co/ghost/api/admin';

/** Creates a short-lived Ghost Admin API JWT from the stored key. */
function ghostToken(apiKey: string): string {
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
 *
 * Finds (or creates) a Ghost member by email and adds the given label.
 * Called client-side after a Whop purchase completes.
 *
 * @param data.email  The user's email address
 * @param data.label  The label to add, e.g. "workshop-buyer" or "call-buyer"
 */
export const addGhostLabel = onCall(
  { secrets: [GHOST_ADMIN_API_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const { email, label } = request.data as { email?: string; label?: string };

    if (!email || !label) {
      throw new HttpsError('invalid-argument', 'email and label are required.');
    }

    const token = ghostToken(GHOST_ADMIN_API_KEY.value());
    const headers = {
      Authorization: `Ghost ${token}`,
      'Content-Type': 'application/json',
      'Accept-Version': 'v5.0',
    };

    // ── 1. Find member by email ─────────────────────────────────────────────
    const searchRes = await fetch(
      `${GHOST_API_URL}/members/?filter=email:'${encodeURIComponent(email)}'`,
      { headers }
    );

    if (!searchRes.ok) {
      throw new HttpsError('internal', `Ghost member search failed: ${searchRes.status}`);
    }

    const searchData = (await searchRes.json()) as { members: GhostMember[] };
    const existingMember = searchData.members[0] ?? null;

    // ── 2a. Member not found → create with label ────────────────────────────
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

    // ── 2b. Member exists → add label if not already present ────────────────
    const existingLabels = existingMember.labels.map((l) => ({ name: l.name }));
    const alreadyTagged = existingLabels.some((l) => l.name === label);

    if (alreadyTagged) {
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
  }
);
