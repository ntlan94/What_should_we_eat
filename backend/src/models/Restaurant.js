/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/src/models/Restaurant.js
 * Description: Standard restaurant format sent to the frontend swipe cards.
 *              Geoapify has no photos or ratings, so the frontend picks a stock
 *              image from cuisine metadata and fetches a static map via /api/map.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-17
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import OpeningHours from 'opening_hours';

export default class Restaurant {
  constructor({ id, name, cuisine, distance, address, openingHours, isOpenNow, lat, lng }) {
    this.id = id;
    this.name = name;
    this.cuisine = cuisine;           // e.g. "pizza", "sushi", "fast_food", "cafe"
    this.distance = distance;         // Distance in metres from search centre, or null
    this.address = address;           // Street/formatted address string, or null
    this.openingHours = openingHours; // Raw OpenStreetMap opening_hours string, or null
    this.isOpenNow = isOpenNow;       // true, false, or null if hours cannot be determined
    this.lat = lat;                   // Latitude coordinate
    this.lng = lng;                   // Longitude coordinate
  }

  /**
   * Converts a Geoapify Places GeoJSON feature into a normalized Restaurant object.
   */
  static fromGeoapify(feature) {
    const p = feature?.properties ?? {};
    return new Restaurant({
      id: p.place_id,
      name: p.name,
      cuisine: Restaurant.#cuisineFrom(p),
      distance: p.distance ?? null,
      address: p.address_line2 ?? p.formatted ?? null,
      openingHours: p.opening_hours ?? null,
      isOpenNow: Restaurant.#checkOpenNow(p.opening_hours),
      lat: p.lat ?? null,
      lng: p.lon ?? null,
    });
  }

  /**
   * Extracts a clean cuisine label by preferring the OSM cuisine tag and falling
   * back to Geoapify's catering categories.
   */
  static #cuisineFrom(p) {
    const tag = p.catering?.cuisine;
    if (tag) return String(tag).split(';')[0].trim();

    const categories = p.categories ?? [];
    const specific = categories.find((c) => c.startsWith('catering.restaurant.'));
    if (specific) return specific.split('.').pop();
    if (categories.includes('catering.fast_food')) return 'fast_food';
    if (categories.includes('catering.cafe')) return 'cafe';
    return 'restaurant';
  }

  /**
   * Evaluates OpenStreetMap opening hours against the current server clock.
   * Returns null when hours are absent, ambiguous ("unknown"), or malformed.
   */
  static #checkOpenNow(hoursText) {
    if (!hoursText) return null;
    try {
      const hours = new OpeningHours(hoursText, null, { mode: 0 });
      return hours.getUnknown() ? null : hours.getState();
    } catch {
      return null; // Gracefully ignore unparseable OSM opening_hours syntax
    }
  }
}