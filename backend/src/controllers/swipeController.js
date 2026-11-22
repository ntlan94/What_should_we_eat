/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/controllers/swipeController.js
 * Description: Handles swipe submissions (left/right) for a room and maps
 *              store outcomes to HTTP responses.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-17
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import { recordSwipe } from '../services/roomStore.js';

export function swipeHandler(req, res) {
  const { memberId, restaurantId, direction } = req.body ?? {};

  if (
    typeof memberId !== 'string' ||
    !memberId.trim() ||
    typeof restaurantId !== 'string' ||
    !restaurantId.trim()
  ) {
    return res.status(400).json({ error: 'memberId and restaurantId are required' });
  }

  if (direction !== 'left' && direction !== 'right') {
    return res.status(400).json({ error: 'direction must be left or right' });
  }

  const roomCode = String(req.params.code ?? '').toUpperCase();
  const result = recordSwipe(roomCode, memberId.trim(), restaurantId.trim(), direction);

  if (result.error === 'not_found') {
    return res.status(404).json({ error: 'Room not found' });
  }
  if (result.error === 'not_a_member') {
    return res.status(403).json({ error: 'Join this room before swiping' });
  }
  if (result.error === 'restaurant_not_found') {
    return res.status(404).json({ error: 'Restaurant not found in this room' });
  }
  if (result.error === 'matched') {
    return res.status(409).json({ error: 'This room already has a match' });
  }

  return res.json(result.room);
}