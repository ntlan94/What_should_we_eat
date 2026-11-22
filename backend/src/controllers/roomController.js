/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/controllers/roomController.js
 * Description: Handles room creation, room lookup, and member join requests.
 * Author: Jovian Niko Soesilo
 * Collaborators: Thanh Lan Ngo
 * Date Created: 2026-11-17
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import { createRoom, getRoom, joinRoom, VALID_MATCH_MODES } from '../services/roomStore.js';
import { geocode } from '../services/geocode.js';
import { getNearbyRestaurants } from '../services/places.js';

const isValidMember = (member) =>
  Boolean(member) &&
  typeof member.id === 'string' &&
  member.id.trim().length > 0 &&
  member.id.trim().length <= 128 &&
  (member.name === undefined || (typeof member.name === 'string' && member.name.length <= 60));

const cleanName = (rawName, fallback) => {
  if (typeof rawName !== 'string') return fallback;
  const trimmed = rawName.trim();
  return trimmed ? trimmed.slice(0, 60) : fallback;
};

export async function createRoomHandler(req, res) {
  const { location, radiusKm, openNow = false, matchMode = 'all', member } = req.body ?? {};

  if (typeof location !== 'string' || !location.trim()) {
    return res.status(400).json({ error: 'location is required' });
  }
  if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 15) {
    return res.status(400).json({ error: 'radiusKm must be between 1 and 15' });
  }
  if (!isValidMember(member)) {
    return res.status(400).json({ error: 'A valid member id is required' });
  }
  if (matchMode !== undefined && !VALID_MATCH_MODES.has(matchMode)) {
    return res.status(400).json({ error: 'matchMode must be all, majority, or solo' });
  }

  try {
    const place = await geocode(location.trim());
    if (!place) {
      return res.status(404).json({ error: 'No location found' });
    }

    let restaurants = await getNearbyRestaurants({
      lat: place.lat,
      lng: place.lng,
      radius: Math.round(radiusKm * 1000),
    });

    if (openNow === true) {
      restaurants = restaurants.filter((restaurant) => restaurant.isOpenNow !== false);
    }

    const room = createRoom({
      location: place.label,
      radiusKm,
      openNow: openNow === true,
      matchMode,
      restaurants,
      host: {
        id: member.id.trim(),
        name: cleanName(member.name, 'Host'),
      },
    });

    return res.status(201).json(room);
  } catch (error) {
    console.error('Room creation failed:', error.message);
    return res.status(502).json({ error: 'Could not find restaurants for that location' });
  }
}

export function getRoomHandler(req, res) {
  const code = String(req.params.code ?? '').toUpperCase();
  const room = getRoom(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json(room);
}

export function joinRoomHandler(req, res) {
  const { member } = req.body ?? {};
  if (!isValidMember(member)) {
    return res.status(400).json({ error: 'A valid member id is required' });
  }

  const code = String(req.params.code ?? '').toUpperCase();
  const result = joinRoom(code, {
    id: member.id.trim(),
    name: cleanName(member.name, 'Guest'),
  });

  if (result.error === 'not_found') {
    return res.status(404).json({ error: 'Room not found' });
  }
  if (result.error === 'matched') {
    return res.status(409).json({ error: 'This room already has a match' });
  }

  return res.json(result.room);
}