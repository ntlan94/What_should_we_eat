/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/services/sync.js
 * Description: Polls the backend room state periodically so members see new
 *              participants join and detect matches triggered by any member.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-16
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import { fetchRoom } from './api.js';

const POLL_INTERVAL_MS = 2000;

/**
 * Starts polling room state every 2 seconds and emits events via onRoomUpdated.
 * Returns an unsubscribe function that stops polling cleanly.
 */
export function joinRoomSync(room, onRoomUpdated) {
  let stopped = false;
  let syncing = false;
  let knownMemberCount = room.members.length;

  const sync = async () => {
    if (stopped || syncing) return;
    syncing = true;

    try {
      const state = await fetchRoom(room.code);
      if (stopped) return;

      room.updateFromServer(state);

      if (room.members.length > knownMemberCount) {
        knownMemberCount = room.members.length;
        onRoomUpdated({ type: 'MEMBER_JOINED', memberCount: knownMemberCount });
      } else {
        knownMemberCount = room.members.length;
        onRoomUpdated({ type: 'ROOM_UPDATED', memberCount: knownMemberCount });
      }

      if (room.matchedRestaurant) {
        onRoomUpdated({ type: 'MATCH_FOUND', restaurant: room.matchedRestaurant });
      }
    } catch (error) {
      if (!stopped) {
        onRoomUpdated({ type: 'SYNC_ERROR', error });
      }
    } finally {
      syncing = false;
    }
  };

  const timerId = setInterval(sync, POLL_INTERVAL_MS);

  return () => {
    stopped = true;
    clearInterval(timerId);
  };
}