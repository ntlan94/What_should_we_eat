/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/models/User.js
 * Description: OOP model representing a participant (host or guest), their display
 *              name, and their local swipe history.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-16
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

export default class User {
  constructor(id, name = 'Guest', isHost = false) {
    this.id = id;
    this.name = name;
    this.isHost = Boolean(isHost);
    this.swipes = {}; // Maps restaurantId -> 'left' | 'right'
  }

  /**
   * Records a swipe direction ('left' or 'right') for a restaurant ID.
   */
  recordSwipe(restaurantId, direction) {
    if (direction !== 'left' && direction !== 'right') return;
    this.swipes[restaurantId] = direction;
  }

  /**
   * Returns true if the user swiped right on the specified restaurant.
   */
  hasLiked(restaurantId) {
    return this.swipes[restaurantId] === 'right';
  }

  /**
   * Serializes the payload expected by backend room creation/join endpoints.
   */
  toPayload() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}