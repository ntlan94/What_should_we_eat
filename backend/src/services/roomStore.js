/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/services/roomStore.js
 * Description: In-memory room store (backed by a Map) managing rooms,
 *              members, swipes, match modes ('all' | 'majority' | 'solo'),
 *              and automatic TTL cleanup.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-21
 * Last Modified: 2026-11-23
 * Modified by: Jovian Niko Soesilo
 * ============================================================================
 */

const rooms = new Map();

// Expire inactive rooms after 2 hours so memory stays bounded.
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

export const VALID_MATCH_MODES = new Set(['all', 'majority', 'solo']);

/**
 * Removes rooms whose lastActivityAt exceeds ROOM_TTL_MS.
 */
export function clearExpiredRooms(now = Date.now()) {
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActivityAt > ROOM_TTL_MS) {
      rooms.delete(code);
    }
  }
}

const cleanupTimer = setInterval(() => clearExpiredRooms(), CLEANUP_INTERVAL_MS);
if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

/**
 * Checks whether rightVotes meets the room's matchMode requirement.
 * - 'solo': At least 1 right vote (1-person mode).
 * - 'majority': Strictly more than half of current members (> 50%).
 * - 'all': Every member (> 1 member) has swiped right.
 */
function isMatchThresholdMet(matchMode, rightVotes, memberCount) {
  if (memberCount < 1) return false;
  if (matchMode === 'solo') return rightVotes >= 1;
  if (matchMode === 'majority') return rightVotes > memberCount / 2;
  return memberCount > 1 && rightVotes >= memberCount;
}

/**
 * Converts an internal room object into a public snapshot with vote counts
 * and match status.
 */
function toPublicRoom(room) {
  const votes = Object.fromEntries(room.restaurants.map(({ id }) => [id, 0]));

  // Count 'right' votes across all room members for restaurants in this room.
  for (const memberSwipes of Object.values(room.swipes)) {
    for (const [restaurantId, direction] of Object.entries(memberSwipes)) {
      if (direction === 'right' && Object.hasOwn(votes, restaurantId)) {
        votes[restaurantId] += 1;
      }
    }
  }

  const memberCount = room.members.length;
  const matchedRestaurant =
    room.restaurants.find((restaurant) =>
      isMatchThresholdMet(room.matchMode, votes[restaurant.id] || 0, memberCount)
    ) ?? null;

  const matchDetails = matchedRestaurant
    ? {
        mode: room.matchMode,
        rightVotes: votes[matchedRestaurant.id] || 0,
        totalMembers: memberCount,
      }
    : null;

  const finished = !matchedRestaurant && everyoneFinished(room);

  return {
    code: room.code,
    location: room.location,
    radiusKm: room.radiusKm,
    openNow: Boolean(room.openNow),
    matchMode: room.matchMode,
    restaurants: room.restaurants,
    members: room.members,
    votes,
    status: matchedRestaurant ? 'matched' : finished ? 'finished' : 'swiping',
    matchedRestaurant,
    matchDetails,
    bestRestaurant: finished ? mostLiked(room.restaurants, votes) : null,
  };
}


// True when everyone has swiped every card. In 'all' mode a lone host does not
// count (same as matching), so they can't finish before friends join.
function everyoneFinished(room) {
  const minMembers = room.matchMode === 'all' ? 2 : 1;
  return room.members.length >= minMembers && room.members.every((member) =>
    room.restaurants.every((restaurant) => room.swipes[member.id]?.[restaurant.id])
  );
}

// The restaurant with the most right swipes, or null if nobody liked anything.
// Ties go to the earlier card, which is the closer place.
function mostLiked(restaurants, votes) {
  let best = null;
  for (const restaurant of restaurants) {
    if (votes[restaurant.id] > (best ? votes[best.id] : 0)) best = restaurant;
  }
  return best;
}

function generateUniqueCode() {
  let code;
  do {
    code = Math.random().toString(36).slice(2, 6).padEnd(4, '0').toUpperCase();
  } while (rooms.has(code));
  return code;
}

export function createRoom({
  location,
  radiusKm,
  openNow = false,
  matchMode = 'all',
  restaurants,
  host,
}) {
  clearExpiredRooms();
  const code = generateUniqueCode();
  const normalizedMode = VALID_MATCH_MODES.has(matchMode) ? matchMode : 'all';

  const room = {
    code,
    location,
    radiusKm,
    openNow: Boolean(openNow),
    matchMode: normalizedMode,
    restaurants,
    members: [{ ...host, isHost: true }],
    swipes: {},
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };

  rooms.set(code, room);
  return toPublicRoom(room);
}

export function getRoom(code) {
  const room = rooms.get(code);
  if (!room) return null;
  room.lastActivityAt = Date.now();
  return toPublicRoom(room);
}

export function joinRoom(code, member) {
  const room = rooms.get(code);
  if (!room) return { error: 'not_found' };
  if (toPublicRoom(room).status === 'matched') return { error: 'matched' };

  room.lastActivityAt = Date.now();
  const existingIndex = room.members.findIndex((existing) => existing.id === member.id);
  if (existingIndex === -1) {
    room.members.push({ ...member, isHost: false });
  } else if (member.name) {
    room.members[existingIndex] = {
      ...room.members[existingIndex],
      name: member.name,
    };
  }

  return { room: toPublicRoom(room) };
}

export function recordSwipe(code, memberId, restaurantId, direction) {
  const room = rooms.get(code);
  if (!room) return { error: 'not_found' };
  if (!room.members.some((member) => member.id === memberId)) {
    return { error: 'not_a_member' };
  }
  if (!room.restaurants.some((restaurant) => restaurant.id === restaurantId)) {
    return { error: 'restaurant_not_found' };
  }
  if (toPublicRoom(room).status === 'matched') return { error: 'matched' };

  room.lastActivityAt = Date.now();
  room.swipes[memberId] ??= {};
  room.swipes[memberId][restaurantId] = direction;

  return { room: toPublicRoom(room) };
}