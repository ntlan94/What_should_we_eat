/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/services/database.js
 no-match-fallback
 * Description: In-memory storage for rooms, members, and swipes.
 *              If nobody fully matches, picks the most-liked place.
 * Modified by: Jovian Niko Soesilo
 * Description: In-memory room, member, swipe, and match-mode engine supporting
 *              unanimous ('all'), over-50% ('majority'), and solo ('solo') modes,
 *              plus automatic cleanup of stale rooms.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-21
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 main
 */

const rooms = new Map();

// Expire rooms after 2 hours of inactivity to keep memory usage bounded.
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

export const VALID_MATCH_MODES = new Set(['all', 'majority', 'solo']);

/**
 * Removes rooms whose last activity timestamp is older than ROOM_TTL_MS.
 */
export function clearExpiredRooms(now = Date.now()) {
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActivityAt > ROOM_TTL_MS) {
      rooms.delete(code);
    }
  }
}

// Run periodic cleanup without keeping the Node event loop alive unnecessarily.
const cleanupTimer = setInterval(() => clearExpiredRooms(), CLEANUP_INTERVAL_MS);
if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

/**
 * Evaluates whether a given right-vote count satisfies the room's matchMode.
 * - 'solo': Matches as soon as at least 1 right vote is cast (ideal for 1-person mode).
 * - 'majority': Matches when right votes are strictly more than half of current members.
 * - 'all' (default): Matches when every member (>1) has swiped right on the restaurant.
 */
function isMatchThresholdMet(matchMode, rightVotes, memberCount) {
  if (memberCount < 1) return false;
  if (matchMode === 'solo') {
    return rightVotes >= 1;
  }
  if (matchMode === 'majority') {
    return rightVotes > memberCount / 2;
  }
  // Default: 'all' (requires at least 2 members so a solo host doesn't auto-match accidentally)
  return memberCount > 1 && rightVotes >= memberCount;
}

/**
 * Builds a sanitized public snapshot of a room including vote tallies and match state.
 */
function toPublicRoom(room) {
  const votes = Object.fromEntries(room.restaurants.map(({ id }) => [id, 0]));

  // Count 'right' swipes from each member for restaurants currently in this room's deck.
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
    // 'matched'  = everyone swiped right on the same place
    // 'finished' = everyone swiped every card with no full match -> see bestRestaurant
    status: matchedRestaurant ? 'matched' : finished ? 'finished' : 'swiping',
    matchedRestaurant,
 no-match-fallback
    bestRestaurant: finished ? mostLiked(room.restaurants, votes) : null,
  };
}

// True when 2+ people are in the room and each has swiped on every restaurant.
function everyoneFinished(room) {
  return room.members.length > 1 && room.members.every((member) =>
    room.restaurants.every((restaurant) => room.swipes[member.id]?.[restaurant.id])
  );
}

// The restaurant with the most right swipes, or null if nobody liked anything.
// Ties go to the earlier card, which is the closer place (the deck is sorted by distance).
function mostLiked(restaurants, votes) {
  let best = null;
  for (const restaurant of restaurants) {
    if (votes[restaurant.id] > (best ? votes[best.id] : 0)) best = restaurant;
  }
  return best;
}

export function createRoom({ location, radiusKm, restaurants, host }) {

    matchDetails,
  };
}

/**
 * Generates a unique 4-character alphanumeric room code.
 */
function generateUniqueCode() {
main
  let code;
  do {
    code = Math.random().toString(36).slice(2, 6).padEnd(4, '0').toUpperCase();
  } while (rooms.has(code));
  return code;
}

/**
 * Creates a new swipe room and stores it in memory.
 */
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

/**
 * Retrieves the public state of a room by code, or null if not found.
 */
export function getRoom(code) {
  const room = rooms.get(code);
  if (!room) return null;
  room.lastActivityAt = Date.now();
  return toPublicRoom(room);
}

/**
 * Adds a member to an existing room if the room is not already matched.
 */
export function joinRoom(code, member) {
  const room = rooms.get(code);
  if (!room) return { error: 'not_found' };
  if (toPublicRoom(room).status === 'matched') return { error: 'matched' };

  room.lastActivityAt = Date.now();
  const existingIndex = room.members.findIndex((existing) => existing.id === member.id);
  if (existingIndex === -1) {
    room.members.push({ ...member, isHost: false });
  } else if (member.name) {
    // Allow updating display name if the same browser session rejoins.
    room.members[existingIndex] = {
      ...room.members[existingIndex],
      name: member.name,
    };
  }

  return { room: toPublicRoom(room) };
}

/**
 * Records a member's left or right swipe on a restaurant and checks for a match.
 */
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