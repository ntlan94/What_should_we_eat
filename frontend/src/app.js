/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/app.js
 * Description: Top-level frontend application controller managing session IDs,
 *              User/Room models, API calls, and transitions between Home,
 *              SwipeRoom, and Match views.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-16
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import User from './models/User.js';
import Room from './models/Room.js';
import { createRoom, joinRoom } from './services/api.js';

import Home from './pages/Home.js';
import SwipeRoom from './pages/SwipeRoom.js';
import Match from './pages/Match.js';

/**
 * Generates or retrieves a per-tab member ID so each browser tab can act as
 * an independent participant when testing multiplayer locally.
 */
function getMemberId() {
  let memberId = sessionStorage.getItem('wswe-member-id');
  if (!memberId) {
    memberId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('wswe-member-id', memberId);
  }
  return memberId;
}

function roomFromServer(state) {
  const room = new Room(state.code, state.location, state.radiusKm, {
    openNow: state.openNow,
    matchMode: state.matchMode,
  });
  room.updateFromServer(state);
  return room;
}

export class AppController {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.currentUser = null;
    this.activeRoom = null;
    this.matchedRestaurant = null;
    this.activeSwipeRoomPage = null;
  }

  init() {
    this.showHome();
  }

  mount(element) {
    if (this.activeSwipeRoomPage) {
      this.activeSwipeRoomPage.cleanup();
      this.activeSwipeRoomPage = null;
    }
    this.rootElement.innerHTML = '';
    this.rootElement.appendChild(element);
  }

  showHome() {
    this.activeRoom = null;
    this.matchedRestaurant = null;
    const homePage = new Home({
      onCreateRoom: (data) => this.handleCreateRoom(data),
      onJoinRoom: (data) => this.handleJoinRoom(data),
    });
    this.mount(homePage.render());
  }

  async handleCreateRoom({ location, radius, openNow, matchMode, displayName }) {
    this.currentUser = new User(getMemberId(), displayName || 'Host', true);
    const state = await createRoom({
      location,
      radiusKm: radius,
      openNow,
      matchMode,
      member: this.currentUser.toPayload(),
    });
    this.activeRoom = roomFromServer(state);
    this.showSwipeRoom();
  }

  async handleJoinRoom({ roomCode, displayName }) {
    this.currentUser = new User(getMemberId(), displayName || 'Guest', false);
    const state = await joinRoom(roomCode, this.currentUser.toPayload());
    this.activeRoom = roomFromServer(state);
    this.showSwipeRoom();
  }

  showSwipeRoom() {
    const swipeRoomPage = new SwipeRoom({
      room: this.activeRoom,
      currentUser: this.currentUser,
      onMatchFound: (restaurant) => this.showMatch(restaurant),
      onLeave: () => this.showHome(),
    });
    this.activeSwipeRoomPage = swipeRoomPage;
    this.mount(swipeRoomPage.render());
  }

  showMatch(restaurant) {
    this.matchedRestaurant = restaurant;
    const matchPage = new Match({
      restaurant: this.matchedRestaurant,
      roomCode: this.activeRoom.code,
      matchDetails: this.activeRoom?.matchDetails ?? null,
      onRestart: () => this.showHome(),
    });
    this.mount(matchPage.render());
  }
}

// Initialize the application when the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app');
  if (!root) return;
  const app = new AppController(root);
  app.init();
});