/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/routes/restaurants.js
 * Description: GET /api/restaurants?lat=..&lng=..&radius=..&openNow=true
 *              Returns nearby restaurants in normalized Restaurant format.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-17
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import { Router } from 'express';
import { getNearbyRestaurants } from '../services/places.js';

const router = Router();

router.get('/', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const openNowOnly = req.query.openNow === 'true';

  const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const validLng = Number.isFinite(lng) && lng >= -180 && lng <= 180;
  if (!validLat || !validLng) {
    return res.status(400).json({ error: 'valid lat and lng query parameters are required' });
  }

  // Default to 2000m when radius is omitted; otherwise validate range (100m - 20000m).
  const rawRadius = req.query.radius === undefined || req.query.radius === '' ? 2000 : Number(req.query.radius);
  if (!Number.isFinite(rawRadius) || rawRadius < 100 || rawRadius > 20000) {
    return res.status(400).json({ error: 'radius must be a number between 100 and 20000 metres' });
  }

  try {
    let restaurants = await getNearbyRestaurants({ lat, lng, radius: Math.round(rawRadius) });
    if (openNowOnly) {
      // Hide venues known to be closed while keeping venues whose hours are unknown.
      restaurants = restaurants.filter((r) => r.isOpenNow !== false);
    }
    return res.json(restaurants);
  } catch (err) {
    console.error('Restaurants route error:', err.message);
    return res.status(502).json({ error: 'Could not fetch restaurants' });
  }
});

export default router;