/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/services/geocode.js
 * Description: Turns a typed place name (e.g. "Camden" or "Yarraville") into
 *              latitude/longitude coordinates via the Geoapify Geocoding API.
 * Author: Jovian Niko Soesilo
 * Collaborators: Thanh Lan Ngo
 * Date Created: 2026-11-17
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

export async function geocode(text) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error('GEOAPIFY_API_KEY is missing from backend/.env');

  const params = new URLSearchParams({
    text,
    limit: '1',
    format: 'json',
    apiKey,
  });

  const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`);
  if (!response.ok) {
    // Avoid logging the full URL containing the secret apiKey query parameter.
    throw new Error(`Geoapify geocoding failed with status ${response.status}`);
  }

  const data = await response.json();
  const best = data.results?.[0];
  if (!best) return null;

  return {
    lat: best.lat,
    lng: best.lon,
    label: best.formatted,
  };
}