/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/test/room.test.js
 * Description: Unit tests for room membership, swipes, unanimous match,
 *              ties, no likes, majority mode, and solo mode.
 * Author: Jovian Niko Soesilo
 * Collaborators: Thanh Lan Ngo
 * Date Created: 2026-11-17
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, getRoom, joinRoom, recordSwipe } from '../src/services/roomStore.js';

test('unanimous match occurs when every member swipes right on the same spot', () => {
  const restaurant = { id: `test-${crypto.randomUUID()}`, name: 'Test Restaurant' };
  const room = createRoom({
    location: 'Test location',
    radiusKm: 3,
    restaurants: [restaurant],
    host: { id: crypto.randomUUID(), name: 'Host' },
  });
  const guest = { id: crypto.randomUUID(), name: 'Guest' };

  assert.equal(room.members.length, 1);
  assert.equal(joinRoom(room.code, guest).room.members.length, 2);

  const hostSwipe = recordSwipe(room.code, room.members[0].id, restaurant.id, 'right');
  assert.equal(hostSwipe.room.votes[restaurant.id], 1);
  assert.equal(hostSwipe.room.matchedRestaurant, null);

  const guestSwipe = recordSwipe(room.code, guest.id, restaurant.id, 'right');
  assert.equal(guestSwipe.room.votes[restaurant.id], 2);
  assert.equal(guestSwipe.room.matchedRestaurant.id, restaurant.id);
  assert.equal(getRoom(room.code).status, 'matched');
});

test('tie vote (split 1-1 on different spots) produces no match', () => {
  const spotA = { id: `spot-a-${crypto.randomUUID()}`, name: 'Pizza A' };
  const spotB = { id: `spot-b-${crypto.randomUUID()}`, name: 'Burger B' };
  const hostId = crypto.randomUUID();
  const guestId = crypto.randomUUID();

  const room = createRoom({
    location: 'Carlton',
    radiusKm: 3,
    matchMode: 'majority',
    restaurants: [spotA, spotB],
    host: { id: hostId, name: 'Host' },
  });
  joinRoom(room.code, { id: guestId, name: 'Guest' });

  recordSwipe(room.code, hostId, spotA.id, 'right');
  recordSwipe(room.code, hostId, spotB.id, 'left');
  recordSwipe(room.code, guestId, spotA.id, 'left');
  const afterGuest = recordSwipe(room.code, guestId, spotB.id, 'right');

  // 1 right vote out of 2 members is a tie (not > 50% and not unanimous).
  assert.equal(afterGuest.room.votes[spotA.id], 1);
  assert.equal(afterGuest.room.votes[spotB.id], 1);
  assert.equal(afterGuest.room.matchedRestaurant, null);
  assert.equal(afterGuest.room.status, 'finished');
});

test('no likes (all left swipes) leaves vote counts at zero and no match', () => {
  const spotA = { id: `spot-a-${crypto.randomUUID()}`, name: 'Noodle Spot' };
  const spotB = { id: `spot-b-${crypto.randomUUID()}`, name: 'Taco Spot' };
  const hostId = crypto.randomUUID();
  const guestId = crypto.randomUUID();

  const room = createRoom({
    location: 'Fitzroy',
    radiusKm: 2,
    restaurants: [spotA, spotB],
    host: { id: hostId, name: 'Host' },
  });
  joinRoom(room.code, { id: guestId, name: 'Guest' });

  recordSwipe(room.code, hostId, spotA.id, 'left');
  recordSwipe(room.code, hostId, spotB.id, 'left');
  recordSwipe(room.code, guestId, spotA.id, 'left');
  const finalState = recordSwipe(room.code, guestId, spotB.id, 'left');

  assert.equal(finalState.room.votes[spotA.id], 0);
  assert.equal(finalState.room.votes[spotB.id], 0);
  assert.equal(finalState.room.matchedRestaurant, null);
  assert.equal(finalState.room.status, 'finished');
});

test('solo mode matches immediately on a single right swipe', () => {
  const restaurant = { id: `solo-${crypto.randomUUID()}`, name: 'Solo Ramen' };
  const room = createRoom({
    location: 'Yarraville',
    radiusKm: 3,
    matchMode: 'solo',
    restaurants: [restaurant],
    host: { id: crypto.randomUUID(), name: 'Solo User' },
  });

  const result = recordSwipe(room.code, room.members[0].id, restaurant.id, 'right');
  assert.equal(result.room.status, 'matched');
  assert.equal(result.room.matchedRestaurant.id, restaurant.id);
});

// Helper: a room with a host, one guest, and the given restaurant ids.
function roomWithGuest(ids) {
  const room = createRoom({
    location: 'Test location',
    radiusKm: 3,
    restaurants: ids.map((id) => ({ id, name: `Restaurant ${id}` })),
    host: { id: crypto.randomUUID(), name: 'Host' },
  });
  const guest = { id: crypto.randomUUID(), name: 'Guest' };
  joinRoom(room.code, guest);
  return { code: room.code, hostId: room.members[0].id, guestId: guest.id };
}

test('no best place is picked until everyone has swiped every card', () => {
  const { code, hostId, guestId } = roomWithGuest(['a', 'b']);

  recordSwipe(code, hostId, 'a', 'right');
  recordSwipe(code, hostId, 'b', 'left');
  recordSwipe(code, guestId, 'a', 'left');

  assert.equal(getRoom(code).status, 'swiping'); // guest has not swiped b yet
  assert.equal(getRoom(code).bestRestaurant, null);
});

test('finished room picks the most votes, and ties go to the closer place', () => {
  const { code, hostId, guestId } = roomWithGuest(['near', 'far', 'nope']);

  recordSwipe(code, hostId, 'near', 'right');
  recordSwipe(code, hostId, 'far', 'left');
  recordSwipe(code, hostId, 'nope', 'left');
  recordSwipe(code, guestId, 'near', 'left');
  recordSwipe(code, guestId, 'far', 'right');
  const result = recordSwipe(code, guestId, 'nope', 'left');

  assert.equal(result.room.status, 'finished');
  assert.equal(result.room.matchedRestaurant, null);
  assert.equal(result.room.bestRestaurant.id, 'near'); // 1 vote each, 'near' comes first
});

test('finished room has no best place when nobody liked anything', () => {
  const { code, hostId, guestId } = roomWithGuest(['a', 'b']);

  for (const id of ['a', 'b']) {
    recordSwipe(code, hostId, id, 'left');
    recordSwipe(code, guestId, id, 'left');
  }

  assert.equal(getRoom(code).status, 'finished');
  assert.equal(getRoom(code).bestRestaurant, null);
});

test('a late joiner puts a finished room back into swiping', () => {
  const { code, hostId, guestId } = roomWithGuest(['a']);
  recordSwipe(code, hostId, 'a', 'left');
  recordSwipe(code, guestId, 'a', 'left');
  assert.equal(getRoom(code).status, 'finished');

  joinRoom(code, { id: crypto.randomUUID(), name: 'Late' });
  assert.equal(getRoom(code).status, 'swiping');
});

test('room swipes reject non-members and unknown restaurants', () => {
  const room = createRoom({
    location: 'Test location',
    radiusKm: 3,
    restaurants: [{ id: `test-${crypto.randomUUID()}`, name: 'Test Restaurant' }],
    host: { id: crypto.randomUUID(), name: 'Host' },
  });

  assert.deepEqual(
    recordSwipe(room.code, 'not-a-member', room.restaurants[0].id, 'right'),
    { error: 'not_a_member' },
  );
  assert.deepEqual(
    recordSwipe(room.code, room.members[0].id, 'unknown', 'right'),
    { error: 'restaurant_not_found' },
  );
});