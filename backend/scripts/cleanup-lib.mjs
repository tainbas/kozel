// Decides which rooms are old and can be deleted. Pure functions, so they're easy to test.
export const DEFAULTS = {
  idleMs: 30 * 60 * 1000,          // nobody in the room and no activity for 30 minutes
  maxAgeMs: 48 * 60 * 60 * 1000,   // any room older than 2 days, even if someone is still connected
  userMaxAgeMs: 24 * 60 * 60 * 1000, // "last room created" markers older than a day
};

export function roomsToDelete(rooms, now, opts = DEFAULTS) {
  const out = [];
  for (const [code, room] of Object.entries(rooms || {})) {
    const meta = room && room.meta;
    if (!meta || typeof meta.created !== 'number') { out.push(code); continue; }   // broken room
    const someoneHere = !!(room.presence && Object.keys(room.presence).length);
    const lastActivity = Math.max(meta.created, typeof meta.active === 'number' ? meta.active : 0);
    if (now - meta.created > opts.maxAgeMs) { out.push(code); continue; }
    if (!someoneHere && now - lastActivity > opts.idleMs) out.push(code);
  }
  return out;
}

export function usersToDelete(users, now, opts = DEFAULTS) {
  return Object.entries(users || {})
    .filter(([, u]) => !u || typeof u.lastRoom !== 'number' || now - u.lastRoom > opts.userMaxAgeMs)
    .map(([uid]) => uid);
}
