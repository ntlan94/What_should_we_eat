/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/pages/SwipeRoom.js
 * Description: Active swipe screen handling live room syncing, ties/no-match
 *              outcomes at deck completion, HTTP 409 race recovery, and
 *              keyboard/touch/button swipes.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-16
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import Navbar from '../components/Navbar.js';
import SwipeCard from '../components/SwipeCard.js';
import Button from '../components/Button.js';
import { joinRoomSync } from '../services/sync.js';
import { fetchRoom, submitSwipe } from '../services/api.js';
import { escapeHtml } from '../utils/html.js';

export default class SwipeRoom {
  constructor({ room, currentUser, onMatchFound, onLeave }) {
    this.room = room;
    this.currentUser = currentUser;
    this.onMatchFound = onMatchFound;
    this.onLeave = onLeave;

    this.currentIndex = 0;
    this.unsubscribeSync = null;
    this.isSubmitting = false;
    this.bannerTimeout = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'w-full max-w-md mx-auto flex flex-col justify-between min-h-[90vh]';
  }

  /**
   * Summarizes the current voting state when all cards in the deck have been
   * viewed without reaching the room's match threshold (covers ties & no likes).
   */
  describeEndOfDeckOutcome() {
    const votesObj = this.room.votes ?? {};
    const voteValues = Object.values(votesObj);
    const totalRightVotes = voteValues.reduce((sum, count) => sum + (Number(count) || 0), 0);
    const maxVotes = voteValues.length > 0 ? Math.max(...voteValues) : 0;

    if (totalRightVotes === 0) {
      return {
        badge: 'No Likes Yet',
        message:
          'Nobody swiped right on any spot in this deck. Swipe through again or pick a new location.',
      };
    }

    const topSpots = Object.values(votesObj).filter((count) => count === maxVotes).length;
    if (topSpots > 1 || (this.room.matchMode === 'all' && this.room.members.length > 1)) {
      return {
        badge: 'Tie / Split Votes',
        message: `Votes were split (top count: ${maxVotes} right ${
          maxVotes === 1 ? 'vote' : 'votes'
        }) without meeting the ${this.room.matchMode} rule. Retry the deck or change location.`,
      };
    }

    return {
      badge: 'No Match Yet',
      message:
        'No restaurant met the match rule yet. You can swipe through the deck again or pick a new location.',
    };
  }

  showBanner(message, variant = 'info', durationMs = 3000) {
    const toastBanner = this.wrapper.querySelector('#sync-toast');
    if (!toastBanner) return;

    if (this.bannerTimeout) {
      clearTimeout(this.bannerTimeout);
      this.bannerTimeout = null;
    }

    toastBanner.textContent = message;
    toastBanner.className = `w-full max-w-sm mx-auto mb-3 py-2 px-4 text-white text-xs font-bold rounded-full text-center shadow-md animate-fade-in ${
      variant === 'error' ? 'bg-rose-600' : 'bg-emerald-500'
    }`;
    toastBanner.classList.remove('hidden');

    if (durationMs > 0) {
      this.bannerTimeout = setTimeout(() => {
        toastBanner.classList.add('hidden');
      }, durationMs);
    }
  }

  renderMemberStrip() {
    const strip = this.wrapper.querySelector('#member-strip');
    if (!strip) return;

    const modeLabels = {
      all: 'Unanimous',
      majority: 'Majority',
      solo: 'Solo Mode',
    };
    const modeText = modeLabels[this.room.matchMode] || 'Unanimous';

    const chips = (this.room.members ?? [])
      .map(
        (m) => `
        <span class="inline-flex items-center gap-1 bg-white/90 border border-orange-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-2xs">
          ${m.isHost ? '👑' : '🍽️'} ${escapeHtml(m.name)}
        </span>
      `
      )
      .join('');

    strip.innerHTML = `
      <div class="flex flex-wrap items-center justify-center gap-1.5 mb-2">
        ${chips}
        <span class="inline-flex items-center bg-orange-500/10 text-orange-700 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
          Rule: ${escapeHtml(modeText)}
        </span>
      </div>
    `;
  }

  async handleSwipe(direction) {
    const currentRestaurant = this.room.deck[this.currentIndex];
    if (!currentRestaurant || this.isSubmitting) return;

    this.isSubmitting = true;
    this.currentUser.recordSwipe(currentRestaurant.id, direction);

    try {
      const state = await submitSwipe(
        this.room.code,
        this.currentUser.id,
        currentRestaurant.id,
        direction
      );
      this.room.updateFromServer(state);
      this.renderMemberStrip();

      if (this.room.matchedRestaurant) {
        this.cleanup();
        this.onMatchFound(this.room.matchedRestaurant);
        return;
      }

      this.currentIndex += 1;
      this.renderDeckArea();
    } catch (error) {
      const isConflictMatch =
        error?.status === 409 || /already has a match/i.test(error?.message || '');

      if (isConflictMatch) {
        try {
          const latestState = await fetchRoom(this.room.code);
          this.room.updateFromServer(latestState);
          if (this.room.matchedRestaurant) {
            this.cleanup();
            this.onMatchFound(this.room.matchedRestaurant);
            return;
          }
        } catch {
          // Fall through to error banner
        }
      }

      this.showBanner(error.message || 'Could not record swipe', 'error', 4000);
    } finally {
      this.isSubmitting = false;
    }
  }

  handleKeyDown(event) {
    if (this.currentIndex >= this.room.deck.length || this.isSubmitting) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.handleSwipe('left');
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.handleSwipe('right');
    }
  }

  cleanup() {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.bannerTimeout) {
      clearTimeout(this.bannerTimeout);
      this.bannerTimeout = null;
    }
    if (this.unsubscribeSync) {
      this.unsubscribeSync();
      this.unsubscribeSync = null;
    }
  }

  renderDeckArea() {
    const stage = this.wrapper.querySelector('#swipe-stage');
    stage.innerHTML = '';

    if (this.currentIndex < this.room.deck.length) {
      const currentRestaurant = this.room.deck[this.currentIndex];

      const metaBar = document.createElement('div');
      metaBar.className = 'flex justify-between items-center w-full max-w-sm mx-auto mb-3 px-1 gap-2';
      metaBar.innerHTML = `
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400 truncate">
          Near ${escapeHtml(this.room.location)} (${escapeHtml(this.room.radius)} km)
        </span>
        <span class="shrink-0 text-xs font-extrabold text-orange-600 bg-orange-100/80 px-2.5 py-1 rounded-full">
          ${this.currentIndex + 1} / ${this.room.deck.length}
        </span>
      `;
      stage.appendChild(metaBar);

      const card = new SwipeCard({
        restaurant: currentRestaurant,
        onSwipe: (dir) => this.handleSwipe(dir),
      });
      stage.appendChild(card.render());
    } else {
      const outcome = this.describeEndOfDeckOutcome();
      const emptyBox = document.createElement('div');
      emptyBox.className =
        'w-full max-w-sm mx-auto bg-white p-8 rounded-3xl shadow-xl text-center border border-orange-100 animate-fade-in';
      emptyBox.innerHTML = `
        <div class="text-5xl mb-3" role="img" aria-label="hourglass">⏳</div>
        <span class="inline-block text-[11px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full mb-2">
          ${escapeHtml(outcome.badge)}
        </span>
        <h3 class="text-xl font-black text-slate-800 mb-2">Out of Cards!</h3>
        <p class="text-slate-500 text-sm mb-6">
          ${escapeHtml(outcome.message)}
        </p>
        <div id="retry-actions" class="space-y-3"></div>
      `;

      const actionsSlot = emptyBox.querySelector('#retry-actions');
      const retryBtn = new Button({
        text: 'Swipe Deck Again',
        variant: 'primary',
        onClick: () => {
          this.currentIndex = 0;
          this.renderDeckArea();
        },
      });
      const leaveBtn = new Button({
        text: 'Change Location',
        variant: 'neutral',
        onClick: () => {
          this.cleanup();
          this.onLeave();
        },
      });

      actionsSlot.appendChild(retryBtn.render());
      actionsSlot.appendChild(leaveBtn.render());
      stage.appendChild(emptyBox);
    }
  }

  render() {
    this.cleanup();
    this.wrapper.innerHTML = '';

    const navbar = new Navbar({
      roomCode: this.room.code,
      memberCount: this.room.members.length,
      onLeave: () => {
        this.cleanup();
        this.onLeave();
      },
    });
    this.wrapper.appendChild(navbar.render());

    const memberStrip = document.createElement('div');
    memberStrip.id = 'member-strip';
    memberStrip.className = 'w-full max-w-sm mx-auto';
    this.wrapper.appendChild(memberStrip);
    this.renderMemberStrip();

    const toastBanner = document.createElement('div');
    toastBanner.id = 'sync-toast';
    toastBanner.className =
      'hidden w-full max-w-sm mx-auto mb-3 py-2 px-4 bg-emerald-500 text-white text-xs font-bold rounded-full text-center shadow-md animate-fade-in';
    this.wrapper.appendChild(toastBanner);

    const stage = document.createElement('div');
    stage.id = 'swipe-stage';
    stage.className = 'flex-1 flex flex-col justify-center w-full';
    this.wrapper.appendChild(stage);

    this.renderDeckArea();
    document.addEventListener('keydown', this.handleKeyDown);

    this.unsubscribeSync = joinRoomSync(this.room, (event) => {
      navbar.updateMemberCount(this.room.members.length);
      this.renderMemberStrip();

      if (event.type === 'MEMBER_JOINED') {
        this.showBanner(`${event.memberCount} foodies are in the room!`, 'info', 3000);
      } else if (event.type === 'MATCH_FOUND') {
        this.cleanup();
        this.onMatchFound(event.restaurant);
      } else if (event.type === 'SYNC_ERROR') {
        this.showBanner(`Room sync failed: ${event.error.message}`, 'error', 4000);
      }
    });

    return this.wrapper;
  }
}