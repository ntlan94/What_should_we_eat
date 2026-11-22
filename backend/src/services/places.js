/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/services/places.js
 * Description: Fetches nearby restaurants, fast food, and cafes from Geoapify
 *              Places API and normalizes them into Restaurant instances.
 * Author: Jovian Niko Soesilo
 * Collaborators: Thanh Lan Ngo
 * Date Created: 2026-11-17
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import Restaurant from '../models/Restaurant.js';

// Broad catering categories for variety across sit-down, casual, and cafe spots.
const CATEGORIES = 'catering.restaurant,catering.fast_food,catering.cafe';

export async function getNearbyRestaurants({ lat, lng, radius = 2000, limit = 20 }) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error('GEOAPIFY_API_KEY is missing from backend/.env');

  const params = new URLSearchParams({
    categories: CATEGORIES,
    filter: `circle:${lng},${lat},${radius}`, // Geoapify expects longitude,latitude order
    bias: `proximity:${lng},${lat}`,          // Prioritize closer spots first
    limit: String(limit),
    apiKey,
  });

  const response = await fetch(`https://api.geoapify.com/v2/places?${params}`);
  if (!response.ok) {
    throw new Error(`Geoapify places lookup failed with status ${response.status}`);
  }

  const data = await response.json();
  return (data.features ?? [])
    .map((feature) => Restaurant.fromGeoapify(feature))
    .filter((restaurant) => restaurant.id && restaurant.name);
}