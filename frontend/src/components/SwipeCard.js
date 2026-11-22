/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/components/SwipeCard.js
 * Description: Interactive Tinder-style restaurant card supporting pointer/touch
 *              drag-to-swipe gestures, LIKE/NOPE stamps, and pass/like buttons.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-16
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import { escapeHtml, safeUrl } from '../utils/html.js';

const SWIPE_THRESHOLD_PX = 85;

export default class SwipeCard {
  constructor({ restaurant, onSwipe }) {
    this.restaurant = restaurant;
    this.onSwipe = onSwipe;
    this.hasSwiped = false;
  }

  /**
   * Animates the card off-screen to the left or right before notifying the parent.
   */
  triggerSwipe(direction, cardEl) {
    if (this.hasSwiped) return;
    this.hasSwiped = true;

    if (cardEl) {
      const offsetX = direction === 'right' ? 360 : -360;
      const rotation = direction === 'right' ? 18 : -18;
      cardEl.style.transition = 'transform 180ms ease-out, opacity 180ms ease-out';
      cardEl.style.transform = `translateX(${offsetX}px) rotate(${rotation}deg)`;
      cardEl.style.opacity = '0';
    }

    setTimeout(() => {
      if (this.onSwipe) this.onSwipe(direction);
    }, 160);
  }

  render() {
    const card = document.createElement('div');
    card.className =
      'swipe-card-surface relative w-full max-w-sm aspect-[3/4] bg-white rounded-3xl shadow-2xl shadow-orange-500/10 overflow-hidden border border-orange-100 mx-auto animate-fade-in';

    const imageSrc = safeUrl(
      this.restaurant.image,
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
    );

    card.innerHTML = `
      <!-- Restaurant Cover Photo -->
      <div class="absolute inset-0 bg-slate-200">
        <img
          src="${escapeHtml(imageSrc)}"
          alt="${escapeHtml(this.restaurant.name)}"
          class="w-full h-full object-cover pointer-events-none"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/35 to-transparent"></div>
      </div>

      <!-- Drag Direction Stamps (LIKE / NOPE) -->
      <div
        id="stamp-like"
        class="pointer-events-none opacity-0 absolute top-14 left-5 z-20 border-4 border-emerald-400 text-emerald-300 font-black text-2xl px-3 py-1 rounded-xl -rotate-12 tracking-widest uppercase bg-slate-950/40 backdrop-blur-xs transition-opacity"
      >
        LIKE
      </div>
      <div
        id="stamp-nope"
        class="pointer-events-none opacity-0 absolute top-14 right-5 z-20 border-4 border-rose-400 text-rose-300 font-black text-2xl px-3 py-1 rounded-xl rotate-12 tracking-widest uppercase bg-slate-950/40 backdrop-blur-xs transition-opacity"
      >
        NOPE
      </div>

      <!-- Top Cuisine & Availability Badges -->
      <div class="absolute top-4 left-4 right-4 z-10 flex justify-between items-center gap-2">
        <span class="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/15 capitalize">
          ${escapeHtml(this.restaurant.cuisineLabel || this.restaurant.cuisine || 'Restaurant')}
        </span>
        ${
          this.restaurant.availabilityLabel
            ? `<span class="${
                this.restaurant.isOpenNow === true
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-slate-800/80 text-slate-200'
              } text-xs font-extrabold px-3 py-1.5 rounded-full shadow">
                ${escapeHtml(this.restaurant.availabilityLabel)}
              </span>`
            : ''
        }
      </div>

      <!-- Restaurant Details & Action Buttons -->
      <div class="absolute bottom-0 w-full p-6 text-white z-10">
        <h2 class="text-2xl font-black leading-tight drop-shadow-sm mb-1">
          ${escapeHtml(this.restaurant.name)}
        </h2>
        <p class="text-xs text-orange-200 font-semibold mb-1.5">
          ${escapeHtml(this.restaurant.address || 'Address unavailable')}
        </p>
        <p class="text-white/85 text-sm leading-relaxed mb-5 line-clamp-2">
          ${escapeHtml(this.restaurant.description || '')}
        </p>

        <div class="flex justify-center items-center gap-8">
          <button
            type="button"
            id="btn-swipe-left"
            aria-label="Pass"
            class="w-16 h-16 bg-white/95 hover:bg-white rounded-full flex items-center justify-center text-rose-500 shadow-xl text-2xl font-black active:scale-90 transition-all cursor-pointer"
          >
            ✕
          </button>
          <button
            type="button"
            id="btn-swipe-right"
            aria-label="Like"
            class="w-16 h-16 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-500/40 text-2xl active:scale-90 transition-all cursor-pointer"
          >
            ♥
          </button>
        </div>
      </div>
    `;

    const likeStamp = card.querySelector('#stamp-like');
    const nopeStamp = card.querySelector('#stamp-nope');

    // Button handlers
    card.querySelector('#btn-swipe-left').addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerSwipe('left', card);
    });

    card.querySelector('#btn-swipe-right').addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerSwipe('right', card);
    });

    // Pointer drag gesture support for mobile touch & desktop mouse drag
    let startX = 0;
    let currentDeltaX = 0;
    let dragging = false;

    const resetCardPosition = () => {
      card.style.transition = 'transform 200ms ease-out';
      card.style.transform = 'translateX(0px) rotate(0deg)';
      likeStamp.style.opacity = '0';
      nopeStamp.style.opacity = '0';
    };

    card.addEventListener('pointerdown', (e) => {
      // Ignore drag start when clicking action buttons directly
      if (e.target.closest('button') || this.hasSwiped) return;
      dragging = true;
      startX = e.clientX;
      currentDeltaX = 0;
      card.style.transition = 'none';
      card.setPointerCapture(e.pointerId);
    });

    card.addEventListener('pointermove', (e) => {
      if (!dragging || this.hasSwiped) return;
      currentDeltaX = e.clientX - startX;
      const rotateDeg = Math.max(-16, Math.min(16, currentDeltaX * 0.06));
      card.style.transform = `translateX(${currentDeltaX}px) rotate(${rotateDeg}deg)`;

      const progress = Math.min(1, Math.abs(currentDeltaX) / SWIPE_THRESHOLD_PX);
      if (currentDeltaX > 12) {
        likeStamp.style.opacity = String(progress);
        nopeStamp.style.opacity = '0';
      } else if (currentDeltaX < -12) {
        nopeStamp.style.opacity = String(progress);
        likeStamp.style.opacity = '0';
      } else {
        likeStamp.style.opacity = '0';
        nopeStamp.style.opacity = '0';
      }
    });

    const finishDrag = () => {
      if (!dragging) return;
      dragging = false;
      if (this.hasSwiped) return;

      if (currentDeltaX >= SWIPE_THRESHOLD_PX) {
        this.triggerSwipe('right', card);
      } else if (currentDeltaX <= -SWIPE_THRESHOLD_PX) {
        this.triggerSwipe('left', card);
      } else {
        resetCardPosition();
      }
    };

    card.addEventListener('pointerup', finishDrag);
    card.addEventListener('pointercancel', finishDrag);

    return card;
  }
}