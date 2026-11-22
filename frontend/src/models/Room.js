/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/models/Room.js
 * Description: OOP model managing room code, location, search radius, filters,
 *              match mode ('all' | 'majority' | 'solo'), members, deck, and
 *              matched restaurant state.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-16
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

export default class Room {
  constructor(code, location = 'Nearby', radius = 3, options = {}) {
    this.code = code;
    this.location = location;
    this.radius = radius;
    this.openNow = Boolean(options.openNow);
    this.matchMode = options.matchMode || 'all'; // 'all' | 'majority' | 'solo'
    this.members = [];
    this.deck = [];
    this.votes = {}; // Maps restaurantId -> count of 'right' swipes
    this.status = 'lobby'; // 'lobby' | 'swiping' | 'matched'
    this.matchedRestaurant = null;
    this.matchDetails = null;
  }

  /**
   * Adds a member to the room if they aren't already present.
   */
  addMember(user) {
    const exists = this.members.some((member) => member.id === user.id);
    if (!exists) {
      this.members.push(user);
    }
  }

  /**
   * Sets the restaurant deck and marks the room as actively swiping.
   */
  setDeck(restaurants) {
    this.deck = Array.isArray(restaurants) ? restaurants : [];
    this.status = 'swiping';
  }

  /**
   * Synchronizes local Room state with the authoritative snapshot from the backend.
   */
  updateFromServer(state) {
    this.location = state.location ?? this.location;
    this.radius = state.radiusKm ?? this.radius;
    this.openNow = Boolean(state.openNow);
    this.matchMode = state.matchMode || this.matchMode;
    this.members = Array.isArray(state.members) ? state.members : [];
    this.deck = Array.isArray(state.restaurants) ? state.restaurants : [];
    this.votes = state.votes && typeof state.votes === 'object' ? state.votes : {};
    this.status = state.status || 'swiping';
    this.matchedRestaurant = state.matchedRestaurant ?? null;
    this.matchDetails = state.matchDetails ?? null;
  }

  /**
   * Local optimistic match evaluation helper (authoritative check happens on backend).
   */
  recordVote(restaurantId, direction) {
    if (direction === 'right') {
      this.votes[restaurantId] = (this.votes[restaurantId] || 0) + 1;
    }
    return this.checkForMatch(restaurantId);
  }

  checkForMatch(restaurantId) {
    const rightVotes = this.votes[restaurantId] || 0;
    const memberCount = this.members.length;
    if (memberCount < 1) return null;

    let met = false;
    if (this.matchMode === 'solo') met = rightVotes >= 1;
    else if (this.matchMode === 'majority') met = rightVotes > memberCount / 2;
    else met = memberCount > 1 && rightVotes >= memberCount;

    if (met) {
      this.status = 'matched';
      this.matchedRestaurant = this.deck.find((r) => r.id === restaurantId) || null;
      return this.matchedRestaurant;
    }
    return null;
  }
}