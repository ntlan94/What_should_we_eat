/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/components/Button.js
 * Description: Standardized reusable UI button component with disabled & label
 *              state helpers.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-16
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

export default class Button {
  constructor({ text, type = 'button', variant = 'primary', disabled = false, onClick = null }) {
    this.text = text;
    this.type = type;
    this.variant = variant;
    this.disabled = disabled;
    this.onClick = onClick;
    this.element = null;
  }

  setDisabled(isDisabled) {
    this.disabled = Boolean(isDisabled);
    if (this.element) {
      this.element.disabled = this.disabled;
    }
  }

  setText(newText) {
    this.text = newText;
    if (this.element) {
      this.element.textContent = newText;
    }
  }

  render() {
    const btn = document.createElement('button');
    btn.type = this.type;
    btn.disabled = this.disabled;

    const baseClasses =
      'w-full py-4 px-6 font-bold rounded-2xl shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-orange-500/25 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none',
      secondary:
        'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-rose-500/25 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none',
      neutral:
        'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm',
    };

    btn.className = `${baseClasses} ${variants[this.variant] || variants.primary}`;
    btn.textContent = this.text;

    if (this.onClick) {
      btn.addEventListener('click', this.onClick);
    }

    this.element = btn;
    return btn;
  }
}