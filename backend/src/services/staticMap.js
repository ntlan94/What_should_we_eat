/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/services/staticMap.js
 * Description: Fetches a map image with a location pin from Geoapify Static
 *              Maps API and caches images in memory to save free daily quota.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-21
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

const WIDTH = 600;
const HEIGHT = 400;
const ZOOM = 16;
const PIN_COLOR = '#f97316';
const MAX_CACHED_IMAGES = 300;

const cache = new Map(); // "lat,lng" -> JPEG Buffer

export async function getStaticMap(lat, lng) {
  // Round to 5 decimals (~1.1 m) so nearby requests share cached map tiles.
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (cache.has(key)) return cache.get(key);

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error('GEOAPIFY_API_KEY is missing from backend/.env');

  const params = new URLSearchParams({
    style: 'osm-bright',
    width: String(WIDTH),
    height: String(HEIGHT),
    center: `lonlat:${lng},${lat}`,
    zoom: String(ZOOM),
    marker: `lonlat:${lng},${lat};type:material;color:${PIN_COLOR};size:48`,
    format: 'jpeg',
    apiKey,
  });

  const response = await fetch(`https://maps.geoapify.com/v1/staticmap?${params}`);
  if (!response.ok) {
    throw new Error(`Geoapify static map failed with status ${response.status}`);
  }

  const image = Buffer.from(await response.arrayBuffer());

  // Evict oldest entry when cache reaches capacity.
  if (cache.size >= MAX_CACHED_IMAGES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, image);
  return image;
}