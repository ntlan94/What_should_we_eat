/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/routes/map.js
 * Description: GET /api/map?lat=..&lng=..
 *              Returns a JPEG map image with a location pin for <img src>.
 * Author: Jovian Niko Soesilo
 * Collaborators: Thanh Lan Ngo
 * Date Created: 2026-11-21
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import { Router } from 'express';
import { getStaticMap } from '../services/staticMap.js';

const router = Router();

router.get('/', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const validLng = Number.isFinite(lng) && lng >= -180 && lng <= 180;
  if (!validLat || !validLng) {
    return res.status(400).json({ error: 'valid lat and lng query parameters are required' });
  }

  try {
    const image = await getStaticMap(lat, lng);
    res.set('Cache-Control', 'public, max-age=86400');
    return res.type('jpeg').send(image);
  } catch (err) {
    console.error('Map route error:', err.message);
    return res.status(502).json({ error: 'Could not load map image' });
  }
});

export default router;