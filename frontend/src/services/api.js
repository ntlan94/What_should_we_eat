/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/services/api.js
 * Description: Network client for backend room, swipe, and static map endpoints.
 *              Display formatting lives in utils/formatRestaurant.js.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-16
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import { formatRoomRestaurants } from '../utils/formatRestaurant.js';

const API_BASE_URL = (
  window.WSWE_API_BASE_URL || `http://${window.location.hostname || 'localhost'}:3000/api`
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  let body;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      `Backend returned an unreadable response (${response.status})`,
      response.status
    );
  }

  if (!response.ok) {
    throw new ApiError(
      body.error || `Backend request failed (${response.status})`,
      response.status
    );
  }

  return body;
}

export function getMapImageUrl(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  return `${API_BASE_URL}/map?${params}`;
}

export async function createRoom({ location, radiusKm, openNow = false, matchMode = 'all', member }) {
  const room = await request('/rooms', {
    method: 'POST',
    body: JSON.stringify({ location, radiusKm, openNow, matchMode, member }),
  });
  return formatRoomRestaurants(room);
}

export async function joinRoom(code, member) {
  const room = await request(`/rooms/${encodeURIComponent(code)}/join`, {
    method: 'POST',
    body: JSON.stringify({ member }),
  });
  return formatRoomRestaurants(room);
}

export async function fetchRoom(code) {
  const room = await request(`/rooms/${encodeURIComponent(code)}`);
  return formatRoomRestaurants(room);
}

export async function submitSwipe(code, memberId, restaurantId, direction) {
  const room = await request(`/rooms/${encodeURIComponent(code)}/swipes`, {
    method: 'POST',
    body: JSON.stringify({ memberId, restaurantId, direction }),
  });
  return formatRoomRestaurants(room);
}