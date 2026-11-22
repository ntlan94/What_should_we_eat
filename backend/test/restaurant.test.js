/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/test/restaurant.test.js
 * Description: Tests how Geoapify places are turned into Restaurant objects.
 * Author: Jovian Niko Soesilo
 * Collaborators: Thanh Lan Ngo
 * Date Created: 2026-11-22
 * Last Modified: 2026-11-22
 * Modified by: Jovian Niko Soesilo
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import Restaurant from '../src/models/Restaurant.js';

// Helper: a fake Geoapify place with only the fields we care about.
function place(properties) {
  return Restaurant.fromGeoapify({ properties: { place_id: 'id', name: 'Test', ...properties } });
}

test('isOpenNow is true for a place open 24/7', () => {
  assert.equal(place({ opening_hours: '24/7' }).isOpenNow, true);
});

test('isOpenNow is false for a place that is always closed', () => {
  assert.equal(place({ opening_hours: 'off' }).isOpenNow, false);
});

test('isOpenNow is null when hours are missing or badly written', () => {
  assert.equal(place({}).isOpenNow, null);
  assert.equal(place({ opening_hours: 'not real hours' }).isOpenNow, null);
});

test('cuisine uses the first OSM cuisine tag', () => {
  assert.equal(place({ catering: { cuisine: 'pizza;italian' } }).cuisine, 'pizza');
});

test('cuisine falls back to the category name', () => {
  assert.equal(place({ categories: ['catering.restaurant.sushi'] }).cuisine, 'sushi');
  assert.equal(place({ categories: ['catering.fast_food'] }).cuisine, 'fast_food');
  assert.equal(place({ categories: ['catering.cafe'] }).cuisine, 'cafe');
  assert.equal(place({}).cuisine, 'restaurant');
});

test('Geoapify "lon" becomes "lng"', () => {
  assert.equal(place({ lat: 51.5, lon: -0.12 }).lng, -0.12);
});
