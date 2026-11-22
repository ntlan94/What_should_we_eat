/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/pages/Home.js
 * Description: Home/Lobby screen allowing users to create a room (with display
 *              name, location, radius, open-now filter, and match mode:
 *              unanimous, majority, or solo) or join an existing room by code.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-16
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import Button from '../components/Button.js';
import { escapeHtml } from '../utils/html.js';

export default class Home {
  constructor({ onCreateRoom, onJoinRoom }) {
    this.onCreateRoom = onCreateRoom;
    this.onJoinRoom = onJoinRoom;

    // Local UI State
    this.activeTab = 'create'; // 'create' | 'join'
    this.displayName = '';
    this.location = '';
    this.radius = 3;
    this.openNow = false;
    this.matchMode = 'all'; // 'all' | 'majority' | 'solo'
    this.roomCode = '';
    this.radiusOptions = [1, 3, 5, 10];

    this.container = document.createElement('div');
    this.container.className =
      'w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-orange-500/10 overflow-hidden border border-orange-100 animate-fade-in';
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.updateView();
  }

  /**
   * Updates radius state and syncs pill buttons, slider, and badge in-place
   * so error alerts and input focus are preserved.
   */
  applyRadius(km, formEl) {
    const clamped = Math.max(1, Math.min(15, Number(km) || 3));
    this.radius = clamped;

    if (!formEl) return;
    const badge = formEl.querySelector('#radius-badge');
    const slider = formEl.querySelector('#radius-slider');
    if (badge) badge.textContent = `${this.radius} km`;
    if (slider) slider.value = String(this.radius);

    formEl.querySelectorAll('.radius-pill').forEach((pill) => {
      const pillKm = Number(pill.getAttribute('data-km'));
      const isSelected = pillKm === this.radius;
      pill.className = `radius-pill py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
        isSelected
          ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
      }`;
    });
  }

  updateView() {
    this.container.innerHTML = `
      <!-- App Header Banner -->
      <div class="bg-gradient-to-r from-orange-500 to-rose-500 px-6 pt-8 pb-6 text-white text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl mb-3 shadow-inner text-3xl">
          🍕
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight">What Should We Eat?</h1>
        <p class="text-orange-100 text-sm mt-1 font-medium">
          Swipe together. Eat together. No more &ldquo;I don&rsquo;t mind.&rdquo;
        </p>
      </div>

      <!-- Main Body -->
      <div class="p-6">
        <!-- Segmented Tab Switcher -->
        <div class="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
          <button
            type="button"
            id="tab-create"
            class="py-2.5 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
              this.activeTab === 'create'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }"
          >
            Create a Room
          </button>
          <button
            type="button"
            id="tab-join"
            class="py-2.5 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
              this.activeTab === 'join'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }"
          >
            Join a Room
          </button>
        </div>

        <!-- Dynamic Form Container -->
        <div id="form-mount"></div>
      </div>
    `;

    this.container
      .querySelector('#tab-create')
      .addEventListener('click', () => this.switchTab('create'));
    this.container
      .querySelector('#tab-join')
      .addEventListener('click', () => this.switchTab('join'));

    const formMount = this.container.querySelector('#form-mount');
    if (this.activeTab === 'create') {
      formMount.appendChild(this.buildCreateForm());
    } else {
      formMount.appendChild(this.buildJoinForm());
    }
  }

  buildCreateForm() {
    const form = document.createElement('form');
    form.className = 'space-y-5';

    const pillsHtml = this.radiusOptions
      .map(
        (km) => `
        <button
          type="button"
          data-km="${km}"
          class="radius-pill py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
            this.radius === km
              ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }"
        >
          ${km} km
        </button>
      `
      )
      .join('');

    form.innerHTML = `
      <div>
        <label for="host-name-input" class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Your Name (Optional)
        </label>
        <input
          id="host-name-input"
          type="text"
          value="${escapeHtml(this.displayName)}"
          placeholder="Host"
          maxlength="60"
          class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label for="location-input" class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Where are we eating?
        </label>
        <input
          id="location-input"
          type="text"
          value="${escapeHtml(this.location)}"
          placeholder="Enter suburb, zip, or neighborhood..."
          class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          required
        />
        <p class="text-xs text-slate-400 mt-1.5">
          Restaurants will be searched near this location.
        </p>
      </div>

      <div>
        <div class="flex justify-between items-center mb-2">
          <label for="radius-slider" class="text-xs font-bold uppercase tracking-wider text-slate-500">
            Search Radius
          </label>
          <span id="radius-badge" class="text-sm font-extrabold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg">
            ${this.radius} km
          </span>
        </div>

        <div class="grid grid-cols-4 gap-2 mb-3">
          ${pillsHtml}
        </div>

        <input
          id="radius-slider"
          type="range"
          min="1"
          max="15"
          step="1"
          value="${this.radius}"
          class="w-full cursor-pointer"
        />
        <div class="flex justify-between text-[11px] text-slate-400 font-medium">
          <span>Walking (1 km)</span>
          <span>Short drive (15 km)</span>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 pt-1">
        <div>
          <label for="match-mode-select" class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Match Rule
          </label>
          <select
            id="match-mode-select"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="all" ${this.matchMode === 'all' ? 'selected' : ''}>Everyone must swipe right (Unanimous)</option>
            <option value="majority" ${this.matchMode === 'majority' ? 'selected' : ''}>Majority vote (&gt;50% swipe right)</option>
            <option value="solo" ${this.matchMode === 'solo' ? 'selected' : ''}>Solo / 1-person mode (Instant match on right swipe)</option>
          </select>
        </div>

        <label class="flex items-center justify-between bg-orange-50/70 border border-orange-100 px-4 py-3 rounded-xl cursor-pointer">
          <div>
            <span class="text-sm font-bold text-slate-800 block">Open now only</span>
            <span class="text-xs text-slate-500">Hide places known to be closed</span>
          </div>
          <input
            id="open-now-checkbox"
            type="checkbox"
            ${this.openNow ? 'checked' : ''}
            class="w-4 h-4 accent-orange-500 cursor-pointer"
          />
        </label>
      </div>

      <p id="form-error" class="hidden text-sm font-semibold text-rose-600" role="alert"></p>
      <div id="create-btn-slot"></div>
    `;

    const submitButton = new Button({
      text: 'Create Room',
      type: 'submit',
      variant: 'primary',
      disabled: !this.location.trim(),
    });
    form.querySelector('#create-btn-slot').appendChild(submitButton.render());

    form.querySelector('#host-name-input').addEventListener('input', (e) => {
      this.displayName = e.target.value;
    });

    const locationInput = form.querySelector('#location-input');
    locationInput.addEventListener('input', (e) => {
      this.location = e.target.value;
      submitButton.setDisabled(!this.location.trim());
    });

    form.querySelectorAll('.radius-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        this.applyRadius(Number(pill.getAttribute('data-km')), form);
      });
    });

    const slider = form.querySelector('#radius-slider');
    slider.addEventListener('input', (e) => {
      this.applyRadius(Number(e.target.value), form);
    });

    form.querySelector('#match-mode-select').addEventListener('change', (e) => {
      this.matchMode = e.target.value;
    });

    form.querySelector('#open-now-checkbox').addEventListener('change', (e) => {
      this.openNow = e.target.checked;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.location.trim()) return;

      const errorMessage = form.querySelector('#form-error');
      errorMessage.classList.add('hidden');
      submitButton.setDisabled(true);
      submitButton.setText('Finding Restaurants...');

      try {
        await this.onCreateRoom({
          location: this.location.trim(),
          radius: this.radius,
          openNow: this.openNow,
          matchMode: this.matchMode,
          displayName: this.displayName.trim() || 'Host',
        });
      } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
        submitButton.setText('Create Room');
        submitButton.setDisabled(!this.location.trim());
      }
    });

    return form;
  }

  buildJoinForm() {
    const form = document.createElement('form');
    form.className = 'space-y-5';

    form.innerHTML = `
      <div>
        <label for="guest-name-input" class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Your Name (Optional)
        </label>
        <input
          id="guest-name-input"
          type="text"
          value="${escapeHtml(this.displayName)}"
          placeholder="Guest"
          maxlength="60"
          class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
        />
      </div>

      <div class="text-center">
        <label for="room-code-input" class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Enter 4-Digit Room Code
        </label>
        <input
          id="room-code-input"
          type="text"
          value="${escapeHtml(this.roomCode)}"
          placeholder="ABCD"
          maxlength="4"
          class="w-full py-5 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center text-3xl font-black tracking-[0.45em] uppercase text-slate-800 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all"
          required
        />
        <p class="text-xs text-slate-400 mt-2.5">
          Ask your host for the 4-character lobby code
        </p>
      </div>

      <p id="form-error" class="hidden text-sm font-semibold text-rose-600" role="alert"></p>
      <div id="join-btn-slot"></div>
    `;

    const joinButton = new Button({
      text: 'Join Room',
      type: 'submit',
      variant: 'secondary',
      disabled: this.roomCode.length < 4,
    });
    form.querySelector('#join-btn-slot').appendChild(joinButton.render());

    form.querySelector('#guest-name-input').addEventListener('input', (e) => {
      this.displayName = e.target.value;
    });

    const codeInput = form.querySelector('#room-code-input');
    codeInput.addEventListener('input', (e) => {
      const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      this.roomCode = cleaned.slice(0, 4);
      e.target.value = this.roomCode;
      joinButton.setDisabled(this.roomCode.length < 4);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.roomCode.length < 4) return;

      const errorMessage = form.querySelector('#form-error');
      errorMessage.classList.add('hidden');
      joinButton.setDisabled(true);
      joinButton.setText('Joining Room...');

      try {
        await this.onJoinRoom({
          roomCode: this.roomCode,
          displayName: this.displayName.trim() || 'Guest',
        });
      } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
        joinButton.setText('Join Room');
        joinButton.setDisabled(this.roomCode.length < 4);
      }
    });

    return form;
  }

  render() {
    this.updateView();
    return this.container;
  }
}