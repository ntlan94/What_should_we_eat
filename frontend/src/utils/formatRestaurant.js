/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/utils/formatRestaurant.js
 * Description: Pure UI formatting helpers that attach cuisine stock images,
 *              human-readable distance labels, and open/closed status text to
 *              restaurant objects returned from the backend API.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-21
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

const IMAGE_BY_CUISINE = [
  { match: /pizza|italian/i, photoId: 'photo-1513104890138-7c749659a591' },
  {
    match: /thai|noodle|asian|sushi|ramen|vietnamese|korean|japanese|chinese/i,
    photoId: 'photo-1559314809-0d155014e29e',
  },
  { match: /burger|american|fast.?food|steak/i, photoId: 'photo-1568901346375-23c9450c58cd' },
  { match: /taco|mexican|burrito/i, photoId: 'photo-1565299585323-38d6b0865b47' },
  { match: /cafe|coffee|bakery|dessert/i, photoId: 'photo-1495474472287-4d71bcdd2085' },
];

const DEFAULT_PHOTO_ID = 'photo-1546069901-ba9599a7e63c';

function getCuisineImageUrl(cuisine) {
  const match = IMAGE_BY_CUISINE.find(({ match: pattern }) => pattern.test(cuisine || ''));
  const photoId = match?.photoId || DEFAULT_PHOTO_ID;
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=80`;
}

function formatDistance(distanceMetres) {
  if (!Number.isFinite(distanceMetres)) return '';
  if (distanceMetres < 1000) {
    return `${Math.round(distanceMetres)} m away`;
  }
  return `${(distanceMetres / 1000).toFixed(1)} km away`;
}

function formatAvailability(isOpenNow) {
  if (isOpenNow === true) return 'Open now';
  if (isOpenNow === false) return 'Closed';
  return '';
}

/**
 * Decorates a single Restaurant object with display-ready fields.
 */
export function formatRestaurant(restaurant) {
  const cuisineLabel = (restaurant.cuisine || 'restaurant').replace(/[_;]/g, ' ').trim();
  const distanceLabel = formatDistance(restaurant.distance);
  const availabilityLabel = formatAvailability(restaurant.isOpenNow);

  return {
    ...restaurant,
    cuisineLabel,
    distanceLabel,
    availabilityLabel,
    image: getCuisineImageUrl(cuisineLabel),
    description: [cuisineLabel, distanceLabel, availabilityLabel].filter(Boolean).join(' • '),
  };
}

/**
 * Decorates all restaurants and any matchedRestaurant inside a room payload.
 */
export function formatRoomRestaurants(room) {
  const restaurants = (room.restaurants ?? []).map(formatRestaurant);
  return {
    ...room,
    restaurants,
    matchedRestaurant: room.matchedRestaurant ? formatRestaurant(room.matchedRestaurant) : null,
  };
}