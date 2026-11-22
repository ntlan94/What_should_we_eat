/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/routes/geocode.js
 * Description: GET /api/geocode?text=..
 *              Returns { lat, lng, label } for the best matching place.
 * Author: Jovian Niko Soesilo
 * Collaborators: Thanh Lan Ngo
 * Date Created: 2026-11-17
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import { Router } from 'express';
import { geocode } from '../services/geocode.js';

const router = Router();

router.get('/', async (req, res) => {
  const text = String(req.query.text ?? '').trim();
  if (!text) {
    return res.status(400).json({ error: 'text query parameter is required' });
  }

  try {
    const place = await geocode(text);
    if (!place) {
      return res.status(404).json({ error: `No location found for "${text}"` });
    }
    return res.json(place);
  } catch (err) {
    console.error('Geocode route error:', err.message);
    return res.status(502).json({ error: 'Could not look up that location' });
  }
});

export default router;