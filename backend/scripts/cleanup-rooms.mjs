// Deletes old rooms from Firebase. Runs on GitHub Actions every 30 minutes (see .github/workflows/cleanup.yml).
// Needs two secrets: FIREBASE_SERVICE_ACCOUNT (the JSON key) and FIREBASE_DATABASE_URL.
// Set DRY_RUN=1 to only print what would be deleted.
import { roomsToDelete, usersToDelete } from './cleanup-lib.mjs';

const { FIREBASE_SERVICE_ACCOUNT, FIREBASE_DATABASE_URL, DRY_RUN } = process.env;
if (!FIREBASE_SERVICE_ACCOUNT || !FIREBASE_DATABASE_URL) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_DATABASE_URL (see .env.example).');
  process.exit(1);
}

const { default: admin } = await import('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)),
  databaseURL: FIREBASE_DATABASE_URL,
});
const db = admin.database();
const now = Date.now();

const rooms = (await db.ref('rooms').get()).val() || {};
const users = (await db.ref('users').get()).val() || {};
const oldRooms = roomsToDelete(rooms, now);
const oldUsers = usersToDelete(users, now);

console.log(`Rooms: ${Object.keys(rooms).length} total, ${oldRooms.length} to delete.`);
console.log(`Room-creation markers: ${Object.keys(users).length} total, ${oldUsers.length} to delete.`);

const updates = {};
for (const c of oldRooms) updates[`rooms/${c}`] = null;
for (const u of oldUsers) updates[`users/${u}`] = null;

if (DRY_RUN) console.log('DRY_RUN is set: nothing deleted.');
else if (Object.keys(updates).length) await db.ref().update(updates);

await admin.app().delete();
