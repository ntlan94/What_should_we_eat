/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/components/Navbar.js
 * Description: Top navigation bar displaying leave action, active foodie count,
 *              and a one-click copyable room code badge.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-16
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import { escapeHtml } from '../utils/html.js';

export default class Navbar {
  constructor({ roomCode, memberCount = 1, onLeave }) {
    this.roomCode = roomCode;
    this.memberCount = memberCount;
    this.onLeave = onLeave;
    this.memberCountEl = null;
  }

  /**
   * Updates the active member counter in-place without rebuilding the navbar.
   */
  updateMemberCount(count) {
    this.memberCount = count;
    if (this.memberCountEl) {
      this.memberCountEl.textContent = `${count} ${count === 1 ? 'foodie' : 'foodies'} active`;
    }
  }

  render() {
    const nav = document.createElement('nav');
    nav.className =
      'w-full max-w-md mx-auto bg-white px-5 py-3.5 rounded-2xl shadow-sm border border-orange-100 flex justify-between items-center mb-4';

    const homeBtn = document.createElement('button');
    homeBtn.type = 'button';
    homeBtn.className =
      'flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity cursor-pointer';
    homeBtn.title = 'Leave Room';
    homeBtn.innerHTML = `
      <span class="text-2xl" role="img" aria-label="pizza">🍕</span>
      <div>
        <span class="font-extrabold text-slate-800 tracking-tight text-base block leading-none">WSWE</span>
        <span class="text-[11px] font-semibold text-slate-400" id="nav-member-count">
          ${this.memberCount} ${this.memberCount === 1 ? 'foodie' : 'foodies'} active
        </span>
      </div>
    `;
    homeBtn.addEventListener('click', () => {
      if (this.onLeave) this.onLeave();
    });

    this.memberCountEl = homeBtn.querySelector('#nav-member-count');
    nav.appendChild(homeBtn);

    if (this.roomCode) {
      const badgeBtn = document.createElement('button');
      badgeBtn.type = 'button';
      badgeBtn.title = 'Click to copy room code';
      badgeBtn.className =
        'bg-orange-50 hover:bg-orange-100 px-3.5 py-1.5 rounded-xl border border-orange-200 transition-colors cursor-pointer';
      badgeBtn.innerHTML = `
        <span class="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Room</span>
        <span id="room-code-text" class="ml-1.5 font-black text-slate-800 tracking-widest text-sm">${escapeHtml(this.roomCode)}</span>
      `;

      badgeBtn.addEventListener('click', async () => {
        const codeLabel = badgeBtn.querySelector('#room-code-text');
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(this.roomCode);
          }
          if (codeLabel) {
            const original = escapeHtml(this.roomCode);
            codeLabel.textContent = 'COPIED!';
            setTimeout(() => {
              codeLabel.textContent = this.roomCode;
            }, 1200);
          }
        } catch {
          // Ignore clipboard permission errors in restricted browsers
        }
      });

      nav.appendChild(badgeBtn);
    }

    return nav;
  }
}