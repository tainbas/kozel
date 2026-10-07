import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roomsToDelete, usersToDelete, DEFAULTS } from './cleanup-lib.mjs';

const MIN = 60 * 1000, HOUR = 60 * MIN;
const now = Date.UTC(2026, 9, 7, 12, 0, 0);

test('keeps an active room with players in it', () => {
  const rooms = { 1234: { meta: { created: now - 2 * HOUR, active: now - MIN }, presence: { a: true } } };
  assert.deepEqual(roomsToDelete(rooms, now), []);
});

test('keeps an empty room that was active a few minutes ago (someone reloading)', () => {
  const rooms = { 1234: { meta: { created: now - HOUR, active: now - 5 * MIN } } };
  assert.deepEqual(roomsToDelete(rooms, now), []);
});

test('deletes an empty room idle for more than 30 minutes', () => {
  const rooms = { 1234: { meta: { created: now - 3 * HOUR, active: now - 31 * MIN } } };
  assert.deepEqual(roomsToDelete(rooms, now), ['1234']);
});

test('uses the creation time when there is no activity time yet', () => {
  const rooms = { 1111: { meta: { created: now - 40 * MIN } }, 2222: { meta: { created: now - 10 * MIN } } };
  assert.deepEqual(roomsToDelete(rooms, now), ['1111']);
});

test('deletes rooms older than 2 days even if someone is connected', () => {
  const rooms = { 9999: { meta: { created: now - 49 * HOUR, active: now }, presence: { a: true } } };
  assert.deepEqual(roomsToDelete(rooms, now), ['9999']);
});

test('deletes broken rooms without meta or creation time', () => {
  const rooms = { 1: {}, 2: { meta: {} }, 3: { meta: { created: 'x' } }, 4: null };
  assert.deepEqual(roomsToDelete(rooms, now).sort(), ['1', '2', '3', '4']);
});

test('handles an empty database', () => {
  assert.deepEqual(roomsToDelete(null, now), []);
  assert.deepEqual(usersToDelete(undefined, now), []);
});

test('custom limits are respected', () => {
  const rooms = { 5555: { meta: { created: now - 20 * MIN } } };
  assert.deepEqual(roomsToDelete(rooms, now, { ...DEFAULTS, idleMs: 10 * MIN }), ['5555']);
});

test('removes old room-creation markers only', () => {
  const users = { old: { lastRoom: now - 25 * HOUR }, fresh: { lastRoom: now - HOUR }, bad: {} };
  assert.deepEqual(usersToDelete(users, now).sort(), ['bad', 'old']);
});
